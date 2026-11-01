import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Chicken, ChickenInput } from '../objects/Chicken';
import { TEXT } from '../text';

const TILE_ONE_WAY = 3;
const FALL_MARGIN = 64;

export class GameScene extends Phaser.Scene {
  private chicken!: Chicken;
  private spawn = new Phaser.Math.Vector2();
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space', Phaser.Input.Keyboard.Key>;
  private levelHeight = 0;
  private finished = false;

  constructor() {
    super('game');
  }

  create(data: { level: string }) {
    this.finished = false;
    const map = this.make.tilemap({ key: data.level });
    const tileset = map.addTilesetImage('placeholder', 'tiles');
    const ground = tileset && map.createLayer('ground', tileset);
    if (!ground) throw new Error(`Level ${data.level} needs a "ground" layer and "placeholder" tileset`);

    ground.setCollisionByExclusion([-1, TILE_ONE_WAY]);
    ground.forEachTile((tile) => {
      if (tile.index === TILE_ONE_WAY) tile.setCollision(false, false, true, false);
    });

    const spawnPoint = this.findObject(map, 'spawn');
    this.spawn.set(spawnPoint.x ?? 0, (spawnPoint.y ?? 0) - 14);
    this.chicken = new Chicken(this, this.spawn.x, this.spawn.y);
    this.physics.add.collider(this.chicken, ground);

    const goalPoint = this.findObject(map, 'goal');
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
  }

  update(time: number) {
    if (this.finished) return;
    this.chicken.move(this.readInput(), time);
    if (this.chicken.y > this.levelHeight + FALL_MARGIN) {
      this.chicken.respawn(this.spawn.x, this.spawn.y);
    }
  }

  private readInput(): ChickenInput {
    const { left, right, a, d, up, w, space } = this.keys;
    return {
      left: left.isDown || a.isDown,
      right: right.isDown || d.isDown,
      jump: up.isDown || w.isDown || space.isDown,
    };
  }

  private findObject(map: Phaser.Tilemaps.Tilemap, name: string) {
    const object = map.findObject('objects', (o) => o.name === name);
    if (!object) throw new Error(`Level is missing the "${name}" object`);
    return object;
  }

  private finishLevel() {
    if (this.finished) return;
    this.finished = true;
    this.chicken.setAcceleration(0, 0).setVelocity(0, 0);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXT.levelComplete, {
        fontFamily: 'monospace', fontSize: '32px', color: '#ffffff', stroke: '#1d2030', strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.time.delayedCall(1500, () => this.scene.restart());
  }
}
