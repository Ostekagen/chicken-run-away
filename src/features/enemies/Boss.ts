import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { clearCleavers, throwCleaver } from './cleavers';
import { dropEggThrow, onEggHit } from './powerupAdapter';
import { isLanding, levelOver, listen, playSound, showDizzy, showThrow } from './shared';

const BODY = { width: 28, height: 52, offsetX: 6, offsetY: 4 };
const TIRED_LEAN_DEGREES = 8;
const PIP_SIZE = 6;
const PIP_GAP = 3;
const PIP_COLOR = 0xff5c5c;
const HIT_FLASH_MS = 160;
const SPLASHES = 10;
const MUD_COLOR = 0x6b4a2f;

type Mode = 'waiting' | 'attacking' | 'dazed' | 'defeated';

// The final fight: volleys of cleavers, each followed by a tired spell to hit him in.
export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: GameScene;

  private mode: Mode = 'waiting';
  private hits = 0;
  private throwsLeft = 0;
  private nextThrowAt = 0;
  private dazedUntil = 0;
  private safeUntil = 0;
  private eggProofUntil = 0;
  private nextDropAt = 0;
  private dropSide = -1;
  private stopDizzy?: () => void;
  private readonly homeY: number;
  private readonly pipRow: Phaser.GameObjects.Rectangle[];
  private readonly pen: Phaser.GameObjects.Image;

  constructor(scene: GameScene, x: number, feetY: number) {
    const { color, scale, penColor, penWidth, penHeight, penOffsetX } = ENEMIES.boss;
    const { width, height } = ENEMIES.butcher;
    super(scene, x, feetY - (height * scale) / 2, ensureTexture(scene, 'butcher', color, width, height));
    this.homeY = this.y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(scale).setDepth(1);
    this.body.setSize(BODY.width, BODY.height).setOffset(BODY.offsetX, BODY.offsetY);
    this.body.setAllowGravity(false).setImmovable(true);
    scene.physics.add.overlap(scene.chicken, this, () => this.touch());

    const room = scene.physics.world.bounds.right - x - penWidth / 2;
    const penX = x + (room > penOffsetX ? penOffsetX : -penOffsetX);
    const penKey = ensureTexture(scene, 'pig-pen', penColor, penWidth, penHeight);
    this.pen = scene.add.image(penX, feetY - penHeight / 2, penKey).setDepth(2);
    this.pipRow = this.createPips();

    listen(scene, Phaser.Scenes.Events.UPDATE, (time: number) => this.tick(time));
    listen(scene, 'chicken:crow', () => this.onCrow());
    listen(scene, 'chicken:respawned', () => this.onRespawned());
  }

  private createPips() {
    const { hitsToDefeat } = ENEMIES.boss;
    const firstX = this.x - ((hitsToDefeat - 1) * (PIP_SIZE + PIP_GAP)) / 2;
    const y = this.y - this.displayHeight / 2 - 18;
    return Array.from({ length: hitsToDefeat }, (_, i) =>
      this.scene.add.rectangle(firstX + i * (PIP_SIZE + PIP_GAP), y, PIP_SIZE, PIP_SIZE, PIP_COLOR).setDepth(3));
  }

  private tick(time: number) {
    if (this.mode === 'defeated' || levelOver(this.scene)) return;
    onEggHit(this.scene, this, () => this.hitByEgg(time));
    if (this.hits >= ENEMIES.boss.hitsToDefeat) return;

    const { chicken } = this.scene;
    this.setFlipX(chicken.x < this.x);
    if (this.mode === 'waiting') {
      if (Math.abs(chicken.x - this.x) < ENEMIES.boss.wakeDistanceX) this.startVolley(time);
      return;
    }
    this.maybeDrop(time);
    if (this.mode === 'dazed') {
      if (time >= this.dazedUntil) this.startVolley(time);
    } else if (time >= this.nextThrowAt) {
      if (this.throwsLeft > 0) this.throwFan(time);
      else this.daze(this.phase().tiredMs);
    }
  }

  private phase() {
    const { phases, hitsToDefeat } = ENEMIES.boss;
    return phases[Math.floor((this.hits * phases.length) / hitsToDefeat)];
  }

  private startVolley(time: number) {
    if (this.nextDropAt < time) this.nextDropAt = time + ENEMIES.boss.firstDropMs;
    this.stopDizzy?.();
    this.setAngle(0);
    this.mode = 'attacking';
    this.throwsLeft = this.phase().throws;
    this.nextThrowAt = Math.max(this.nextThrowAt, time + this.phase().gapMs);
  }

  private throwFan(time: number) {
    const { chicken } = this.scene;
    const { fanSpreadX, throwFlightMs } = ENEMIES.boss;
    const { fan, gapMs } = this.phase();
    for (let i = 0; i < fan; i++) {
      const offset = (i - (fan - 1) / 2) * fanSpreadX;
      throwCleaver(this.scene, this.x, this.y - 30, chicken.x + offset, chicken.y, throwFlightMs);
      showThrow(this);
    }
    this.throwsLeft -= 1;
    this.nextThrowAt = time + gapMs;
  }

  private daze(ms: number) {
    const time = this.scene.time.now;
    this.mode = 'dazed';
    this.dazedUntil = Math.max(this.dazedUntil, time + ms);
    this.setAngle(this.flipX ? -TIRED_LEAN_DEGREES : TIRED_LEAN_DEGREES);
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this, this.dazedUntil - time);
  }

  private onCrow() {
    if (this.mode === 'attacking' || this.mode === 'dazed') this.daze(ENEMIES.stunMs);
  }

  private touch() {
    const { chicken, time } = this.scene;
    const { stompBounce } = ENEMIES;
    const { safeAfterStompMs, stompPushSpeed } = ENEMIES.boss;
    if (this.mode === 'defeated' || levelOver(this.scene)) return;
    if (isLanding(this.scene, this.body)) {
      chicken.setVelocityY(-stompBounce);
      chicken.setVelocityX(chicken.x < this.x ? -stompPushSpeed : stompPushSpeed);
      playSound(this.scene, 'sfx-stomp');
      if (this.mode === 'dazed') {
        this.takeDamage(time.now);
        this.safeUntil = time.now + safeAfterStompMs;
        this.nextThrowAt = time.now + safeAfterStompMs;
        this.dazedUntil = 0;
      }
    } else if (this.mode === 'attacking' && time.now >= this.safeUntil) {
      chicken.takeHit();
    }
  }

  // Eggs that land too soon after the last one just splat, so all three phases get played.
  private hitByEgg(time: number) {
    if (time < this.eggProofUntil) return;
    this.eggProofUntil = time + ENEMIES.boss.eggProofMs;
    this.takeDamage(time);
  }

  private takeDamage(time: number) {
    this.hits += 1;
    this.pipRow[this.hits - 1]?.destroy();
    playSound(this.scene, 'sfx-hit');
    this.setTint(0xff9999);
    this.scene.time.delayedCall(HIT_FLASH_MS, () => this.clearTint());
    if (this.hits >= ENEMIES.boss.hitsToDefeat) this.defeat();
    else if (this.mode === 'waiting') this.startVolley(time);
  }

  private maybeDrop(time: number) {
    const { dropEveryMs, dropOffsetX } = ENEMIES.boss;
    if (time < this.nextDropAt) return;
    this.nextDropAt = time + dropEveryMs;
    this.dropSide *= -1;
    dropEggThrow(this.scene, this.x + this.dropSide * dropOffsetX, this.feetY());
  }

  private feetY() {
    return this.homeY + this.displayHeight / 2;
  }

  private onRespawned() {
    if (this.mode === 'defeated') return;
    clearCleavers(this.scene);
    this.stopDizzy?.();
    this.setAngle(0);
    this.mode = 'waiting';
    this.dazedUntil = 0;
    this.nextThrowAt = 0;
  }

  // Knocked up in a big arc, head first into the pig pen, legs sticking out.
  private defeat() {
    const { scene, pen } = this;
    const { knockedAwayMs, knockedArcHeight, finishDelayMs } = ENEMIES.boss;
    const startX = this.x;
    const startY = this.y;
    const landY = startY - 6;
    this.mode = 'defeated';
    this.stopDizzy?.();
    this.disableBody();
    this.clearTint();
    clearCleavers(scene);

    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: knockedAwayMs,
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        this.setPosition(
          Phaser.Math.Linear(startX, pen.x, t),
          Phaser.Math.Linear(startY, landY, t) - knockedArcHeight * 4 * t * (1 - t),
        );
        this.setAngle(540 * t);
      },
      onComplete: () => {
        this.splash();
        scene.tweens.add({ targets: this, angle: { from: 170, to: 190 }, duration: 120, yoyo: true, repeat: 8 });
        scene.time.delayedCall(finishDelayMs, () => scene.finishLevel());
      },
    });
  }

  private splash() {
    const { scene, pen } = this;
    playSound(scene, 'sfx-stomp');
    for (let i = 0; i < SPLASHES; i++) {
      const blob = scene.add.circle(pen.x, pen.y - 10, 4, MUD_COLOR).setDepth(3);
      scene.tweens.add({
        targets: blob,
        x: pen.x + Phaser.Math.Between(-70, 70),
        y: pen.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => blob.destroy(),
      });
    }
  }
}
