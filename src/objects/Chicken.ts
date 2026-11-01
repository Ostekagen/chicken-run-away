import Phaser from 'phaser';
import { CHICKEN } from '../config';

export interface ChickenInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class Chicken extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private lastGroundedAt = -Infinity;
  private jumpPressedAt = -Infinity;
  private wasJumpHeld = false;
  private isJumping = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chicken');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(20, 26).setOffset(4, 2);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(CHICKEN.runSpeed, CHICKEN.maxFallSpeed);
  }

  move(input: ChickenInput, time: number) {
    const onGround = this.body.blocked.down;
    this.updateRun(input, onGround);
    this.updateJump(input, onGround, time);
  }

  respawn(x: number, y: number) {
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.isJumping = false;
    this.lastGroundedAt = -Infinity;
    this.jumpPressedAt = -Infinity;
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
      if (this.body.velocity.y >= 0) this.isJumping = false;
    }
    if (input.jump && !this.wasJumpHeld) this.jumpPressedAt = time;

    const canJump = !this.isJumping && time - this.lastGroundedAt <= CHICKEN.coyoteTimeMs;
    if (canJump && time - this.jumpPressedAt <= CHICKEN.jumpBufferMs) {
      this.body.setVelocityY(-CHICKEN.jumpSpeed);
      this.isJumping = true;
      this.jumpPressedAt = -Infinity;
    }

    const jumpReleased = this.wasJumpHeld && !input.jump;
    if (jumpReleased && this.isJumping && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * CHICKEN.jumpCutFactor);
    }
    this.wasJumpHeld = input.jump;
  }
}
