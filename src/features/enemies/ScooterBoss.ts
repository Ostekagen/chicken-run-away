import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { crowStunMs } from '../../upgrades';
import { clearCleavers, throwCleaver } from './cleavers';
import { dropEggThrow, onEggHit } from './powerupAdapter';
import { isLanding, levelOver, listen, playIfExists, playSound, showDizzy, showFrame } from './shared';

const BODY = { width: 54, height: 44, offsetX: 5, offsetY: 12 };
const DAZED_FRAME = 2;
const DAZED_TILT_DEGREES = 12;
const CRATE_SIZE = 32;
const PIP_SIZE = 6;
const PIP_GAP = 3;
const PIP_COLOR = 0xff5c5c;
// High enough to clear the dizzy stars.
const PIPS_ABOVE_PX = 28;
const HIT_FLASH_MS = 160;
const CRASH_MS = 220;
const SCATTER_MS = 700;
const REBUILD_POP_MS = 220;
const THROW_HEIGHT = 30;
const SPLASHES = 16;

type Mode = 'waiting' | 'driving' | 'dazed' | 'recovering' | 'defeated';

interface Pile {
  x: number;
  crates: Phaser.Physics.Arcade.Image[];
  standing: boolean;
}

// World 2's boss: rides a scooter across the arena throwing sausages, and crashes into the
// crate pile at the end of every ride. Dazed after a crash, he can be stomped or egged.
export class ScooterBoss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: GameScene;

  private mode: Mode = 'waiting';
  private hits = 0;
  private direction = 1;
  private turnAfterDaze = false;
  private dazedUntil = 0;
  private recoverUntil = 0;
  private safeUntil = 0;
  private throwsLeft = 0;
  private throwEveryMs = 0;
  private nextThrowAt = 0;
  private nextDropAt = 0;
  private dropSide = -1;
  private stopDizzy?: () => void;
  private readonly homeX: number;
  private readonly homeY: number;
  private readonly feetY: number;
  private readonly piles: Pile[];
  private readonly crates: Phaser.Physics.Arcade.StaticGroup;
  private readonly pips: Phaser.GameObjects.Rectangle[];

  constructor(scene: GameScene, x: number, feetY: number) {
    const { color, width, height, pileOffsetX, crateColor } = ENEMIES.scooterBoss;
    super(scene, x, feetY - height / 2, ensureTexture(scene, 'scooter-butcher', color, width, height));
    this.homeX = x;
    this.homeY = this.y;
    this.feetY = feetY;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(1);
    this.body.setSize(BODY.width, BODY.height).setOffset(BODY.offsetX, BODY.offsetY);
    this.body.setAllowGravity(false).setImmovable(true);
    scene.physics.add.overlap(scene.chicken, this, () => this.touch());
    showFrame(this, 0);

    // Two crates side by side with one on top, at each end of the arena. The chicken can stand on them.
    const crateKey = ensureTexture(scene, 'crate', crateColor, CRATE_SIZE, CRATE_SIZE);
    this.crates = scene.physics.add.staticGroup();
    this.piles = [-1, 1].map((side) => {
      const pileX = x + side * pileOffsetX;
      const spots = [[-0.5, 0.5], [0.5, 0.5], [0, 1.5]];
      const crates = spots.map(([dx, dy]) =>
        this.crates.create(pileX + dx * CRATE_SIZE, feetY - dy * CRATE_SIZE, crateKey) as Phaser.Physics.Arcade.Image);
      return { x: pileX, crates, standing: true };
    });
    scene.physics.add.collider(scene.chicken, this.crates);
    this.pips = this.createPips();

    listen(scene, Phaser.Scenes.Events.UPDATE, (time: number) => this.tick(time));
    listen(scene, 'chicken:crow', () => this.onCrow());
    listen(scene, 'chicken:respawned', () => this.onRespawned());
  }

  private createPips() {
    const { hitsToDefeat } = ENEMIES.scooterBoss;
    return Array.from({ length: hitsToDefeat }, () =>
      this.scene.add.rectangle(0, 0, PIP_SIZE, PIP_SIZE, PIP_COLOR).setDepth(3));
  }

  private placePips() {
    const live = this.pips.filter((pip) => pip.active);
    const firstX = this.x - ((live.length - 1) * (PIP_SIZE + PIP_GAP)) / 2;
    const y = this.homeY - this.displayHeight / 2 - PIPS_ABOVE_PX;
    live.forEach((pip, i) => pip.setPosition(firstX + i * (PIP_SIZE + PIP_GAP), y));
  }

  private tick(time: number) {
    if (this.mode === 'defeated' || levelOver(this.scene)) return;
    onEggHit(this.scene, this, () => this.hitByEgg());
    this.placePips();
    this.rebuildPiles();

    if (this.mode === 'waiting') {
      if (Math.abs(this.scene.chicken.x - this.x) < ENEMIES.scooterBoss.wakeDistanceX) {
        this.direction = this.scene.chicken.x < this.x ? 1 : -1;
        this.startRide(time);
      }
      return;
    }
    this.maybeDrop(time);
    if (this.mode === 'dazed') {
      if (time >= this.dazedUntil) this.recover(time);
    } else if (this.mode === 'recovering') {
      if (time >= this.recoverUntil) this.startRide(time);
    } else {
      this.ride(time);
    }
  }

  private phase() {
    const { phases, hitsToDefeat } = ENEMIES.scooterBoss;
    return phases[Math.min(phases.length - 1, Math.floor((this.hits * phases.length) / hitsToDefeat))];
  }

  // Where the scooter's front meets the crate pile it is driving at.
  private crashX() {
    const pile = this.piles[this.direction < 0 ? 0 : 1];
    return pile.x - this.direction * (CRATE_SIZE + BODY.width / 2);
  }

  private startRide(time: number) {
    const { firstDropMs } = ENEMIES.scooterBoss;
    if (this.nextDropAt < time) this.nextDropAt = time + firstDropMs;
    const { speed, throws } = this.phase();
    this.mode = 'driving';
    this.stopDizzy?.();
    this.setAngle(0).setFlipX(this.direction < 0);
    playIfExists(this, 'scooter-drive');
    const rideMs = (Math.abs(this.crashX() - this.x) / speed) * 1000;
    this.throwsLeft = throws;
    this.throwEveryMs = rideMs / (throws + 1);
    this.nextThrowAt = time + this.throwEveryMs;
  }

  private ride(time: number) {
    const { speed, flightMs } = this.phase();
    const { chicken } = this.scene;
    this.setVelocityX(this.direction * speed);
    if (this.throwsLeft > 0 && time >= this.nextThrowAt) {
      this.throwsLeft -= 1;
      this.nextThrowAt = time + this.throwEveryMs;
      // Never at point blank, so every sausage can be seen coming.
      if (Math.abs(chicken.x - this.x) > ENEMIES.scooterBoss.throwMinGapX) {
        throwCleaver(this.scene, this.x, this.y - THROW_HEIGHT, chicken.x, chicken.y, flightMs, 'sausage');
      }
    }
    if ((this.x - this.crashX()) * this.direction >= 0) this.crash();
  }

  // Into the crates: they fly everywhere and he sits there seeing stars.
  private crash() {
    const pile = this.piles[this.direction < 0 ? 0 : 1];
    this.setVelocityX(0);
    playSound(this.scene, 'sfx-hit');
    this.scene.cameras.main.shake(CRASH_MS, 0.006);
    this.scatter(pile);
    this.scene.tweens.add({ targets: this, x: this.x - this.direction * ENEMIES.scooterBoss.crashBounceX, duration: CRASH_MS, ease: 'Quad.easeOut' });
    this.turnAfterDaze = true;
    this.daze(this.phase().dazedMs);
  }

  private daze(ms: number) {
    const time = this.scene.time.now;
    this.mode = 'dazed';
    this.setVelocityX(0);
    this.dazedUntil = Math.max(this.dazedUntil, time + ms);
    showFrame(this, DAZED_FRAME);
    this.setAngle(this.direction * -DAZED_TILT_DEGREES);
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this, this.dazedUntil - time);
  }

  // Shakes it off, then turns round if he crashed, or rides on if the crow stopped him.
  private recover(time: number) {
    this.stopDizzy?.();
    this.dazedUntil = 0;
    this.mode = 'recovering';
    this.recoverUntil = time + ENEMIES.scooterBoss.recoverMs;
    this.setAngle(0);
    showFrame(this, 0);
    if (this.turnAfterDaze) this.direction *= -1;
    this.turnAfterDaze = false;
    this.setFlipX(this.direction < 0);
    this.scene.tweens.add({ targets: this, angle: { from: -4, to: 4 }, duration: 80, yoyo: true, repeat: 3, onComplete: () => this.setAngle(0) });
  }

  private onCrow() {
    if (this.mode === 'driving' || this.mode === 'dazed' || this.mode === 'recovering') this.daze(crowStunMs());
  }

  private touch() {
    const { chicken, time } = this.scene;
    const { stompBounce } = ENEMIES;
    const { safeAfterStompMs, stompPushSpeed } = ENEMIES.scooterBoss;
    if (this.mode === 'defeated' || levelOver(this.scene)) return;
    if (isLanding(this.scene, this.body)) {
      chicken.setVelocityY(-stompBounce);
      chicken.setVelocityX(chicken.x < this.x ? -stompPushSpeed : stompPushSpeed);
      playSound(this.scene, 'sfx-stomp');
      if (this.mode === 'dazed') {
        this.safeUntil = time.now + safeAfterStompMs;
        this.takeDamage(time.now);
      }
    } else if (this.mode === 'driving' && time.now >= this.safeUntil) {
      chicken.takeHit();
    }
  }

  // Eggs only count while he is dazed. Otherwise they bounce off the helmet.
  private hitByEgg() {
    if (this.mode === 'dazed') this.takeDamage(this.scene.time.now);
  }

  private takeDamage(time: number) {
    this.hits += 1;
    this.pips[this.hits - 1]?.destroy();
    playSound(this.scene, 'sfx-hit');
    this.setTint(0xff9999);
    this.scene.time.delayedCall(HIT_FLASH_MS, () => this.clearTint());
    if (this.hits >= ENEMIES.scooterBoss.hitsToDefeat) this.defeat();
    else this.recover(time);
  }

  private scatter(pile: Pile) {
    if (!pile.standing) return;
    pile.standing = false;
    for (const crate of pile.crates) {
      crate.disableBody(false, true);
      const away = crate.x < pile.x ? -1 : crate.x > pile.x ? 1 : this.direction;
      const flying = this.scene.add.image(crate.x, crate.y, crate.texture.key).setDepth(2);
      this.scene.tweens.add({
        targets: flying,
        x: flying.x + away * Phaser.Math.Between(40, 90),
        y: flying.y - Phaser.Math.Between(30, 70),
        angle: away * Phaser.Math.Between(90, 270),
        alpha: 0,
        duration: SCATTER_MS,
        ease: 'Quad.easeOut',
        onComplete: () => flying.destroy(),
      });
    }
  }

  // Fallen piles come back each round, once he is riding away and the chicken isn't in the spot.
  private rebuildPiles() {
    if (this.mode !== 'driving' && this.mode !== 'waiting') return;
    const chicken = this.scene.chicken.getBounds();
    for (const [i, pile] of this.piles.entries()) {
      const ridingAt = (this.direction < 0 ? 0 : 1) === i;
      if (pile.standing || (ridingAt && this.mode === 'driving')) continue;
      const spot = new Phaser.Geom.Rectangle(pile.x - CRATE_SIZE, this.feetY - CRATE_SIZE * 2, CRATE_SIZE * 2, CRATE_SIZE * 2);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(spot, chicken)) this.restorePile(pile);
    }
  }

  private restorePile(pile: Pile) {
    pile.standing = true;
    for (const crate of pile.crates) {
      crate.enableBody(false, 0, 0, true, true);
      crate.setScale(0.4);
      this.scene.tweens.add({ targets: crate, scale: 1, duration: REBUILD_POP_MS, ease: 'Back.easeOut' });
    }
  }

  private maybeDrop(time: number) {
    const { dropEveryMs, dropOffsetX } = ENEMIES.scooterBoss;
    if (time < this.nextDropAt) return;
    this.nextDropAt = time + dropEveryMs;
    this.dropSide *= -1;
    dropEggThrow(this.scene, this.homeX + this.dropSide * dropOffsetX, this.feetY);
  }

  private onRespawned() {
    if (this.mode === 'defeated') return;
    clearCleavers(this.scene);
    this.stopDizzy?.();
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0).clearTint();
    showFrame(this, 0);
    this.mode = 'waiting';
    this.dazedUntil = 0;
    this.turnAfterDaze = false;
    this.nextDropAt = 0;
    this.body.reset(this.homeX, this.homeY);
    this.piles.forEach((pile) => { if (!pile.standing) this.restorePile(pile); });
  }

  // Revs up, rides off the quay and tips head first into the harbour.
  private defeat() {
    const { scene } = this;
    const { harbourOffsetX, tipOverMs, tipArcHeight, sinkMs, finishDelayMs } = ENEMIES.scooterBoss;
    this.mode = 'defeated';
    this.stopDizzy?.();
    this.disableBody();
    scene.tweens.killTweensOf(this);
    this.clearTint().setAngle(0);
    clearCleavers(scene);
    this.piles.forEach((pile) => this.scatter(pile));

    const room = scene.physics.world.bounds.right - this.homeX;
    const side = room > harbourOffsetX + ENEMIES.scooterBoss.width ? 1 : -1;
    const startX = this.x;
    const landX = this.homeX + side * harbourOffsetX;
    this.setFlipX(side < 0);
    playIfExists(this, 'scooter-drive');

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: tipOverMs,
      ease: 'Sine.easeIn',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        // Flat along the quay at first, then up over the edge in a wobbly arc.
        const arc = t < 0.5 ? 0 : tipArcHeight * 4 * (t - 0.5) * (1 - t) * 2;
        this.setPosition(Phaser.Math.Linear(startX, landX, t), this.homeY - arc);
        this.setAngle(side * 110 * Math.max(0, t - 0.5) * 2);
      },
      onComplete: () => {
        this.stop();
        this.splash(landX);
        // Behind the ground tiles, so he sinks out of sight.
        this.setDepth(-1);
        scene.tweens.add({ targets: this, y: this.y + 80, alpha: 0, duration: sinkMs, ease: 'Quad.easeIn' });
        scene.time.delayedCall(finishDelayMs, () => scene.finishLevel());
      },
    });
  }

  private splash(x: number) {
    const { scene } = this;
    const { splashColor } = ENEMIES.scooterBoss;
    playSound(scene, scene.cache.audio.exists('sfx-splash') ? 'sfx-splash' : 'sfx-stomp');
    scene.cameras.main.shake(250, 0.008);
    for (let i = 0; i < SPLASHES; i++) {
      const drop = scene.add.circle(x, this.feetY - 6, Phaser.Math.Between(3, 6), splashColor).setDepth(3);
      scene.tweens.add({
        targets: drop,
        x: x + Phaser.Math.Between(-80, 80),
        y: this.feetY - Phaser.Math.Between(50, 130),
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        ease: 'Quad.easeOut',
        onComplete: () => drop.destroy(),
      });
    }
  }
}
