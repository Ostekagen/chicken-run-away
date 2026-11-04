import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { listen, perRun, playIfExists, playSound, surfaceBelow } from './shared';

const DEPTH = 5;
const PUFF_COLOR = 0xbfc4cc;
const LIGHT_COLOR = 0xfff3a0;
const HOP_PX = 6;
const HOP_MS = 90;
const SURFACE_SEARCH_ABOVE_PX = 64;

// The butcher's van at the left edge of a moving level, half on screen, so the player sees
// what is chasing them. Only for show: GameScene already counts the left edge as caught.
const vanChaserOf = perRun((scene) => {
  const { color, width, height } = ENEMIES.kinds.van;
  const { bobPx, bobMs, honkNearPx, honkEveryMs, puffEveryMs, followYPerSecond } = ENEMIES.vanChaser;
  const camera = scene.cameras.main;

  // Fixed to the screen sideways, so x 0 is always the left edge with half the van showing.
  const van = scene.add.sprite(0, 0, ensureTexture(scene, 'van', color, width, height))
    .setScrollFactor(0, 1)
    .setDepth(DEPTH);
  playIfExists(van, 'van-drive');
  const light = scene.add.circle(0, 0, 5, LIGHT_COLOR).setScrollFactor(0, 1).setDepth(DEPTH + 1).setAlpha(0.5);

  let roadY = groundUnderEdge(scene) ?? scene.chicken.body.bottom;
  let hopY = 0;
  let nextPuffAt = 0;
  let nextHonkAt = 0;

  const honk = () => {
    playSound(scene, 'sfx-honk');
    scene.tweens.add({ targets: light, alpha: 1, scale: 1.8, duration: 120, yoyo: true, repeat: 1 });
    const hop = { y: 0 };
    scene.tweens.add({
      targets: hop, y: -HOP_PX, duration: HOP_MS, yoyo: true, onUpdate: () => { hopY = hop.y; },
    });
  };

  const puff = (time: number) => {
    // Dust kicked up by the front wheel, blown back off the screen.
    const cloud = scene.add.circle(Phaser.Math.Between(16, 36), van.y + height / 2 - 3, 4, PUFF_COLOR)
      .setScrollFactor(0, 1)
      .setDepth(DEPTH + 1);
    scene.tweens.add({
      targets: cloud,
      x: cloud.x - Phaser.Math.Between(20, 40),
      y: cloud.y - Phaser.Math.Between(6, 14),
      scale: 2.2,
      alpha: 0,
      duration: 500,
      onComplete: () => cloud.destroy(),
    });
    nextPuffAt = time + puffEveryMs;
  };

  listen(scene, Phaser.Scenes.Events.POST_UPDATE, (time: number, delta: number) => {
    const target = groundUnderEdge(scene);
    if (target !== null && target < camera.worldView.bottom + height) {
      roadY += (target - roadY) * Math.min(1, (followYPerSecond * delta) / 1000);
    }
    const bob = Math.round(Math.sin((time / bobMs) * Math.PI) * bobPx);
    van.setPosition(0, roadY - height / 2 + bob + hopY);
    light.setPosition(width / 2 - 6, van.y + 2);
    if (scene.isFinished) return;
    if (time >= nextPuffAt) puff(time);
    const chickenOnScreenX = scene.chicken.x - camera.scrollX;
    if (chickenOnScreenX < honkNearPx && time >= nextHonkAt) {
      nextHonkAt = time + honkEveryMs;
      honk();
    }
  });
  listen(scene, 'chicken:respawned', () => {
    roadY = groundUnderEdge(scene) ?? roadY;
    nextHonkAt = scene.time.now + honkEveryMs;
    honk();
  });
  return van;
});

// The road the van drives on: the first surface below the chicken's height at the left edge.
function groundUnderEdge(scene: GameScene) {
  const x = scene.cameras.main.scrollX + 4;
  return surfaceBelow(scene, x, scene.chicken.body.top - SURFACE_SEARCH_ABOVE_PX);
}

// Call while a level is built. Shows the van only in moving levels, once per run.
export function addVanChaser(scene: GameScene) {
  if (scene.isAutoscroll) vanChaserOf(scene);
}
