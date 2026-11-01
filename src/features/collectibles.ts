// Corn, golden eggs and checkpoints: registers "corn", "golden-egg" and "checkpoint".
import Phaser from 'phaser';
import { ensureTexture } from '../art';
import { CHICKEN } from '../config';
import { registerLevelObject } from '../levelObjects';
import type { GameScene } from '../scenes/GameScene';

const CORN_PER_HEART = 100;
const STARS_KEY = 'chicken-run-away:stars';
const CHECKPOINT_ACTIVE_TINT = 0x7dff7d;

export interface LevelStats {
  corn: number;
  cornTotal: number;
  eggs: number;
  eggTotal: number;
  stars: number;
}

interface LevelState {
  stats: LevelStats;
  corn?: Phaser.Physics.Arcade.StaticGroup;
  eggs?: Phaser.Physics.Arcade.StaticGroup;
}

// Collected items are only forgotten when the scene restarts, so they stay
// collected through a respawn at a checkpoint.
const states = new WeakMap<GameScene, LevelState>();
const scenesSavingStars = new WeakSet<GameScene>();

function starsFor(eggs: number) {
  return 1 + Number(eggs >= 2) + Number(eggs >= 3);
}

function levelState(scene: GameScene) {
  let state = states.get(scene);
  if (!state) {
    state = { stats: { corn: 0, cornTotal: 0, eggs: 0, eggTotal: 0, stars: 1 } };
    states.set(scene, state);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => states.delete(scene));
    saveStarsWhenFinished(scene);
  }
  return state;
}

// GameScene has no finished event, so this wraps finishLevel on the scene itself.
function saveStarsWhenFinished(scene: GameScene) {
  if (scenesSavingStars.has(scene)) return;
  scenesSavingStars.add(scene);
  const finishLevel = scene.finishLevel.bind(scene);
  scene.finishLevel = () => {
    const level = (scene.sys.settings.data as { level: string }).level;
    saveStars(level, getLevelStats(scene).stars);
    finishLevel();
  };
}

function playSound(scene: GameScene, key: string) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key);
}

function collectCorn(scene: GameScene, stats: LevelStats) {
  stats.corn += 1;
  if (stats.corn % CORN_PER_HEART === 0) {
    scene.chicken.hearts = Math.min(scene.chicken.hearts + 1, CHICKEN.maxHearts);
  }
  playSound(scene, 'sfx-corn');
}

function collectEgg(scene: GameScene, stats: LevelStats) {
  stats.eggs += 1;
  stats.stars = starsFor(stats.eggs);
  playSound(scene, 'sfx-egg');
}

// One group per scene keeps levels with hundreds of corn cheap.
function collectibleGroup(scene: GameScene, onCollect: () => void) {
  const group = scene.physics.add.staticGroup();
  scene.physics.add.overlap(scene.chicken, group, (_chicken, item) => {
    (item as Phaser.Physics.Arcade.Sprite).destroy();
    onCollect();
  });
  return group;
}

registerLevelObject('corn', (scene, object) => {
  const state = levelState(scene);
  state.corn ??= collectibleGroup(scene, () => collectCorn(scene, state.stats));
  const key = ensureTexture(scene, 'corn', 0xffd23f, 16, 16);
  state.corn.create(object.x ?? 0, (object.y ?? 0) - 8, key);
  state.stats.cornTotal += 1;
});

registerLevelObject('golden-egg', (scene, object) => {
  const state = levelState(scene);
  state.eggs ??= collectibleGroup(scene, () => collectEgg(scene, state.stats));
  const key = ensureTexture(scene, 'golden-egg', 0xffb000, 20, 24);
  state.eggs.create(object.x ?? 0, (object.y ?? 0) - 12, key);
  state.stats.eggTotal += 1;
});

registerLevelObject('checkpoint', (scene, object) => {
  const x = object.x ?? 0;
  const feetY = object.y ?? 0;
  const key = ensureTexture(scene, 'checkpoint', 0xc8c8c8, 24, 48);
  const flag = scene.physics.add.staticImage(x, feetY - 24, key);
  const overlap = scene.physics.add.overlap(scene.chicken, flag, () => {
    overlap.destroy();
    scene.setCheckpoint(x, feetY);
    // The real art has a second frame for reached. The placeholder is tinted.
    if (flag.texture.has('1')) flag.setFrame(1);
    else flag.setTint(CHECKPOINT_ACTIVE_TINT);
    scene.tweens.add({ targets: flag, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true });
    playSound(scene, 'sfx-checkpoint');
  });
});

// Counts for the HUD and the end-of-level screen.
export function getLevelStats(scene: GameScene): LevelStats {
  return { ...levelState(scene).stats };
}

function readStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STARS_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

// Best rating saved for a level, or 0 if it has not been finished.
export function getSavedStars(level: string) {
  return readStars()[level] ?? 0;
}

function saveStars(level: string, stars: number) {
  const saved = readStars();
  if ((saved[level] ?? 0) >= stars) return;
  saved[level] = stars;
  try {
    localStorage.setItem(STARS_KEY, JSON.stringify(saved));
  } catch {
    // Storage is blocked. The game still works, it just won't remember the rating.
  }
}
