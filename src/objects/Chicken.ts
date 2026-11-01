import Phaser from 'phaser';
import { playSound } from '../audio';
import { CHICKEN, POWERUPS, PowerUpKind } from '../config';

const RUN_ANIMATION_MIN_SPEED = 10;

export interface ChickenInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class Chicken extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  hearts = CHICKEN.maxHearts;
  powerUp: PowerUpKind | null = null;

  private invulnerableUntil = 0;
  private lastGroundedAt = -Infinity;
  private jumpPressedAt = -Infinity;
  private wasJumpHeld = false;
  private isJumping = false;
  private flapUsed = false;
  private rushEndsAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chicken');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(20, 26).setOffset(4, 2);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(CHICKEN.runSpeed, CHICKEN.maxFallSpeed);
  }

  move(input: ChickenInput, time: number) {
    if (this.powerUp === 'corn-rush' && time >= this.rushEndsAt) this.setPowerUp(null);
    const onGround = this.body.blocked.down;
    this.updateRun(input, onGround);
    this.updateJump(input, onGround, time);
    this.updateGlide(input, onGround);
    this.updateAnimation(onGround);
  }

  // The chicken holds one power-up, so this replaces any other. Null removes it.
  setPowerUp(kind: PowerUpKind | null) {
    this.powerUp = kind;
    if (kind) this.setTint(POWERUPS.colors[kind]);
    else this.clearTint();
    this.body.setMaxVelocityX(kind === 'corn-rush' ? POWERUPS.rushSpeed : CHICKEN.runSpeed);
    if (kind === 'corn-rush') this.rushEndsAt = this.scene.time.now + POWERUPS.rushMs;
  }

  // Everything that hurts the chicken goes through here.
  takeHit() {
    const now = this.scene.time.now;
    if (now < this.invulnerableUntil) return;
    this.invulnerableUntil = now + CHICKEN.invulnerableMs;
    if (this.powerUp && POWERUPS.absorbsHit.includes(this.powerUp)) {
      this.setPowerUp(null);
    } else {
      this.hearts -= 1;
    }
    this.blink();
    playSound(this.scene, 'sfx-hit');
    this.emit('hit');
    if (this.hearts <= 0) this.emit('defeated');
  }

  respawn(x: number, y: number) {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.hearts = CHICKEN.maxHearts;
    this.invulnerableUntil = 0;
    this.isJumping = false;
    this.lastGroundedAt = -Infinity;
    this.jumpPressedAt = -Infinity;
    this.flapUsed = false;
    this.setPowerUp(null);
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
  }

  private blink() {
    const repeat = Math.round(CHICKEN.invulnerableMs / 200) - 1;
    this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 100, yoyo: true, repeat });
  }

  private updateRun(input: ChickenInput, onGround: boolean) {
    const direction = Number(input.right) - Number(input.left);
    if (direction !== 0) {
      const acceleration = onGround ? CHICKEN.groundAcceleration : CHICKEN.airAcceleration;
      this.body.setAccelerationX(direction * acceleration);
      this.body.setDragX(0);
      this.setFlipX(direction < 0);
    } else {
      this.body.setAccelerationX(0);
      this.body.setDragX(onGround ? CHICKEN.groundDrag : 0);
    }
  }

  private updateJump(input: ChickenInput, onGround: boolean, time: number) {
    if (onGround) {
      this.lastGroundedAt = time;
      this.flapUsed = false;
      if (this.body.velocity.y >= 0) this.isJumping = false;
    }
    if (input.jump && !this.wasJumpHeld) this.jumpPressedAt = time;

    const canJump = !this.isJumping && time - this.lastGroundedAt <= CHICKEN.coyoteTimeMs;
    if (canJump && time - this.jumpPressedAt <= CHICKEN.jumpBufferMs) {
      this.body.setVelocityY(-CHICKEN.jumpSpeed);
      this.isJumping = true;
      this.jumpPressedAt = -Infinity;
      playSound(this.scene, 'sfx-jump');
    } else if (this.jumpPressedAt === time && !onGround && this.powerUp === 'flappy-wings' && !this.flapUsed) {
      this.body.setVelocityY(-POWERUPS.flapSpeed);
      this.isJumping = true;
      this.flapUsed = true;
      this.jumpPressedAt = -Infinity;
    }

    const jumpReleased = this.wasJumpHeld && !input.jump;
    if (jumpReleased && this.isJumping && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * CHICKEN.jumpCutFactor);
    }
    this.wasJumpHeld = input.jump;
  }

  private updateGlide(input: ChickenInput, onGround: boolean) {
    const gliding = this.powerUp === 'flappy-wings' && input.jump && !onGround;
    if (gliding && this.body.velocity.y > POWERUPS.glideFallSpeed) {
      this.body.setVelocityY(POWERUPS.glideFallSpeed);
    }
  }

  private updateAnimation(onGround: boolean) {
    if (!onGround) this.play(this.body.velocity.y < 0 ? 'chicken-jump' : 'chicken-fall', true);
    else if (Math.abs(this.body.velocity.x) > RUN_ANIMATION_MIN_SPEED) this.play('chicken-run', true);
    else this.play('chicken-idle', true);
  }
}
