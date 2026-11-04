import Phaser from 'phaser';
import { playMusic } from '../audio';
import { GAME_WIDTH } from '../config';
import { getSavedStars } from '../features/collectibles';
import { addHat, placeHat } from '../features/hats';
import { LEVELS, WORLDS } from '../levels';
import { getCorn } from '../save';
import { TEXT } from '../text';
import { addButton, addCornCount, addStars, addText } from '../ui';

const ROW_HEIGHT = 32;
const FIRST_ROW_Y = 156;
const TAB_Y = 118;
const TAB_X = [168, 448];

// The world tab last looked at, kept while the page is open.
let shownWorld: number | undefined;

export class MenuScene extends Phaser.Scene {
  private list!: Phaser.GameObjects.Container;
  private tabs: Phaser.GameObjects.Text[] = [];
  private tabMarker!: Phaser.GameObjects.Rectangle;
  private chicken!: Phaser.GameObjects.Sprite;
  private hat: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('menu');
  }

  create() {
    this.add.image(0, 0, 'bg-farm').setOrigin(0);
    addText(this, GAME_WIDTH / 2, 50, TEXT.title, 40, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 86, TEXT.tagline, 16);
    this.chicken = this.add.sprite(70, 300, 'chicken').setScale(2).play('chicken-run');
    this.hat = addHat(this, this.chicken);
    this.add.sprite(570, 278, 'butcher').setScale(1.6).setFlipX(true).play('butcher-run');
    playMusic(this, 'music-farm');

    addCornCount(this, 22, 20, getCorn(), 16);
    addButton(this, GAME_WIDTH - 40, 20, TEXT.shop, () => this.openShop());

    // Space starts the first level still to finish.
    const next = LEVELS.find((level, index) => this.isUnlocked(index) && getSavedStars(level) === 0) ?? LEVELS[0];
    shownWorld ??= WORLDS.findIndex((world) => world.levels.includes(next));

    this.tabMarker = this.add.rectangle(0, TAB_Y, 0, 26, 0x1d2030, 0.6).setStrokeStyle(2, 0xffe14d);
    this.tabs = WORLDS.map((world, index) => {
      const label = TEXT.world(index + 1, TEXT.worldNames[world.id]);
      const tab = addText(this, TAB_X[index], TAB_Y, label, 14).setPadding(10, 5);
      return tab.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showWorld(index));
    });
    this.list = this.add.container();
    this.showWorld(shownWorld);

    const usesTouch = this.sys.game.device.input.touch;
    addText(this, GAME_WIDTH / 2, 310, usesTouch ? TEXT.controlsTouch : TEXT.start, 12);
    if (!usesTouch) {
      addText(this, GAME_WIDTH / 2, 290, `${TEXT.menuKeysHint}    ${TEXT.shopKey}`, 10, '#d6d8e4');
      addText(this, GAME_WIDTH / 2, 332, TEXT.controlsKeys, 10);
    }

    const keyboard = this.input.keyboard!;
    keyboard.once('keydown-SPACE', () => this.startLevel(next));
    keyboard.once('keydown-ENTER', () => this.startLevel(next));
    keyboard.on('keydown-LEFT', () => this.showWorld(Math.max(0, (shownWorld ?? 0) - 1)));
    keyboard.on('keydown-RIGHT', () => this.showWorld(Math.min(WORLDS.length - 1, (shownWorld ?? 0) + 1)));
    keyboard.once('keydown-S', () => this.openShop());
  }

  update() {
    if (this.hat) placeHat(this.hat, this.chicken);
  }

  // A level unlocks when the one before it has stars, so a world unlocks with its first level.
  private isUnlocked(index: number) {
    return index === 0 || getSavedStars(LEVELS[index - 1]) > 0;
  }

  private showWorld(worldIndex: number) {
    shownWorld = worldIndex;
    const world = WORLDS[worldIndex];
    const worldOpen = this.isUnlocked(LEVELS.indexOf(world.levels[0]));
    this.tabs.forEach((tab, index) => {
      const open = this.isUnlocked(LEVELS.indexOf(WORLDS[index].levels[0]));
      tab.setColor(!open ? '#8a8ea3' : index === worldIndex ? '#ffffff' : '#ffe14d');
    });
    const tab = this.tabs[worldIndex];
    this.tabMarker.setPosition(tab.x, TAB_Y).setSize(tab.width, tab.height).setOrigin(0.5);

    this.list.removeAll(true);
    if (!worldOpen) {
      const lastBoss = WORLDS[worldIndex - 1].levels.at(-1)!;
      this.list.add(addText(this, GAME_WIDTH / 2, FIRST_ROW_Y + ROW_HEIGHT, TEXT.worldLocked(TEXT.levelNames[lastBoss]), 14, '#d6d8e4'));
      return;
    }
    world.levels.forEach((level, row) => {
      const index = LEVELS.indexOf(level);
      const y = FIRST_ROW_Y + row * ROW_HEIGHT;
      const name = TEXT.levelNames[level];
      this.list.add(
        this.isUnlocked(index)
          ? addButton(this, GAME_WIDTH / 2 - 60, y, name, () => this.startLevel(level))
          : addText(this, GAME_WIDTH / 2 - 60, y, name, 18, '#8a8ea3'),
      );
      this.list.add(addStars(this, GAME_WIDTH / 2 + 150, y, getSavedStars(level), 9));
    });
  }

  private openShop() {
    this.scene.start('shop', { from: 'menu' });
  }

  private startLevel(level: string) {
    this.scene.start('game', { level });
  }
}
