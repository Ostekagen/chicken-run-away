import Phaser from 'phaser';
import { CHICKEN, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { MenuScene } from './scenes/MenuScene';
import { ShopScene } from './scenes/ShopScene';
import { VictoryScene } from './scenes/VictoryScene';

const REFIT_DELAY_MS = 300;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#8fd3f4',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: CHICKEN.gravity } } },
  scene: [BootScene, MenuScene, GameScene, HudScene, LevelCompleteScene, VictoryScene, ShopScene],
});

// Phaser sizes the canvas before it reads the new screen size, so after rotating a phone the
// canvas keeps its old size. Refit once now, and again for browsers that settle their layout late.
const refit = () => {
  game.scale.getParentBounds();
  game.scale.refresh();
};
const refitAfterResize = () => {
  refit();
  setTimeout(refit, REFIT_DELAY_MS);
};
window.addEventListener('resize', refitAfterResize);
window.addEventListener('orientationchange', refitAfterResize);

if (import.meta.env.DEV) {
  (window as unknown as { phaserGame: Phaser.Game }).phaserGame = game;
}
