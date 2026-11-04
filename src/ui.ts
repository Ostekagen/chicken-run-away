import Phaser from 'phaser';
import { ensureTexture } from './art';

const FONT = 'monospace';
const TEXT_RESOLUTION = 3;

export function addText(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = '#ffffff') {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      stroke: '#1d2030',
      strokeThickness: Math.ceil(size / 5),
      resolution: TEXT_RESOLUTION,
    })
    .setOrigin(0.5);
}

export function addButton(scene: Phaser.Scene, x: number, y: number, label: string, onPress: () => void) {
  const button = addText(scene, x, y, label, 18, '#ffe14d').setPadding(10, 6);
  button.setInteractive({ useHandCursor: true }).on('pointerdown', onPress);
  button.on('pointerover', () => button.setColor('#ffffff'));
  button.on('pointerout', () => button.setColor('#ffe14d'));
  return button;
}

// A corn icon with an amount after it. Returns the text, to update the amount.
export function addCornCount(scene: Phaser.Scene, x: number, y: number, amount: number, size = 14) {
  scene.add.image(x, y, ensureTexture(scene, 'corn', 0xffd23f, 16, 16));
  return addText(scene, x + 12, y, String(amount), size).setOrigin(0, 0.5);
}

export function addStars(scene: Phaser.Scene, x: number, y: number, stars: number, size = 12) {
  return [0, 1, 2].map((i) => {
    const color = i < stars ? 0xffd23f : 0x4a4e63;
    return scene.add.star(x + (i - 1) * size * 2.4, y, 5, size / 2, size, color).setStrokeStyle(2, 0x1d2030);
  });
}
