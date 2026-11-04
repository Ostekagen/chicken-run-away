import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { CHICKEN, ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { crowStunMs } from '../../upgrades';
import { isLanding, isStandable, levelOver, playIfExists, playSound, showDizzy, showFrame } from './shared';

export type EnemyKind = keyof typeof ENEMIES.kinds;
export type WalkingKind = Exclude<EnemyKind, 'van' | 'pigeon'>;

const CAT_POUNCE_FRAME = 2;
const CAT_WIGGLE_DEGREES = 7;
const CAT_WIGGLE_MS = 70;
const CAT_HOME_SLACK_PX = 6;
const POUNCE_LANDING_STEP_PX = 16;

const SQUASHED_SCALE = 0.2;
const SQUASHED_MS = 120;
const SQUASHED_HOLD_MS = 500;
const RUN_OFF_PX = 420;
const RUN_OFF_MS = 1100;
const RUN_OFF_HOP_MS = 100;

// Everything the enemy list needs, so the van can behave differently.
export interface Foe {
  alive: boolean;
  tick(time: number): void;
  stun(time: number): void;
  reset(time: number): void;
  hitByEgg(): void;
  sprite: Phaser.Physics.Arcade.Sprite;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite implements Foe {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: GameScene;

  alive = true;
  sprite = this;

  private readonly homeX: number;
  private readonly homeY: number;
  private direction = -1;
  private stunnedUntil = 0;
  private stopDizzy?: () => void;
  private charging = false;
  private chargeAt = 0;
  private burstUntil = 0;
  private restUntil = 0;
  private nextHopAt = 0;
  private catMode: 'crouched' | 'tell' | 'pouncing' | 'resting' = 'crouched';
  private pouncedAt = 0;
  private wiggle?: Phaser.Tweens.Tween;

  constructor(scene: GameScene, private readonly kind: WalkingKind, x: number, feetY: number) {
    const { color, width, height } = ENEMIES.kinds[kind];
    super(scene, x, feetY - height / 2, ensureTexture(scene, kind, color, width, height));
    this.homeX = this.x;
    this.homeY = this.y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);
    scene.physics.add.collider(this, scene.ground);
    scene.physics.add.overlap(scene.chicken, this, () => this.touch());
    if (kind === 'cat') showFrame(this, 0);
    else playIfExists(this, `${kind}-walk`);
  }

  tick(time: number) {
    if (this.y > this.scene.ground.tilemap.heightInPixels) {
      this.reset(time);
      return;
    }
    if (time < this.stunnedUntil) {
      this.setVelocityX(0);
      this.anims.pause();
      return;
    }
    this.anims.resume();
    if (this.kind === 'dog') this.dog(time);
    else if (this.kind === 'goose') this.goose(time);
    else if (this.kind === 'fox') this.fox(time);
    else if (this.kind === 'cat') this.cat(time);
    else this.patrol(ENEMIES.kinds[this.kind].speed);
    // Crabs walk sideways, so they never turn round.
    if (this.kind !== 'crab') this.setFlipX(this.direction < 0);
  }

  stun(time: number) {
    if (this.kind === 'cat') this.crouch();
    this.stunnedUntil = time + crowStunMs();
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this, crowStunMs());
  }

  reset(time: number) {
    this.stopDizzy?.();
    this.stunnedUntil = 0;
    this.charging = false;
    this.burstUntil = 0;
    this.restUntil = 0;
    this.nextHopAt = time;
    if (this.kind === 'cat') this.crouch();
    this.body.reset(this.homeX, this.homeY);
  }

  hitByEgg() {
    if (!this.alive) return;
    this.defeat();
    const away = this.x < this.scene.chicken.x ? -1 : 1;
    this.setFlipX(away < 0);
    playSound(this.scene, 'sfx-stomp');
    this.scene.tweens.add({
      targets: this,
      x: this.x + away * RUN_OFF_PX,
      duration: RUN_OFF_MS,
      onComplete: () => this.destroy(),
    });
    this.scene.tweens.add({ targets: this, y: this.y - 8, duration: RUN_OFF_HOP_MS, yoyo: true, repeat: RUN_OFF_MS / (RUN_OFF_HOP_MS * 2) - 1 });
  }

  private touch() {
    if (levelOver(this.scene)) return;
    const stunned = this.scene.time.now < this.stunnedUntil;
    if (isLanding(this.scene, this.body)) this.stomped();
    else if (!stunned) this.scene.chicken.takeHit();
  }

  private stomped() {
    this.defeat();
    this.scene.chicken.setVelocityY(-ENEMIES.stompBounce);
    playSound(this.scene, 'sfx-stomp');
    this.scene.tweens.add({
      targets: this,
      scaleY: SQUASHED_SCALE,
      y: this.y + (this.displayHeight * (1 - SQUASHED_SCALE)) / 2,
      duration: SQUASHED_MS,
    });
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: SQUASHED_MS + SQUASHED_HOLD_MS,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }

  private defeat() {
    this.alive = false;
    this.stopDizzy?.();
    this.stopWiggle();
    this.disableBody();
  }

  private patrol(speed: number) {
    if (this.body.blocked.down && (this.atWall() || !this.groundAhead(2))) this.direction *= -1;
    this.setVelocityX(this.direction * speed);
  }

  private dog(time: number) {
    const { noticeX, kinds } = ENEMIES;
    const { tellMs, chargeSpeed, loseInterestX } = ENEMIES.dog;
    const gap = this.scene.chicken.x - this.x;
    if (!this.charging && this.noticesChicken(noticeX)) {
      this.charging = true;
      this.chargeAt = time + tellMs;
    } else if (this.charging && Math.abs(gap) > loseInterestX) {
      this.charging = false;
    }
    if (!this.charging) {
      this.patrol(kinds.dog.speed);
    } else {
      if (Math.abs(gap) > 6) this.direction = Math.sign(gap);
      this.dash(time < this.chargeAt ? 0 : chargeSpeed);
    }
  }

  private goose(time: number) {
    const { burstSpeed, burstMs, restMs } = ENEMIES.goose;
    const notices = this.noticesChicken(ENEMIES.noticeX);
    if (notices && time >= this.restUntil) {
      this.burstUntil = time + burstMs;
      this.restUntil = this.burstUntil + restMs;
      this.direction = Math.sign(this.scene.chicken.x - this.x) || this.direction;
    }
    if (time < this.burstUntil) this.dash(burstSpeed);
    else if (notices) this.setVelocityX(0);
    else this.patrol(ENEMIES.kinds.goose.speed);
  }

  private fox(time: number) {
    const { hopSpeed, hopRunSpeed, hopEveryMs, hopLandingX } = ENEMIES.fox;
    const notices = this.noticesChicken(ENEMIES.noticeX);
    if (!this.body.blocked.down) {
      this.setVelocityX(this.direction * hopRunSpeed);
      return;
    }
    if (notices) this.direction = Math.sign(this.scene.chicken.x - this.x) || this.direction;
    if (time >= this.nextHopAt && this.groundAhead(hopLandingX)) {
      this.nextHopAt = time + hopEveryMs;
      this.setVelocityY(-hopSpeed);
      return;
    }
    this.patrol(ENEMIES.kinds.fox.speed);
  }

  // Crouches until the chicken comes close, wiggles, then pounces at it in an arc.
  private cat(time: number) {
    const { noticeX, tellMs, restMs } = ENEMIES.cat;
    const onGround = this.body.blocked.down;
    if (this.catMode === 'pouncing') {
      if (onGround && time > this.pouncedAt + 100) {
        this.catMode = 'resting';
        this.restUntil = time + restMs;
        this.setVelocityX(0);
        showFrame(this, 0);
      }
      return;
    }
    if (this.catMode === 'tell') {
      this.setVelocityX(0);
      if (time >= this.chargeAt) this.pounce(time);
      return;
    }
    if (this.catMode === 'resting' && time < this.restUntil) {
      this.setVelocityX(0);
      return;
    }
    this.catMode = 'crouched';
    if (onGround && this.noticesChicken(noticeX, ENEMIES.cat.noticeY)) {
      this.direction = Math.sign(this.scene.chicken.x - this.x) || this.direction;
      this.catMode = 'tell';
      this.chargeAt = time + tellMs;
      this.setVelocityX(0);
      showFrame(this, 0);
      this.wiggle = this.scene.tweens.add({
        targets: this,
        angle: { from: -CAT_WIGGLE_DEGREES, to: CAT_WIGGLE_DEGREES },
        duration: CAT_WIGGLE_MS,
        yoyo: true,
        repeat: -1,
      });
      return;
    }
    // Strolls back to its spot after a pounce.
    const gap = this.homeX - this.x;
    if (onGround && Math.abs(gap) > CAT_HOME_SLACK_PX) {
      this.direction = Math.sign(gap);
      playIfExists(this, 'cat-walk');
      this.dash(ENEMIES.kinds.cat.speed);
    } else {
      this.setVelocityX(0);
      if (this.anims.isPlaying) showFrame(this, 0);
    }
  }

  // Jumps to land where the chicken is, or as near as the ground allows.
  private pounce(time: number) {
    const { pounceSpeed, minPounceX, maxPounceX } = ENEMIES.cat;
    this.stopWiggle();
    const wanted = Phaser.Math.Clamp(Math.abs(this.scene.chicken.x - this.x), minPounceX, maxPounceX);
    let distance = wanted;
    while (distance >= minPounceX && !this.groundAhead(distance - this.body.halfWidth)) {
      distance -= POUNCE_LANDING_STEP_PX;
    }
    if (distance < minPounceX) {
      this.catMode = 'resting';
      this.restUntil = time + ENEMIES.cat.restMs;
      return;
    }
    const airSeconds = (2 * pounceSpeed) / CHICKEN.gravity;
    this.catMode = 'pouncing';
    this.pouncedAt = time;
    this.setVelocity((this.direction * distance) / airSeconds, -pounceSpeed);
    showFrame(this, CAT_POUNCE_FRAME);
  }

  private crouch() {
    this.catMode = 'crouched';
    this.stopWiggle();
    showFrame(this, 0);
  }

  private stopWiggle() {
    this.wiggle?.stop();
    this.wiggle = undefined;
    this.setAngle(0);
  }

  // Runs at the chicken, but never off a ledge.
  private dash(speed: number) {
    const stop = this.body.blocked.down && !this.groundAhead(2);
    this.setVelocityX(stop ? 0 : this.direction * speed);
  }

  private atWall() {
    return this.direction < 0 ? this.body.blocked.left : this.body.blocked.right;
  }

  private groundAhead(distance: number) {
    const x = this.x + this.direction * (this.body.halfWidth + distance);
    return isStandable(this.scene, x, this.body.bottom + 4);
  }

  private noticesChicken(rangeX: number, rangeY = ENEMIES.noticeY) {
    const { chicken } = this.scene;
    return Math.abs(chicken.x - this.x) < rangeX && Math.abs(chicken.y - this.y) < rangeY;
  }
}
