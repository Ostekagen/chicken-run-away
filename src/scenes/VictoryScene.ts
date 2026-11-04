import Phaser from 'phaser';
import { playMusic } from '../audio';
import { GAME_WIDTH } from '../config';
import { addHat, placeHat } from '../features/hats';
import { TEXT } from '../text';
import { addButton, addText } from '../ui';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('victory');
  }

  create(data: { world?: string }) {
    const ending = TEXT.endings[data.world ?? 'world-1'] ?? TEXT.endings['world-1'];
    this.add.image(0, 0, this.textures.exists(ending.backdrop) ? ending.backdrop : 'bg-road').setOrigin(0);
    playMusic(this, 'music-farm');
    addText(this, GAME_WIDTH / 2, 90, ending.title, 40, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 136, ending.body, 14).setWordWrapWidth(GAME_WIDTH - 60).setAlign('center');

    const chicken = this.add.sprite(-40, 280, 'chicken').setScale(2).play('chicken-run');
    const hat = addHat(this, chicken);
    this.tweens.add({
      targets: chicken,
      x: GAME_WIDTH + 40,
      duration: 5000,
      repeat: -1,
      onUpdate: () => hat && placeHat(hat, chicken),
    });

    const toMenu = () => this.scene.start('menu');
    addButton(this, GAME_WIDTH / 2, 200, TEXT.backToMenu, toMenu);
    addText(this, GAME_WIDTH / 2, 342, TEXT.credits, 10);
    this.input.keyboard!.once('keydown-ENTER', toMenu);
  }
}
