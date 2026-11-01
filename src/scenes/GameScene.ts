import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import { createLevelObjects, findLevelObject } from '../levelObjects';
import { LEVELS } from '../levels';
import { Chicken, ChickenInput } from '../objects/Chicken';
import { TEXT } from '../text';
import '../features';

const FALL_MARGIN = 64;

export class GameScene extends Phaser.Scene {
  chicken!: Chicken;
  ground!: Phaser.Tilemaps.TilemapLayer;

  private levelName = '';
  private checkpoint = new Phaser.Math.Vector2();
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space', Phaser.Input.Keyboard.Key>;
  private levelHeight = 0;
  private finished = false;

  constructor() {
    super('game');
  }

  create(data: { level: string }) {
    this.finished = false;
    this.levelName = data.level;
    const map = this.make.tilemap({ key: data.level });
    const tilesetName = map.tilesets[0].name;
    const texture = `tiles-${tilesetName}`;
    const tileset = map.addTilesetImage(tilesetName, this.textures.exists(texture) ? texture : 'tiles');
    const ground = tileset && map.createLayer('ground', tileset);
    if (!ground) throw new Error(`Level ${data.level} needs a "ground" layer and a tileset`);
    this.ground = ground;

    ground.setCollision([TILE.top, TILE.fill]);
    ground.forEachTile((tile) => {
      if (tile.index === TILE.oneWay) tile.setCollision(false, false, true, false);
    });

    const spawn = findLevelObject(map, 'spawn');
    this.setCheckpoint(spawn.x ?? 0, spawn.y ?? 0);
    this.chicken = new Chicken(this, this.checkpoint.x, this.checkpoint.y);
    this.chicken.on('defeated', () => this.catchChicken());
    this.physics.add.collider(this.chicken, ground);

    const goalPoint = findLevelObject(map, 'goal');
    const goal = this.physics.add.staticImage(goalPoint.x ?? 0, (goalPoint.y ?? 0) - 32, 'goal');
    this.physics.add.overlap(this.chicken, goal, () => this.finishLevel());

    this.levelHeight = map.heightInPixels;
    // The bottom stays open, so the chicken can fall into pits.
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + FALL_MARGIN * 2);
    this.physics.world.setBoundsCollision(true, true, false, false);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.chicken, true, 0.15, 0.15);
    camera.setDeadzone(60, 60);

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({
      left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, up: K.UP, w: K.W, space: K.SPACE,
    }) as typeof this.keys;

    createLevelObjects(this, map);
  }

  update(time: number) {
    if (this.finished) return;
    this.chicken.move(this.readInput(), time);
    if (this.ground.getTileAtWorldXY(this.chicken.x, this.chicken.y)?.index === TILE.hazard) {
      this.chicken.takeHit();
    }
    if (this.chicken.y > this.levelHeight + FALL_MARGIN) this.catchChicken();
  }

  // The chicken returns here when caught. Pass the point its feet should touch.
  setCheckpoint(x: number, feetY: number) {
    this.checkpoint.set(x, feetY - 14);
  }

  // Sends the chicken back to the latest checkpoint. Listen for
  // 'chicken:respawned' on the scene's events to reset anything chasing it.
  catchChicken() {
    this.chicken.respawn(this.checkpoint.x, this.checkpoint.y);
    this.events.emit('chicken:respawned');
  }

  finishLevel() {
    if (this.finished) return;
    this.finished = true;
    this.chicken.setAcceleration(0, 0).setVelocity(0, 0);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXT.levelComplete, {
        fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', stroke: '#1d2030', strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const next = LEVELS[LEVELS.indexOf(this.levelName) + 1] ?? LEVELS[0];
    this.time.delayedCall(1500, () => this.scene.start('game', { level: next }));
  }

  private readInput(): ChickenInput {
    const { left, right, a, d, up, w, space } = this.keys;
    return {
      left: left.isDown || a.isDown,
      right: right.isDown || d.isDown,
      jump: up.isDown || w.isDown || space.isDown,
    };
  }
}
