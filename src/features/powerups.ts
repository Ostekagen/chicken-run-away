// Power-ups: registers the "powerup" level object.
import Phaser from 'phaser';
import { ensureTexture } from '../art';
import { CHICKEN, POWERUPS, PowerUpKind } from '../config';
import { objectProperty, registerLevelObject } from '../levelObjects';
import type { GameScene } from '../scenes/GameScene';

const PICK_UP_SIZE = 24;
const EGG_SIZE = 16;

interface PowerUpState {
  eggs: Phaser.Physics.Arcade.Group;
  pickUps: Phaser.Physics.Arcade.Image[];
}

const states = new Map<GameScene, PowerUpState>();

registerLevelObject('powerup', (scene, object) => {
  const kind = objectProperty<PowerUpKind>(object, 'kind');
  if (!kind || !(kind in POWERUPS.colors)) throw new Error(`Unknown power-up kind "${kind}"`);
  spawnPowerUp(scene, kind, object.x ?? 0, object.y ?? 0);
});

// The eggs in flight, for overlap checks. Destroy an egg when it hits something.
export function getEggs(scene: GameScene) {
  return stateOf(scene).eggs;
}

export function spawnPowerUp(scene: GameScene, kind: PowerUpKind, x: number, feetY: number) {
  const key = ensureTexture(scene, `powerup-${kind}`, POWERUPS.colors[kind], PICK_UP_SIZE, PICK_UP_SIZE);
  const pickUp = scene.physics.add.staticImage(x, feetY - PICK_UP_SIZE / 2, key);
  stateOf(scene).pickUps.push(pickUp);
  scene.physics.add.overlap(scene.chicken, pickUp, () => {
    if (!pickUp.visible) return;
    pickUp.setVisible(false);
    scene.chicken.setPowerUp(kind);
    playSound(scene, 'sfx-powerup');
  });
}

// One set of eggs, pick-ups and keys per run of the scene.
function stateOf(scene: GameScene) {
  const existing = states.get(scene);
  if (existing) return existing;

  const state: PowerUpState = { eggs: scene.physics.add.group(), pickUps: [] };
  states.set(scene, state);
  scene.physics.add.collider(state.eggs, scene.ground, (egg) => (egg as Phaser.GameObjects.GameObject).destroy());

  // Key events, because polling misses a tap shorter than a frame.
  const K = Phaser.Input.Keyboard.KeyCodes;
  let nextThrowAt = 0;
  onKeys(scene, [K.X, K.J], () => {
    if (scene.chicken.powerUp !== 'egg-throw' || scene.time.now < nextThrowAt) return;
    nextThrowAt = scene.time.now + POWERUPS.eggCooldownMs;
    throwEgg(scene, state.eggs);
  });
  onKeys(scene, [K.C, K.K], () => {
    if (scene.chicken.powerUp === 'mighty-crow') crow(scene);
  });

  // A caught chicken gets its pick-ups back, so a level can't be left without one it needs.
  const restorePickUps = () => state.pickUps.forEach((pickUp) => pickUp.setVisible(true));
  scene.events.on('chicken:respawned', restorePickUps);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off('chicken:respawned', restorePickUps);
    states.delete(scene);
  });
  return state;
}

// Phaser removes these keys and their listeners when the scene shuts down.
function onKeys(scene: GameScene, keyCodes: number[], action: () => void) {
  for (const code of keyCodes) scene.input.keyboard!.addKey(code).on('down', action);
}

function throwEgg(scene: GameScene, eggs: Phaser.Physics.Arcade.Group) {
  const { chicken } = scene;
  const direction = chicken.flipX ? -1 : 1;
  const key = ensureTexture(scene, 'egg', 0xfff6e0, EGG_SIZE, EGG_SIZE);
  const egg: Phaser.Physics.Arcade.Image = eggs.create(chicken.x + direction * EGG_SIZE, chicken.y - 4, key);
  egg.setVelocity(direction * POWERUPS.eggSpeed, -POWERUPS.eggArcSpeed);
  egg.setGravityY(POWERUPS.eggGravity - CHICKEN.gravity);
  scene.time.delayedCall(POWERUPS.eggLifeMs, () => egg.destroy());
  playSound(scene, 'sfx-egg');
}

function crow(scene: GameScene) {
  const { chicken } = scene;
  chicken.setPowerUp(null);
  scene.events.emit('chicken:crow');
  playSound(scene, 'sfx-crow');
  const ring = scene.add.circle(chicken.x, chicken.y, chicken.width / 2);
  ring.setStrokeStyle(6, POWERUPS.colors['mighty-crow']);
  scene.tweens.add({
    targets: ring,
    radius: POWERUPS.crowRingRadius,
    alpha: 0,
    duration: POWERUPS.crowRingMs,
    onComplete: () => ring.destroy(),
  });
}

function playSound(scene: Phaser.Scene, key: string) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key);
}
