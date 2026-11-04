// The hat the chicken wears, shown on top of it during a level. Looks only.
import Phaser from 'phaser';
import { ensureTexture } from '../art';
import { getHat } from '../save';
import type { GameScene } from '../scenes/GameScene';

const HAT_WIDTH = 20;
const HAT_HEIGHT = 14;
// Where the hat sits on an unscaled chicken facing right, from its centre.
const HEAD_X = 4;
const HEAD_Y = -14;

export const HAT_COLORS: Record<string, number> = {
  'hat-straw': 0xe8c872,
  'hat-pirate': 0x8b3a3a,
  'hat-crown': 0xffd23f,
};

// GameScene calls this as each level starts, to show the worn hat on the chicken.
export function wearHat(scene: GameScene) {
  const hat = addHat(scene, scene.chicken);
  if (!hat) return;
  // After physics has moved the chicken, so the hat never lags a frame behind.
  const follow = () => placeHat(hat, scene.chicken);
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, follow);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, follow));
}

// Puts the worn hat on a sprite, or returns null when no hat is worn.
export function addHat(scene: Phaser.Scene, wearer: Phaser.GameObjects.Sprite) {
  const id = getHat();
  if (!id) return null;
  const key = ensureTexture(scene, id, HAT_COLORS[id] ?? 0xffffff, HAT_WIDTH, HAT_HEIGHT);
  const hat = scene.add.image(0, 0, key);
  placeHat(hat, wearer);
  return hat;
}

export function placeHat(hat: Phaser.GameObjects.Image, wearer: Phaser.GameObjects.Sprite) {
  const direction = wearer.flipX ? -1 : 1;
  hat.setPosition(wearer.x + HEAD_X * direction * wearer.scaleX, wearer.y + HEAD_Y * wearer.scaleY);
  hat.setScale(wearer.scaleX, wearer.scaleY).setFlipX(wearer.flipX);
  hat.setDepth(wearer.depth + 1).setAlpha(wearer.alpha).setVisible(wearer.visible && wearer.active);
}
