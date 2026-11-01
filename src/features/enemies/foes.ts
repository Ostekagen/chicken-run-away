import Phaser from 'phaser';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { Enemy, EnemyKind, Foe } from './Enemy';
import { onEggHit } from './powerupAdapter';
import { levelOver, listen, perRun } from './shared';
import { Van } from './Van';

// The enemies of the current run, ticked and stunned together.
const foesOf = perRun((scene) => {
  const foes: Foe[] = [];
  const living = () => foes.filter((foe) => foe.alive);

  listen(scene, Phaser.Scenes.Events.UPDATE, (time: number) => {
    if (levelOver(scene)) return;
    for (const foe of living()) {
      foe.tick(time);
      onEggHit(scene, foe.sprite, () => foe.hitByEgg());
    }
  });
  listen(scene, 'chicken:crow', () => {
    const { worldView } = scene.cameras.main;
    for (const foe of living()) {
      if (worldView.contains(foe.sprite.x, foe.sprite.y)) foe.stun(scene.time.now);
    }
  });
  listen(scene, 'chicken:respawned', () => living().forEach((foe) => foe.reset(scene.time.now)));

  return foes;
});

export function addEnemy(scene: GameScene, kind: EnemyKind | undefined, x: number, feetY: number) {
  if (!kind || !(kind in ENEMIES.kinds)) throw new Error(`Unknown enemy kind "${kind}"`);
  foesOf(scene).push(kind === 'van' ? new Van(scene, x, feetY) : new Enemy(scene, kind, x, feetY));
}
