# Shared contracts

How the parts of the game connect, so work can happen in parallel without
editing the same code. Change this file only if a contract truly has to change,
and say so in the pull request.

## File ownership

| Owner                  | Files                                                       |
| ---------------------- | ----------------------------------------------------------- |
| Agent A, power-ups     | `src/features/powerups*`, `src/objects/Chicken.ts`, `src/config.ts` (`POWERUPS`) |
| Agent B, enemies       | `src/features/enemies*`, `src/config.ts` (`ENEMIES`)        |
| Agent C, art and sound | `public/assets/`, `tools/art/`, `src/scenes/BootScene.ts`, `CREDITS.md` |
| Agent D, levels        | `src/features/collectibles*`, `public/levels/`, `tools/`, `src/levels.ts`, `src/text.ts` |
| Phase 3                | `src/scenes/GameScene.ts`, HUD, menus, touch controls       |

A feature can grow from `src/features/name.ts` into a `src/features/name/`
folder. Keep `src/scenes/GameScene.ts` unchanged. If you need a change there,
describe it in the pull request.

## Level objects

Maps have a `ground` tile layer and an `objects` object layer. Objects are found
by `name` for `spawn` and `goal`. Everything else uses the Tiled `type` field,
and the owner claims it with `registerLevelObject(type, factory)` from
`src/levelObjects.ts`. Read custom properties with `objectProperty`.

| Type          | Properties                                                   | Owner |
| ------------- | ------------------------------------------------------------ | ----- |
| `powerup`     | `kind`: `egg-throw`, `flappy-wings`, `feather-armor`, `corn-rush`, `mighty-crow` | A |
| `enemy`       | `kind`: `worker`, `rat`, `dog`, `goose`, `fox`, `van`        | B     |
| `chase-start` | rectangle the chicken enters; `speed` (optional, px/s)       | B     |
| `chase-end`   | rectangle the chicken enters                                 | B     |
| `boss`        | point where the boss fight happens                           | B     |
| `corn`        | none                                                         | D     |
| `golden-egg`  | none                                                         | D     |
| `checkpoint`  | none                                                         | D     |

Objects use their bottom-centre as x and y. Point objects sit where feet touch
the ground.

## GameScene API

- `scene.chicken`, `scene.ground`
- `scene.setCheckpoint(x, feetY)`: where the chicken returns when caught
- `scene.catchChicken()`: send the chicken back, for example when the butcher
  catches it
- `scene.finishLevel()`: next level, for example when the boss is defeated
- `scene.events` emits `chicken:respawned`. Reset chases on it, and remove your
  listener on `Phaser.Scenes.Events.SHUTDOWN`, because scene events outlive a
  restart.

## Chicken API

- `chicken.takeHit()`: every source of damage calls this. It handles the
  invulnerable time and hearts. Power-up rules that absorb a hit go inside it.
- `chicken.hearts`: current hearts
- `chicken.powerUp`: the held power-up or null. Set it with `setPowerUp(kind)`.
- Events: `hit`, `defeated`

## Power-up API

- `getEggs(scene)`: the group of eggs in flight
- `spawnPowerUp(scene, kind, x, feetY)`
- `scene.events` emits `chicken:crow` when the chicken crows, and receives
  `input:action` from the touch button, which throws an egg or crows.

## Tiles

Each tileset is 8 tiles in a single row of 32x32 tiles, and the meaning of each
index is fixed in `TILE` in `src/config.ts`:

1 top, 2 fill, 3 one-way platform, 4 hazard, 5-8 decoration.

Tilesets are named `slaughterhouse`, `farm` and `road` inside the map and loaded
as textures `tiles-slaughterhouse`, `tiles-farm` and `tiles-road`. Until those
exist, the game falls back to the placeholder texture `tiles`.

## Art

Code never depends on art existing. Use
`ensureTexture(scene, key, color, width, height)` from `src/art.ts`, which draws
a rectangle if the real image is missing. Agent C loads real images under these
keys in `BootScene`, keeping the sizes below.

| Key                                                        | Size   |
| ---------------------------------------------------------- | ------ |
| `chicken`                                                  | 28x28  |
| `butcher`                                                  | 40x56  |
| `worker`                                                   | 28x40  |
| `rat`                                                      | 28x16  |
| `dog`, `fox`                                               | 40x24  |
| `goose`                                                    | 28x32  |
| `van`                                                      | 96x48  |
| `cleaver`, `egg`, `corn`                                   | 16x16  |
| `golden-egg`                                               | 20x24  |
| `checkpoint`                                               | 24x48  |
| `goal`                                                     | 32x64  |
| `powerup-egg-throw`, `powerup-flappy-wings`, `powerup-feather-armor`, `powerup-corn-rush`, `powerup-mighty-crow` | 24x24 |

Sound keys are `sfx-jump`, `sfx-hit`, `sfx-stomp`, `sfx-corn`, `sfx-egg`,
`sfx-powerup`, `sfx-checkpoint`, `sfx-crow`, `music-slaughterhouse`, `music-farm`,
`music-road` and `music-boss`. Play them only with `scene.cache.audio.exists(key)`
checked, because sound may not exist yet.
