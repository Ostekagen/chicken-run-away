# Shared contracts

How the parts of the game connect, so work can happen in parallel without
editing the same code. Change this file only if a contract truly has to change,
and say so in the pull request.

## File ownership (Update 1: The Butcher Strikes Back)

| Owner                  | Files                                                       |
| ---------------------- | ----------------------------------------------------------- |
| Agent A, shop          | `src/scenes/ShopScene.ts` (new), `src/scenes/MenuScene.ts`, `src/scenes/LevelCompleteScene.ts`, `src/scenes/VictoryScene.ts`, `src/features/hats.ts`, `src/text.ts`, `src/ui.ts`, the scene list in `src/main.ts` |
| Agent B, enemies       | `src/features/enemies/`, `src/config.ts` (`ENEMIES`)        |
| Agent C, art and sound | `public/assets/`, `tools/art/`, `src/scenes/BootScene.ts`, `CREDITS.md` |
| Agent D, levels        | `public/levels/`, `tools/` except `tools/art/`, `src/features/props.ts`, `src/features/collectibles.ts`, the `check:levels` script line in `package.json` |
| Coordinator            | `src/scenes/GameScene.ts`, `src/scenes/HudScene.ts`, `src/objects/Chicken.ts`, `src/features/powerups.ts`, `src/save.ts`, `src/upgrades.ts`, `src/levels.ts`, this file |

A feature can grow from `src/features/name.ts` into a `src/features/name/`
folder. Don't edit files you don't own. If you need a change in one, describe it
in the pull request.

## Worlds, corn and the shop

- `src/levels.ts`: `WORLDS` (each with an `id` and its `levels`), `LEVELS` (all
  levels in order; a level unlocks when the one before it here has stars),
  `worldOf(level)`, `nextLevelInWorld(level)`, `isBossLevel(level)`. World 2 is
  `level-4` The Market, `level-5` Runaway Cart, `level-6` The Harbour and
  `boss-2` The Scooter Butcher.
- `src/save.ts`: the saved wallet. `getCorn()`, `addCorn(n)`, `owns(id)`,
  `buy(id, price)` (false if owned or too expensive), `getHat()`,
  `setHat(id | null)`. The corn collected in a level is added when the level is
  finished, before `level-complete` starts, so that screen already shows the new
  total.
- `src/upgrades.ts`: `SHOP_ITEMS` (id, `kind` of `upgrade` or `hat`, price) and
  `hasUpgrade(id)`. All upgrade effects are already wired in. The shop only sells
  them: `extra-heart`, `corn-magnet`, `longer-powerups`, `egg-basket`,
  `feather-start`, `hat-straw`, `hat-pirate`, `hat-crown`.
- Text for every shop item, world and new level goes in `src/text.ts`. Level and
  world names are already there.
- `VictoryScene` receives `{ world }` with the world id. `TEXT.endings` holds each
  world's ending.

## Moving levels

A map property `scrollSpeed` (px/s) makes a moving level: the screen scrolls on
its own, and a chicken running past 70% of the screen pulls it along faster, so a
jump is never cut off at the right edge. Falling behind the left edge counts as
caught. After the start or a catch the screen waits 1 s, with the
chicken 200 px from its left edge. A `scroll-speed` point object with a `speed`
property changes the speed once the middle of the screen passes it.
`scene.isAutoscroll` tells features which kind of level this is.

For level design: place the spawn and every checkpoint at least 240 px from the
map's left end, because the screen can't start before 0. A moving level never
needs going back left, and every wall must be climbable while the screen pushes.

## Level objects

Maps have a `ground` tile layer and an `objects` object layer. Objects are found
by `name` for `spawn` and `goal`. Everything else uses the Tiled `type` field,
and the owner claims it with `registerLevelObject(type, factory)` from
`src/levelObjects.ts`. Read custom properties with `objectProperty`.

| Type          | Properties                                                   | Owner |
| ------------- | ------------------------------------------------------------ | ----- |
| `powerup`     | `kind`: `egg-throw`, `flappy-wings`, `feather-armor`, `corn-rush`, `mighty-crow` | Coordinator |
| `enemy`       | `kind`: `worker`, `rat`, `dog`, `goose`, `fox`, `van`, and new `pigeon`, `cat`, `crab` | B |
| `chase-start` | rectangle the chicken enters; `speed` (optional, px/s)       | B     |
| `chase-end`   | rectangle the chicken enters                                 | B     |
| `boss`        | point where the World 1 boss fight happens                   | B     |
| `scooter-boss` | point in the middle of the World 2 boss arena: flat floor at least 10 tiles to each side. The boss places its own crates. | B |
| `corn`        | none                                                         | D     |
| `golden-egg`  | none                                                         | D     |
| `checkpoint`  | none                                                         | D     |
| `bounce`      | point; `power` (optional, upward px/s, default 760): an awning that throws the chicken up | D |
| `moving-platform` | rectangle at its start; `dx`, `dy` (px it travels), `periodMs` (one full trip there and back). It carries the chicken and can be stood on from above only. | D |
| `scroll-speed` | point; `speed` (px/s): see Moving levels                    | Coordinator |

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
- `chicken.hearts`: current hearts. `chicken.maxHearts` is 3, or 4 with the
  Extra Heart upgrade.
- Use `crowStunMs()` from `src/upgrades.ts` for how long the crow stuns, since
  Longer Power-ups extends it.
- `chicken.launch(speed)` throws it upward, for example from an awning. Letting go
  of jump doesn't cut a throw short. `chicken.endJump()` lets it jump again while
  still rising, for example from a lift.
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

Tilesets are named `slaughterhouse`, `farm`, `road`, and for World 2 `market`,
`rooftops` and `harbour`, inside the map, and loaded as textures `tiles-<name>`.
Until those exist, the game falls back to the placeholder texture `tiles`. Each
level's backdrop is `bg-<tileset>` and its music `music-<tileset>`. A boss level
plays `music-<level>`, so `music-boss` and `music-boss-2`.

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
| New in Update 1: |  |
| `pigeon` (animation `pigeon-fly`, 2 frames) | 28x20 |
| `cat` (`cat-walk`, 2 frames, then frame 2 is the pounce) | 32x24 |
| `crab` (`crab-walk`, 2 frames) | 32x20 |
| `scooter-butcher` (`scooter-drive`, 2 frames, then frame 2 is dazed) | 64x56 |
| `sausage` | 16x16 |
| `crate` | 32x32 |
| `bounce` (2 frames: resting, then squashed) | 64x16 |
| `moving-platform` | 96x16 |
| `hat-straw`, `hat-pirate`, `hat-crown`, drawn to sit on the chicken's head facing right | 20x14 |
| `shop-extra-heart`, `shop-corn-magnet`, `shop-longer-powerups`, `shop-egg-basket`, `shop-feather-start`, `shop-hat-straw`, `shop-hat-pirate`, `shop-hat-crown` | 32x32 |
| `bg-market`, `bg-rooftops`, `bg-harbour` | 640x360 |
| `tiles-market`, `tiles-rooftops`, `tiles-harbour` | 256x32 |

Sound keys are `sfx-jump`, `sfx-hit`, `sfx-stomp`, `sfx-corn`, `sfx-egg`,
`sfx-powerup`, `sfx-checkpoint`, `sfx-crow`, `music-slaughterhouse`, `music-farm`,
`music-road` and `music-boss`, and new in Update 1 `sfx-buy`, `sfx-bounce`,
`sfx-splash`, `music-market`, `music-rooftops`, `music-harbour` and
`music-boss-2`. Play them only with `scene.cache.audio.exists(key)` checked,
because sound may not exist yet.
