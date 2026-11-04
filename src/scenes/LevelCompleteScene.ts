import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { LevelStats } from '../features/collectibles';
import { nextLevelInWorld, worldOf } from '../levels';
import { getCorn } from '../save';
import { TEXT } from '../text';
import { addButton, addStars, addText } from '../ui';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('level-complete');
  }

  // The level's corn is already in the wallet when this starts.
  create(data: { level: string; stats: LevelStats }) {
    const { level, stats } = data;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0);
    addText(this, GAME_WIDTH / 2, 80, TEXT.levelComplete, 32, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 116, TEXT.levelNames[level], 16);
    addStars(this, GAME_WIDTH / 2, 158, stats.stars, 16);
    addText(this, GAME_WIDTH / 2, 200, `${TEXT.corn}: ${stats.corn}/${stats.cornTotal}`, 14);
    if (stats.eggTotal > 0) {
      addText(this, GAME_WIDTH / 2, 222, `${TEXT.goldenEggs}: ${stats.eggs}/${stats.eggTotal}`, 14);
    }
    const wallet = addText(this, GAME_WIDTH / 2, 248, '', 14, '#ffe14d');
    const showWallet = () => wallet.setText(TEXT.cornEarned(stats.corn, getCorn()));
    showWallet();
    // The shop can spend corn while this screen sleeps.
    this.events.on(Phaser.Scenes.Events.WAKE, showWallet);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.WAKE, showWallet));

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
    const openShop = () => {
      this.scene.sleep('hud');
      this.scene.sleep();
      this.scene.launch('shop', { from: 'level-complete' });
    };
    addButton(this, GAME_WIDTH / 2 - 70, 292, TEXT.continueGame, proceed);
    addButton(this, GAME_WIDTH / 2 + 80, 292, TEXT.shop, openShop);
    if (!this.sys.game.device.input.touch) {
      addText(this, GAME_WIDTH / 2, 326, TEXT.completeKeys, 10, '#d6d8e4');
    }
    this.input.keyboard!.once('keydown-SPACE', proceed);
    this.input.keyboard!.once('keydown-ENTER', proceed);
    this.input.keyboard!.on('keydown-S', openShop);
  }
}
