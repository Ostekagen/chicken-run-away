import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import type { Foe } from './Enemy';
import { levelOver, showDizzy } from './shared';

const OFF_SCREEN_PX = 60;
const WARNING_WIDTH = 12;
const WARNING_HEIGHT = 40;
const WARNING_BLINK_MS = 100;

// Waits out of sight, then drives past the chicken after a warning at the screen edge.
export class Van extends Phaser.Physics.Arcade.Sprite implements Foe {
  declare body: Phaser.Physics.Arcade.Body;
  declare scene: GameScene;

  alive = true;
  sprite = this;

  private readonly homeX: number;
  private direction = -1;
  private mode: 'parked' | 'warning' | 'driving' = 'parked';
  private nextDriveAt = 0;
  private driveAt = 0;
  private stunnedUntil = 0;
  private warning?: Phaser.GameObjects.Rectangle;

  constructor(scene: GameScene, x: number, feetY: number) {
    const { color, width, height } = ENEMIES.kinds.van;
    super(scene, x, feetY - height / 2, ensureTexture(scene, 'van', color, width, height));
    this.homeX = x;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.play('van-drive');
    this.park(0);
    scene.physics.add.overlap(scene.chicken, this, () => {
      if (this.scene.time.now >= this.stunnedUntil && !levelOver(this.scene)) this.scene.chicken.takeHit();
    });
  }

  tick(time: number) {
    if (time < this.stunnedUntil) {
      this.setVelocityX(0);
    } else if (this.mode === 'parked') {
      if (time >= this.nextDriveAt && this.noticesChicken()) this.warn(time);
    } else if (this.mode === 'warning') {
      if (time >= this.driveAt) this.drive();
    } else {
      this.setVelocityX(this.direction * ENEMIES.kinds.van.speed);
      if (this.isPast()) this.park(time);
    }
  }

  stun(time: number) {
    if (this.mode !== 'driving') return;
    this.stunnedUntil = time + ENEMIES.stunMs;
    showDizzy(this.scene, this, ENEMIES.stunMs);
  }

  reset(time: number) {
    this.park(time);
    this.stunnedUntil = 0;
  }

  // Eggs just bounce off.
  hitByEgg() {}

  private park(time: number) {
    this.mode = 'parked';
    this.nextDriveAt = time + ENEMIES.van.pauseMs;
    this.warning?.destroy();
    this.disableBody(false, true);
  }

  private warn(time: number) {
    const { worldView } = this.scene.cameras.main;
    this.mode = 'warning';
    this.driveAt = time + ENEMIES.van.warnMs;
    this.direction = this.homeX < this.scene.chicken.x ? 1 : -1;
    const edge = this.direction > 0 ? worldView.left + WARNING_WIDTH : worldView.right - WARNING_WIDTH;
    this.warning = this.scene.add.rectangle(edge, this.y, WARNING_WIDTH, WARNING_HEIGHT, ENEMIES.van.warnColor);
    this.scene.tweens.add({ targets: this.warning, alpha: 0.2, duration: WARNING_BLINK_MS, yoyo: true, repeat: ENEMIES.van.warnMs / (WARNING_BLINK_MS * 2) - 1 });
  }

  private drive() {
    const { worldView } = this.scene.cameras.main;
    const entryX = this.direction > 0
      ? worldView.left - this.width / 2 - OFF_SCREEN_PX
      : worldView.right + this.width / 2 + OFF_SCREEN_PX;
    this.mode = 'driving';
    this.warning?.destroy();
    this.enableBody(true, entryX, this.y, true, true);
    this.setFlipX(this.direction < 0);
  }

  private isPast() {
    const { worldView } = this.scene.cameras.main;
    const margin = this.width / 2 + OFF_SCREEN_PX;
    return this.direction > 0 ? this.x > worldView.right + margin : this.x < worldView.left - margin;
  }

  private noticesChicken() {
    const { chicken } = this.scene;
    const { noticeX, noticeY } = ENEMIES.van;
    return Math.abs(chicken.x - this.homeX) < noticeX && Math.abs(chicken.y - this.y) < noticeY;
  }
}
