// Level props: registers "bounce" and "moving-platform".
import Phaser from 'phaser';
import { ensureTexture } from '../art';
import { playSound } from '../audio';
import { objectProperty, registerLevelObject } from '../levelObjects';
import type { GameScene } from '../scenes/GameScene';

type TiledObject = Phaser.Types.Tilemaps.TiledObject;

const BOUNCE = { width: 64, height: 16, color: 0xe85d75, power: 760, squashMs: 160 };
const PLATFORM = { width: 96, height: 16, color: 0x8b5a2b };

// Adds a scene event listener for this run of the scene only.
function listen(scene: GameScene, event: string, listener: (...args: never[]) => void) {
  scene.events.on(event, listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(event, listener));
}

// An awning that throws the chicken up when it lands or steps on it. It is not
// solid, so the chicken never stands on it and its own jump cannot replace the throw.
// Any part of the chicken touching it counts, as in tools/check-levels.mjs.
function addBounce(scene: GameScene, object: TiledObject) {
  const x = object.x ?? 0;
  const feetY = object.y ?? 0;
  const power = Number(objectProperty<number>(object, 'power') ?? BOUNCE.power);
  const key = ensureTexture(scene, 'bounce', BOUNCE.color, BOUNCE.width, BOUNCE.height);
  const awning = scene.physics.add.staticSprite(x, feetY - BOUNCE.height / 2, key, 0);
  let releaseAt = 0;

  // The real art shows frame 1 while squashed. The placeholder has one frame, so it flattens.
  const rest = () => awning.setFrame(0).setScale(1).setY(feetY - BOUNCE.height / 2);
  const squash = () => {
    if (awning.texture.has('1')) awning.setFrame(1);
    else awning.setScale(1, 0.5).setY(feetY - BOUNCE.height / 4);
    releaseAt = scene.time.now + BOUNCE.squashMs;
  };

  scene.physics.add.overlap(scene.chicken, awning, () => {
    if (scene.chicken.body.velocity.y < 0) return;
    scene.chicken.launch(power);
    squash();
    playSound(scene, 'sfx-bounce');
  });
  listen(scene, Phaser.Scenes.Events.UPDATE, () => {
    if (releaseAt && scene.time.now >= releaseAt) {
      releaseAt = 0;
      rest();
    }
  });
  listen(scene, 'chicken:respawned', () => {
    releaseAt = 0;
    rest();
  });
}

// A platform that travels dx, dy and back over periodMs, easing at each end. It
// carries the chicken, which can jump up through it and stand on it.
function addMovingPlatform(scene: GameScene, object: TiledObject) {
  const width = object.width || PLATFORM.width;
  const height = object.height || PLATFORM.height;
  const startX = object.x ?? 0;
  const startY = (object.y ?? 0) - height / 2;
  const dx = Number(objectProperty<number>(object, 'dx') ?? 0);
  const dy = Number(objectProperty<number>(object, 'dy') ?? 0);
  const periodMs = Math.max(1, Number(objectProperty<number>(object, 'periodMs') ?? 4000));

  const key = ensureTexture(scene, 'moving-platform', PLATFORM.color, PLATFORM.width, PLATFORM.height);
  const platform = scene.physics.add.image(startX, startY, key).setDisplaySize(width, height);
  const body = platform.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false).setImmovable(true);
  // Stood on from above only. Friction carries the chicken along sideways.
  body.checkCollision.down = false;
  body.checkCollision.left = false;
  body.checkCollision.right = false;
  body.friction.set(1, 0);
  // Standing on it counts as standing on the ground, even while it rises.
  scene.physics.add.collider(scene.chicken, platform, () => {
    if (scene.chicken.body.touching.down) scene.chicken.endJump();
  });

  let startedAt = scene.time.now;
  const positionAt = (time: number) => {
    const share = (1 - Math.cos(((time - startedAt) / periodMs) * Math.PI * 2)) / 2;
    return { x: startX + dx * share, y: startY + dy * share };
  };

  // Steers by velocity rather than moving it directly, so the physics can carry a rider.
  // Runs before the physics steps, aiming for where the platform should be one step on.
  const stepMs = 1000 / scene.physics.world.fps;
  listen(scene, Phaser.Scenes.Events.PRE_UPDATE, () => {
    const target = positionAt(scene.time.now + stepMs);
    body.setVelocity(((target.x - platform.x) * 1000) / stepMs, ((target.y - platform.y) * 1000) / stepMs);
  });
  listen(scene, 'chicken:respawned', () => {
    startedAt = scene.time.now;
    body.reset(startX, startY);
  });
}

registerLevelObject('bounce', addBounce);
registerLevelObject('moving-platform', addMovingPlatform);
