import Phaser from 'phaser';

// Returns a texture key, drawing a plain rectangle if the real art is missing.
export function ensureTexture(scene: Phaser.Scene, key: string, color: number, width: number, height: number) {
  if (!scene.textures.exists(key)) {
    const g = scene.add.graphics();
    g.fillStyle(color).fillRect(0, 0, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }
  return key;
}
