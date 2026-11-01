import Phaser from 'phaser';
import { CHICKEN, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { MenuScene } from './scenes/MenuScene';
import { VictoryScene } from './scenes/VictoryScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#8fd3f4',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: CHICKEN.gravity } } },
  scene: [BootScene, MenuScene, GameScene, HudScene, LevelCompleteScene, VictoryScene],
});

if (import.meta.env.DEV) {
  (window as unknown as { phaserGame: Phaser.Game }).phaserGame = game;
}
