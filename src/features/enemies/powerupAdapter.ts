import Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import * as powerups from '../powerups';

// The two things enemies need from power-ups, both optional so this works before they exist.
interface PowerUpsApi {
  getEggs?(scene: GameScene): Phaser.Physics.Arcade.Group;
  spawnPowerUp?(scene: GameScene, kind: 'egg-throw', x: number, feetY: number): void;
}

const api = powerups as unknown as PowerUpsApi;

export function onEggHit(scene: GameScene, target: Phaser.Physics.Arcade.Sprite, hit: () => void) {
  const eggs = api.getEggs?.(scene);
  if (!eggs) return;
  scene.physics.overlap(target, eggs, (_target, egg) => {
    (egg as Phaser.GameObjects.GameObject).destroy();
    hit();
  });
}

export function dropEggThrow(scene: GameScene, x: number, feetY: number) {
  api.spawnPowerUp?.(scene, 'egg-throw', x, feetY);
}
