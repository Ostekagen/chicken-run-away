import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { isLanding, isStandable, levelOver, playSound, showDizzy } from './shared';

export type EnemyKind = keyof typeof ENEMIES.kinds;
export type WalkingKind = Exclude<EnemyKind, 'van'>;

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
    this.play(`${kind}-walk`);
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
    else this.patrol(ENEMIES.kinds[this.kind].speed);
    this.setFlipX(this.direction < 0);
  }

  stun(time: number) {
    this.stunnedUntil = time + ENEMIES.stunMs;
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this, ENEMIES.stunMs);
  }

  reset(time: number) {
    this.stopDizzy?.();
    this.stunnedUntil = 0;
    this.charging = false;
    this.burstUntil = 0;
    this.restUntil = 0;
    this.nextHopAt = time;
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

  private noticesChicken(rangeX: number) {
    const { chicken } = this.scene;
    return Math.abs(chicken.x - this.x) < rangeX && Math.abs(chicken.y - this.y) < ENEMIES.noticeY;
  }
}
