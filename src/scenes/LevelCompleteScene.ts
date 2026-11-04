import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LevelStats } from '../features/collectibles';
import { nextLevelInWorld, worldOf } from '../levels';
import { TEXT } from '../text';
import { addButton, addStars, addText } from '../ui';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('level-complete');
  }

  create(data: { level: string; stats: LevelStats }) {
    const { level, stats } = data;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    addText(this, GAME_WIDTH / 2, 90, TEXT.levelComplete, 32, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 126, TEXT.levelNames[level], 16);
    addStars(this, GAME_WIDTH / 2, 170, stats.stars, 16);
    addText(this, GAME_WIDTH / 2, 216, `${TEXT.corn}: ${stats.corn}/${stats.cornTotal}`, 14);
    if (stats.eggTotal > 0) {
      addText(this, GAME_WIDTH / 2, 238, `${TEXT.goldenEggs}: ${stats.eggs}/${stats.eggTotal}`, 14);
    }

    const next = nextLevelInWorld(level);
    const proceed = () => {
      this.scene.stop('hud');
      if (next) {
        this.scene.start('game', { level: next });
      } else {
        this.scene.stop('game');
        this.scene.start('victory', { world: worldOf(level).id });
      }
    };
    addButton(this, GAME_WIDTH / 2, 290, TEXT.continueGame, proceed);
    this.input.keyboard!.once('keydown-SPACE', proceed);
    this.input.keyboard!.once('keydown-ENTER', proceed);
  }
}
