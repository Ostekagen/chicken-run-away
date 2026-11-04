import Phaser from 'phaser';
import { playMusic } from '../audio';
import { TILE } from '../config';
import { getLevelStats, saveStars } from '../features/collectibles';
import { createLevelObjects, findLevelObject, objectProperty } from '../levelObjects';
import { isBossLevel } from '../levels';
import { Chicken, ChickenInput } from '../objects/Chicken';
import { addCorn } from '../save';
import { touch } from '../touch';
import { hasUpgrade } from '../upgrades';
import '../features';

const FALL_MARGIN = 64;
const COMPLETE_DELAY_MS = 700;
// In a moving level the chicken is kept this far inside the right edge,
// and after being caught the screen starts with it this far from the left edge.
const SCROLL_EDGE_MARGIN = 16;
const SCROLL_RESPAWN_LEAD = 200;
// The screen waits this long after the start or a catch before it moves.
const SCROLL_START_DELAY_MS = 1000;

interface ScrollMark {
  x: number;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  chicken!: Chicken;
  ground!: Phaser.Tilemaps.TilemapLayer;

  private levelName = '';
  private checkpoint = new Phaser.Math.Vector2();
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space', Phaser.Input.Keyboard.Key>;
  private levelHeight = 0;
  private finished = false;
  // Moving levels: the screen scrolls at baseScrollSpeed px/s, changing at each mark it passes.
  private baseScrollSpeed = 0;
  private scrollMarks: ScrollMark[] = [];
  private scrollStartsAt = 0;
  // Kept here unrounded, because the camera rounds its own position down every frame.
  private scrollPosition = 0;

  constructor() {
    super('game');
  }

  get isFinished() {
    return this.finished;
  }

  get isAutoscroll() {
    return this.baseScrollSpeed > 0;
  }

  get levelKey() {
    return this.levelName;
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

    if (this.textures.exists(`bg-${tilesetName}`)) {
      this.add.image(0, 0, `bg-${tilesetName}`).setOrigin(0).setScrollFactor(0).setDepth(-10);
    }
    playMusic(this, isBossLevel(data.level) ? `music-${data.level}` : `music-${tilesetName}`);

    ground.setCollision([TILE.top, TILE.fill]);
    ground.forEachTile((tile) => {
      if (tile.index === TILE.oneWay) tile.setCollision(false, false, true, false);
    });

    const spawn = findLevelObject(map, 'spawn');
    this.setCheckpoint(spawn.x ?? 0, spawn.y ?? 0);
    this.chicken = new Chicken(this, this.checkpoint.x, this.checkpoint.y);
    this.chicken.on('defeated', () => this.catchChicken());
    this.physics.add.collider(this.chicken, ground);
    this.applyStartUpgrades();

    const goalPoint = findLevelObject(map, 'goal');
    const goal = this.physics.add.staticImage(goalPoint.x ?? 0, (goalPoint.y ?? 0) - 32, 'goal');
    this.physics.add.overlap(this.chicken, goal, () => this.finishLevel());

    this.levelHeight = map.heightInPixels;
    // The bottom stays open, so the chicken can fall into pits.
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + FALL_MARGIN * 2);
    this.physics.world.setBoundsCollision(true, true, false, false);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.setUpScrolling(map);
    if (this.isAutoscroll) {
      // Follow up and down only. The update loop moves the screen sideways.
      camera.startFollow(this.chicken, true, 0, 0.15);
      this.placeScreenAtCheckpoint();
    } else {
      camera.startFollow(this.chicken, true, 0.15, 0.15);
      camera.setDeadzone(60, 60);
    }

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard!.addKeys({
      left: K.LEFT, right: K.RIGHT, a: K.A, d: K.D, up: K.UP, w: K.W, space: K.SPACE,
    }) as typeof this.keys;

    createLevelObjects(this, map);
    this.scene.launch('hud');
  }

  update(time: number, delta: number) {
    if (this.finished) return;
    this.chicken.move(this.readInput(), time);
    if (this.isAutoscroll) this.updateScrolling(delta);
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
    this.applyStartUpgrades();
    if (this.isAutoscroll) this.placeScreenAtCheckpoint();
    this.events.emit('chicken:respawned');
  }

  // The corn collected goes into the wallet only when the level is finished.
  finishLevel() {
    if (this.finished) return;
    this.finished = true;
    this.chicken.setAcceleration(0, 0).setVelocity(0, 0);
    const stats = getLevelStats(this);
    saveStars(this.levelName, stats.stars);
    addCorn(stats.corn);
    this.time.delayedCall(COMPLETE_DELAY_MS, () => {
      this.scene.launch('level-complete', { level: this.levelName, stats });
    });
  }

  private applyStartUpgrades() {
    if (hasUpgrade('feather-start')) this.chicken.setPowerUp('feather-armor');
  }

  // A map property "scrollSpeed" makes a moving level. Objects of type "scroll-speed"
  // change the speed once the middle of the screen passes them.
  private setUpScrolling(map: Phaser.Tilemaps.Tilemap) {
    // Phaser gives an empty object, not a list, when a map has no properties.
    const properties = Array.isArray(map.properties) ? (map.properties as { name: string; value: unknown }[]) : [];
    this.baseScrollSpeed = Number(properties.find((p) => p.name === 'scrollSpeed')?.value ?? 0);
    this.scrollMarks = (map.getObjectLayer('objects')?.objects ?? [])
      .filter((object) => object.type === 'scroll-speed')
      .map((object) => ({ x: object.x ?? 0, speed: Number(objectProperty(object, 'speed') ?? this.baseScrollSpeed) }))
      .sort((a, b) => a.x - b.x);
  }

  private placeScreenAtCheckpoint() {
    const lastScrollX = this.physics.world.bounds.width - this.cameras.main.width;
    this.scrollPosition = Phaser.Math.Clamp(this.checkpoint.x - SCROLL_RESPAWN_LEAD, 0, lastScrollX);
    this.cameras.main.scrollX = this.scrollPosition;
    this.scrollStartsAt = this.time.now + SCROLL_START_DELAY_MS;
  }

  private updateScrolling(delta: number) {
    if (this.time.now < this.scrollStartsAt) return;
    const camera = this.cameras.main;
    const middle = this.scrollPosition + camera.width / 2;
    const speed = this.scrollMarks.filter((mark) => mark.x <= middle).at(-1)?.speed ?? this.baseScrollSpeed;
    const lastScrollX = this.physics.world.bounds.width - camera.width;
    this.scrollPosition = Math.min(lastScrollX, this.scrollPosition + (speed * delta) / 1000);
    camera.scrollX = this.scrollPosition;

    const { body } = this.chicken;
    const rightEdge = camera.scrollX + camera.width - SCROLL_EDGE_MARGIN;
    if (body.right > rightEdge) {
      body.x = rightEdge - body.width;
      body.velocity.x = Math.min(0, body.velocity.x);
    }
    // Falling behind the left edge means the butcher's van catches the chicken.
    if (body.right < camera.scrollX) this.catchChicken();
  }

  private readInput(): ChickenInput {
    const { left, right, a, d, up, w, space } = this.keys;
    return {
      left: left.isDown || a.isDown || touch.left,
      right: right.isDown || d.isDown || touch.right,
      jump: up.isDown || w.isDown || space.isDown || touch.jump,
    };
  }
}
