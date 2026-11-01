import Phaser from 'phaser';
import { ENEMIES, TILE } from '../../config';
import type { GameScene } from '../../scenes/GameScene';

type SceneListener = (...args: never[]) => void;

// Adds a scene event listener for this run of the scene only.
export function listen(scene: GameScene, event: string, listener: SceneListener) {
  scene.events.on(event, listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(event, listener));
}

// Keeps one value per run of the scene. Restarting a scene reuses the same object.
export function perRun<T>(create: (scene: GameScene) => T) {
  const runs = new Map<GameScene, T>();
  return (scene: GameScene) => {
    if (!runs.has(scene)) {
      runs.set(scene, create(scene));
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => runs.delete(scene));
    }
    return runs.get(scene) as T;
  };
}

export function playSound(scene: Phaser.Scene, key: string) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key);
}

// GameScene has no public getter yet. Nothing should hurt the chicken once the level is won.
export function levelOver(scene: GameScene) {
  return scene['finished'];
}

export function isSolidTile(scene: GameScene, x: number, y: number) {
  const index = scene.ground.getTileAtWorldXY(x, y)?.index;
  return index === TILE.top || index === TILE.fill;
}

export function isStandable(scene: GameScene, x: number, y: number) {
  return isSolidTile(scene, x, y) || scene.ground.getTileAtWorldXY(x, y)?.index === TILE.oneWay;
}

// The y of the first surface at or below fromY, if there is one.
export function surfaceBelow(scene: GameScene, x: number, fromY: number) {
  const { tileHeight, height } = scene.ground.tilemap;
  const firstRow = Math.max(0, Math.floor(fromY / tileHeight));
  for (let row = firstRow; row < height; row++) {
    if (isStandable(scene, x, (row + 0.5) * tileHeight)) return row * tileHeight;
  }
  return null;
}

// A chicken falling onto the top part of a target lands on it.
export function isLanding(scene: GameScene, target: Phaser.Physics.Arcade.Body) {
  const { body } = scene.chicken;
  const reach = Math.max(target.height * ENEMIES.stompReach, ENEMIES.stompReachMinPx);
  return body.velocity.y > 0 && body.bottom <= target.top + reach;
}

// Stars around a sprite's head. Returns a function that ends them early.
export function showDizzy(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, ms: number) {
  const stars = [0, 1, 2].map(() => scene.add.star(0, 0, 5, 2, 5, 0xffe14d).setDepth(10));
  const removeStars = () => stars.forEach((star) => star.destroy());
  const tween = scene.tweens.addCounter({
    from: 0,
    to: ms / 100,
    duration: ms,
    onUpdate: (self) => {
      if (!sprite.active || !sprite.visible) {
        self.stop();
        return;
      }
      stars.forEach((star, i) => {
        const angle = (self.getValue() ?? 0) + i * 2.1;
        star.setPosition(
          sprite.x + Math.cos(angle) * 16,
          sprite.y - sprite.displayHeight / 2 - 6 + Math.sin(angle) * 4,
        );
      });
    },
    onComplete: removeStars,
    onStop: removeStars,
  });
  return () => {
    if (tween.isPlaying()) tween.stop();
  };
}
