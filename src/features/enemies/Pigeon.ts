import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { crowStunMs } from '../../upgrades';
import type { Foe } from './Enemy';
import { isLanding, levelOver, playIfExists, playSound, showDizzy } from './shared';

const TELL_RISE_PX = 8;
const SQUASHED_SCALE = 0.4;
const SQUASHED_MS = 100;
const TUMBLE_DROP_PX = 260;
const TUMBLE_MS = 900;
const FLY_OFF_X = 320;
const FLY_OFF_Y = 240;
const FLY_OFF_MS = 1000;
const FEATHERS = 5;
const FEATHER_COLOR = 0xe4e7ee;

type Mode = 'cruise' | 'tell' | 'swoop';

// Flies back and forth in a gentle wave, and swoops at a chicken passing below.
export class Pigeon extends Phaser.Physics.Arcade.Sprite implements Foe {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: GameScene;

  alive = true;
  sprite = this;

  private readonly homeX: number;
  private readonly homeY: number;
  private mode: Mode = 'cruise';
  private direction = -1;
  private lastTime = 0;
  private waveClock = 0;
  private stunnedUntil = 0;
  private stopDizzy?: () => void;
  private modeStartedAt = 0;
  private nextSwoopAt = 0;
  private swoopFrom = new Phaser.Math.Vector2();
  private swoopTo = new Phaser.Math.Vector2();

  constructor(scene: GameScene, x: number, feetY: number) {
    const { color, width, height } = ENEMIES.kinds.pigeon;
    super(scene, x, feetY - height / 2, ensureTexture(scene, 'pigeon', color, width, height));
    this.homeX = this.x;
    this.homeY = this.y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    scene.physics.add.overlap(scene.chicken, this, () => this.touch());
    playIfExists(this, 'pigeon-fly');
  }

  tick(time: number) {
    const dt = Math.min(time - this.lastTime, 50);
    this.lastTime = time;
    if (time < this.stunnedUntil) {
      this.anims.pause();
      return;
    }
    this.anims.resume();
    if (this.mode === 'cruise') this.cruise(time, dt);
    else if (this.mode === 'tell') this.tell(time);
    else this.swoop(time);
    this.setFlipX(this.direction < 0);
  }

  stun(time: number) {
    this.stunnedUntil = time + crowStunMs();
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this, crowStunMs());
  }

  reset(time: number) {
    this.stopDizzy?.();
    this.stunnedUntil = 0;
    this.mode = 'cruise';
    this.direction = -1;
    this.waveClock = 0;
    this.nextSwoopAt = time + ENEMIES.pigeon.swoopCooldownMs;
    this.setPosition(this.homeX, this.homeY);
    this.body.reset(this.homeX, this.homeY);
  }

  hitByEgg() {
    if (!this.alive) return;
    this.defeat();
    const away = this.x < this.scene.chicken.x ? -1 : 1;
    playSound(this.scene, 'sfx-stomp');
    this.puffFeathers();
    this.scene.tweens.add({
      targets: this,
      x: this.x + away * FLY_OFF_X,
      y: this.y - FLY_OFF_Y,
      angle: away * 720,
      duration: FLY_OFF_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private cruise(time: number, dt: number) {
    const { rangeX, waveY, waveMs } = ENEMIES.pigeon;
    const speed = ENEMIES.kinds.pigeon.speed;
    if (this.x > this.homeX + rangeX) this.direction = -1;
    else if (this.x < this.homeX - rangeX) this.direction = 1;
    this.waveClock += dt;
    const bounds = this.scene.physics.world.bounds;
    const x = Phaser.Math.Clamp(this.x + (this.direction * speed * dt) / 1000, bounds.left, bounds.right);
    this.setPosition(x, this.homeY + waveY * Math.sin((this.waveClock / waveMs) * Math.PI * 2));
    if (time >= this.nextSwoopAt && this.seesChickenBelow()) {
      this.mode = 'tell';
      this.modeStartedAt = time;
      this.swoopFrom.set(this.x, this.y);
      this.direction = Math.sign(this.scene.chicken.x - this.x) || this.direction;
    }
  }

  // Flutters up a little so the swoop can be seen coming.
  private tell(time: number) {
    const { tellMs } = ENEMIES.pigeon;
    const t = Math.min(1, (time - this.modeStartedAt) / tellMs);
    this.setPosition(this.swoopFrom.x, this.swoopFrom.y - TELL_RISE_PX * Math.sin(t * Math.PI));
    if (t < 1) return;
    const { chicken } = this.scene;
    this.mode = 'swoop';
    this.modeStartedAt = time;
    this.swoopTo.set(chicken.x, chicken.y);
    this.direction = Math.sign(chicken.x - this.x) || this.direction;
  }

  // Dives through where the chicken was, and climbs back to cruising height beyond it.
  private swoop(time: number) {
    const { swoopMs, swoopCooldownMs } = ENEMIES.pigeon;
    const t = Math.min(1, (time - this.modeStartedAt) / swoopMs);
    const { x: fromX, y: fromY } = this.swoopFrom;
    const { x: toX, y: toY } = this.swoopTo;
    const bounds = this.scene.physics.world.bounds;
    const x = Phaser.Math.Clamp(Phaser.Math.Linear(fromX, fromX + 2 * (toX - fromX), t), bounds.left, bounds.right);
    const baseY = Phaser.Math.Linear(fromY, this.homeY, t);
    const dip = toY - Phaser.Math.Linear(fromY, this.homeY, 0.5);
    this.setPosition(x, baseY + dip * Math.sin(t * Math.PI));
    if (t < 1) return;
    this.mode = 'cruise';
    this.waveClock = 0;
    this.nextSwoopAt = time + swoopCooldownMs;
  }

  private seesChickenBelow() {
    const { chicken } = this.scene;
    const { swoopNoticeX, swoopMinDropY, swoopMaxDropY } = ENEMIES.pigeon;
    const drop = chicken.y - this.y;
    return Math.abs(chicken.x - this.x) < swoopNoticeX && drop > swoopMinDropY && drop < swoopMaxDropY;
  }

  private touch() {
    if (levelOver(this.scene) || !this.alive) return;
    const stunned = this.scene.time.now < this.stunnedUntil;
    if (isLanding(this.scene, this.body)) this.stomped();
    else if (!stunned) this.scene.chicken.takeHit();
  }

  // Squashed flat, then tumbles out of the sky in a puff of feathers.
  private stomped() {
    this.defeat();
    this.scene.chicken.setVelocityY(-ENEMIES.stompBounce);
    playSound(this.scene, 'sfx-stomp');
    this.puffFeathers();
    this.scene.tweens.add({ targets: this, scaleY: SQUASHED_SCALE, duration: SQUASHED_MS });
    this.scene.tweens.add({
      targets: this,
      y: this.y + TUMBLE_DROP_PX,
      angle: 180,
      alpha: 0,
      delay: SQUASHED_MS,
      duration: TUMBLE_MS,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  private defeat() {
    this.alive = false;
    this.stopDizzy?.();
    this.anims.pause();
    this.disableBody();
  }

  private puffFeathers() {
    for (let i = 0; i < FEATHERS; i++) {
      const feather = this.scene.add.ellipse(this.x, this.y, 6, 3, FEATHER_COLOR).setDepth(5);
      this.scene.tweens.add({
        targets: feather,
        x: this.x + Phaser.Math.Between(-30, 30),
        y: this.y + Phaser.Math.Between(-20, 30),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 700,
        onComplete: () => feather.destroy(),
      });
    }
  }
}
