import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { CHICKEN, ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { levelOver, perRun } from './shared';

type Cleaver = Phaser.Physics.Arcade.Image;

const cleaversOf = perRun((scene) => {
  const cleavers = scene.physics.add.group();
  scene.physics.add.overlap(scene.chicken, cleavers, (_chicken, cleaver) => {
    (cleaver as Cleaver).destroy();
    if (!levelOver(scene)) scene.chicken.takeHit();
  });
  scene.physics.add.collider(cleavers, scene.ground, (cleaver) => stick(scene, cleaver as Cleaver));
  return cleavers;
});

// Throws in an arc that reaches the target after the flight time.
export function throwCleaver(scene: GameScene, x: number, y: number, targetX: number, targetY: number, flightMs: number) {
  const { color, size, hitboxSize, spinPerSecond, lifeMs } = ENEMIES.cleaver;
  const key = ensureTexture(scene, 'cleaver', color, size, size);
  const cleaver: Cleaver = cleaversOf(scene).create(x, y, key);
  const seconds = flightMs / 1000;
  cleaver.setCircle(hitboxSize / 2, (size - hitboxSize) / 2, (size - hitboxSize) / 2);
  cleaver.setVelocity((targetX - x) / seconds, (targetY - y) / seconds - (CHICKEN.gravity * seconds) / 2);
  cleaver.setAngularVelocity(targetX < x ? -spinPerSecond : spinPerSecond);
  scene.time.delayedCall(lifeMs, () => cleaver.destroy());
}

export function clearCleavers(scene: GameScene) {
  cleaversOf(scene).clear(true, true);
}

function stick(scene: GameScene, cleaver: Cleaver) {
  cleaver.disableBody();
  scene.tweens.add({
    targets: cleaver, alpha: 0, duration: ENEMIES.cleaver.fadeMs, onComplete: () => cleaver.destroy(),
  });
}
