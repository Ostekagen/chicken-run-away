import Phaser from 'phaser';
import { CHICKEN, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getLevelStats } from '../features/collectibles';
import { TEXT } from '../text';
import { clearTouch, touch } from '../touch';
import { addButton, addText } from '../ui';
import type { GameScene } from './GameScene';

const HEART_SIZE = 16;
const TOUCH_BUTTON_RADIUS = 34;
const TOUCH_BUTTON_ALPHA = 0.35;

// Runs on top of GameScene: status, pause, mute and the on-screen buttons.
export class HudScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private powerUpIcon!: Phaser.GameObjects.Image;
  private cornText!: Phaser.GameObjects.Text;
  private eggText!: Phaser.GameObjects.Text;
  private pauseLayer!: Phaser.GameObjects.Container;

  constructor() {
    super('hud');
  }

  create() {
    clearTouch();
    this.drawHeart();
    this.hearts = Array.from({ length: CHICKEN.maxHearts }, (_, i) =>
      this.add.image(18 + i * (HEART_SIZE + 4), 18, 'heart'));
    this.powerUpIcon = this.add.image(102, 18, 'powerup-egg-throw').setVisible(false);
    this.add.image(138, 18, 'corn');
    this.cornText = addText(this, 150, 18, '0', 14).setOrigin(0, 0.5);
    this.add.image(204, 18, 'golden-egg').setScale(0.75);
    this.eggText = addText(this, 216, 18, '0/3', 14).setOrigin(0, 0.5);

    const muteLabel = () => (this.sound.mute ? 'x' : '♪');
    const mute = addButton(this, GAME_WIDTH - 62, 18, muteLabel(), () => {
      this.sound.mute = !this.sound.mute;
      mute.setText(muteLabel());
    });
    addButton(this, GAME_WIDTH - 22, 18, 'II', () => this.togglePause());
    this.pauseLayer = this.createPauseLayer();

    this.input.keyboard!.on('keydown-P', () => this.togglePause());
    this.input.keyboard!.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard!.on('keydown-M', () => {
      this.sound.mute = !this.sound.mute;
      mute.setText(muteLabel());
    });
    if (this.sys.game.device.input.touch) this.createTouchButtons();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, clearTouch);
  }

  update() {
    const game = this.gameScene();
    if (!game.chicken?.active) return;
    this.hearts.forEach((heart, i) => heart.setAlpha(i < game.chicken.hearts ? 1 : 0.25));

    const kind = game.chicken.powerUp;
    this.powerUpIcon.setVisible(kind !== null);
    if (kind) this.powerUpIcon.setTexture(`powerup-${kind}`);

    const stats = getLevelStats(game);
    this.cornText.setText(String(stats.corn));
    this.eggText.setText(`${stats.eggs}/${stats.eggTotal}`);
  }

  private gameScene() {
    return this.scene.get('game') as GameScene;
  }

  private togglePause() {
    const paused = this.scene.isPaused('game');
    if (!paused && this.gameScene().isFinished) return;
    if (paused) this.scene.resume('game');
    else this.scene.pause('game');
    this.pauseLayer.setVisible(!paused);
    clearTouch();
  }

  private createPauseLayer() {
    const layer = this.add.container(0, 0, [
      this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0),
      addText(this, GAME_WIDTH / 2, 130, TEXT.paused, 32),
      addButton(this, GAME_WIDTH / 2, 190, TEXT.resume, () => this.togglePause()),
      addButton(this, GAME_WIDTH / 2, 230, TEXT.quit, () => {
        this.scene.stop('game');
        this.scene.start('menu');
      }),
    ]);
    return layer.setDepth(10).setVisible(false);
  }

  private createTouchButtons() {
    this.input.addPointer(2);
    const y = GAME_HEIGHT - 48;
    this.addHoldButton(48, y, '<', (held) => { touch.left = held; });
    this.addHoldButton(130, y, '>', (held) => { touch.right = held; });
    this.addHoldButton(GAME_WIDTH - 48, y, '^', (held) => { touch.jump = held; });
    this.addHoldButton(GAME_WIDTH - 130, y, '*', (held) => {
      if (held) this.gameScene().events.emit('input:action');
    });
  }

  private addHoldButton(x: number, y: number, label: string, onChange: (held: boolean) => void) {
    const button = this.add.circle(x, y, TOUCH_BUTTON_RADIUS, 0xffffff, TOUCH_BUTTON_ALPHA);
    addText(this, x, y, label, 24);
    button.setInteractive();
    button.on('pointerdown', () => onChange(true));
    button.on('pointerup', () => onChange(false));
    button.on('pointerout', () => onChange(false));
  }

  private drawHeart() {
    if (this.textures.exists('heart')) return;
    const g = this.add.graphics();
    g.fillStyle(0xe5383b);
    g.fillCircle(4, 5, 4).fillCircle(12, 5, 4);
    g.fillTriangle(0, 6, 16, 6, 8, 15);
    g.generateTexture('heart', HEART_SIZE, HEART_SIZE);
    g.destroy();
  }
}
