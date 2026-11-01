import Phaser from 'phaser';
import { playMusic } from '../audio';
import { GAME_WIDTH } from '../config';
import { TEXT } from '../text';
import { addButton, addText } from '../ui';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('victory');
  }

  create() {
    this.add.image(0, 0, 'bg-road').setOrigin(0);
    playMusic(this, 'music-farm');
    addText(this, GAME_WIDTH / 2, 90, TEXT.victoryTitle, 40, '#ffe14d');
    addText(this, GAME_WIDTH / 2, 136, TEXT.victoryBody, 14);

    const chicken = this.add.sprite(-40, 280, 'chicken').setScale(2).play('chicken-run');
    this.tweens.add({ targets: chicken, x: GAME_WIDTH + 40, duration: 5000, repeat: -1 });

    const toMenu = () => this.scene.start('menu');
    addButton(this, GAME_WIDTH / 2, 200, TEXT.backToMenu, toMenu);
    this.input.keyboard!.once('keydown-ENTER', toMenu);
  }
}
