import Phaser from 'phaser';
import { TILESET_COLUMNS, TILE_SIZE } from '../config';
import { LEVELS } from '../levels';

// Loads levels and draws placeholder art until the real sprites arrive.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    for (const level of LEVELS) this.load.tilemapTiledJSON(level, `levels/${level}.json`);
  }

  create() {
    this.drawTiles();
    this.drawChicken();
    this.drawGoal();
    this.scene.start('game', { level: LEVELS[0] });
  }

  private drawTiles() {
    const g = this.add.graphics();
    // Tile 1: grass-topped ground.
    g.fillStyle(0x8a5a33).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x5fb548).fillRect(0, 0, TILE_SIZE, 8);
    // Tile 2: plain ground.
    g.fillStyle(0x8a5a33).fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    // Tile 3: one-way platform.
    g.fillStyle(0xc99a5b).fillRect(TILE_SIZE * 2, 0, TILE_SIZE, 10);
    // Tile 4: hazard.
    g.fillStyle(0xb8bcc4).fillTriangle(TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 3.5, 8, TILE_SIZE * 4, TILE_SIZE);
    g.generateTexture('tiles', TILE_SIZE * TILESET_COLUMNS, TILE_SIZE);
    g.destroy();
  }

  private drawChicken() {
    const g = this.add.graphics();
    g.fillStyle(0xd8362a).fillRect(10, 0, 10, 5); // comb
    g.fillStyle(0xffffff).fillRect(4, 5, 20, 19); // body
    g.fillStyle(0x222222).fillRect(18, 9, 3, 3); // eye
    g.fillStyle(0xf5a623).fillRect(24, 11, 4, 4); // beak
    g.fillStyle(0xf5a623).fillRect(8, 24, 4, 4).fillRect(17, 24, 4, 4); // feet
    g.generateTexture('chicken', 28, 28);
    g.destroy();
  }

  private drawGoal() {
    const g = this.add.graphics();
    g.fillStyle(0x6b4a2f).fillRect(0, 0, 4, 64);
    g.fillStyle(0xffd23f).fillRect(4, 0, 28, 20);
    g.generateTexture('goal', 32, 64);
    g.destroy();
  }
}
