import Phaser from 'phaser';
import { playMusic } from '../audio';
import { GAME_WIDTH } from '../config';
import { getSavedStars } from '../features/collectibles';
import { LEVELS, WORLDS } from '../levels';
import { TEXT } from '../text';
import { addButton, addStars, addText } from '../ui';

const ROW_HEIGHT = 36;
const FIRST_ROW_Y = 150;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    this.add.image(0, 0, 'bg-farm').setOrigin(0);
    addText(this, GAME_WIDTH / 2, 56, TEXT.title, 40, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 96, TEXT.tagline, 16);
    this.add.sprite(70, 300, 'chicken').setScale(2).play('chicken-run');
    this.add.sprite(570, 278, 'butcher').setScale(1.6).setFlipX(true).play('butcher-run');
    playMusic(this, 'music-farm');

    const unlocked = (index: number) => index === 0 || getSavedStars(LEVELS[index - 1]) > 0;
    // Only the first world is listed until the shop agent adds world tabs.
    WORLDS[0].levels.forEach((level, row) => {
      const index = LEVELS.indexOf(level);
      const y = FIRST_ROW_Y + row * ROW_HEIGHT;
      const name = TEXT.levelNames[level];
      if (unlocked(index)) addButton(this, GAME_WIDTH / 2 - 60, y, name, () => this.startLevel(level));
      else addText(this, GAME_WIDTH / 2 - 60, y, name, 18, '#8a8ea3');
      addStars(this, GAME_WIDTH / 2 + 150, y, getSavedStars(level), 9);
    });

    const usesTouch = this.sys.game.device.input.touch;
    addText(this, GAME_WIDTH / 2, 310, usesTouch ? TEXT.controlsTouch : TEXT.start, 12);
    if (!usesTouch) addText(this, GAME_WIDTH / 2, 332, TEXT.controlsKeys, 10);

    // Space starts the first level still to finish.
    const next = LEVELS.find((level, index) => unlocked(index) && getSavedStars(level) === 0) ?? LEVELS[0];
    this.input.keyboard!.once('keydown-SPACE', () => this.startLevel(next));
    this.input.keyboard!.once('keydown-ENTER', () => this.startLevel(next));
  }

  private startLevel(level: string) {
    this.scene.start('game', { level });
  }
}
