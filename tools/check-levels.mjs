// Checks every level in src/levels.ts: map structure, object placement, and that
// the goal can be reached on tile data alone, with the jump limits below and no
// power-ups. Runs a small copy of the chicken's physics from each place it can
// stand. Bounce awnings count as a higher jump, and the path of a moving platform
// counts as a surface the chicken can ride along. Moving levels must be finishable
// without going left and without falling behind the screen. Pass --route <file> to
// also write the route found, for playtesting scripts.
import { readFileSync, writeFileSync } from 'node:fs';

const SIZE = 32;
const TILESETS = ['slaughterhouse', 'farm', 'road', 'market', 'rooftops', 'harbour'];
const MAIN_LEVELS = {
  'level-1': 'slaughterhouse', 'level-2': 'farm', 'level-3': 'road',
  'level-4': 'market', 'level-5': 'rooftops', 'level-6': 'harbour',
};
const BOSS_LEVELS = { boss: 'road', 'boss-2': 'harbour' };
const WORLD_2 = ['level-4', 'level-5', 'level-6', 'boss-2'];
const ENEMY_KINDS = ['worker', 'rat', 'dog', 'goose', 'fox', 'van', 'pigeon', 'cat', 'crab'];
const POWERUP_KINDS = ['egg-throw', 'flappy-wings', 'feather-armor', 'corn-rush', 'mighty-crow'];
const [TOP, FILL, ONE_WAY, HAZARD] = [1, 2, 3, 4];

// Same numbers as CHICKEN in src/config.ts.
const GRAVITY = 1200;
const MAX_FALL = 620;
const RUN_SPEED = 200;
const BODY_WIDTH = 20;
const BODY_HEIGHT = 26;
const CENTRE_ABOVE_FEET = 14;
const STEP = 1 / 60;

// What the level design promises. Secrets may use the full jump, the required
// route may not.
const REQUIRED = { rise: 3.2, gap: 3, speeds: [0, 70, 140] };
const FULL = { rise: 3.9, gap: 4, speeds: [0, 70, 140, 190] };
const RUN_UP = { speed: 190, gap: 4, tiles: 3 };
const LATE_FROM = 0.5; // a run-up gap is a late challenge
const MIN_CORN = { 1: 100, 2: 120 };
const CHECKPOINTS = { 1: [2, 3], 2: [2, 2] };
const MAX_CHECKPOINT_BEFORE_CHASE = 20; // tiles
const MIN_CHASE_TILES = 30;
const BOSS_FLOOR_MIN = 110; // px each side, where eggs drop
const BOSS_FLOOR_PEN = 210; // px on one side, for the pig pen
const SCOOTER_FLOOR_TILES = 10; // each side of the scooter boss
const PIGEON_HEIGHT = [3, 5]; // tiles above the floor below it, where it flies
const CAT_FLAT_TILES = 5; // room to pounce along

// Level props, as in src/features/props.ts.
const BOUNCE_POWER = 760;
const BOUNCE_HALF_WIDTH = 32;

// Moving levels, as in src/scenes/GameScene.ts.
const SCREEN_WIDTH = 640;
const SCROLL_MIN_START_X = 240;
const SCROLL_RESPAWN_LEAD = 200;
const SCROLL_START_DELAY = 1;
// A first-time player is slower than the route, and needs some room behind it.
const PLAYER_SLOWNESS = 1.25;
const SCROLL_SAFE_PX = 40;

const wantRoutes = process.argv.includes('--route');
const routes = {};

const key = (x, y) => `${x},${y}`;
const parseKey = (text) => text.split(',').map(Number);
const property = (object, name) => object.properties?.find((p) => p.name === name)?.value;
const isBossLevel = (name) => name in BOSS_LEVELS;

// Each moving platform becomes the list of tiles its top passes, as one-way tiles.
function platformPath(object) {
  const [dx, dy] = [Number(property(object, 'dx') ?? 0), Number(property(object, 'dy') ?? 0)];
  const left = object.x - object.width / 2;
  const top = object.y - object.height;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) / SIZE;
  const tiles = [];
  for (let step = 0; step <= steps; step++) {
    const share = steps ? step / steps : 0;
    const column = Math.round((left + dx * share) / SIZE);
    const row = Math.round((top + dy * share) / SIZE);
    for (let x = column; x < column + Math.round(object.width / SIZE); x++) tiles.push([x, row]);
  }
  return { dx, dy, left, top, tiles, periodMs: Number(property(object, 'periodMs') ?? 0) };
}

function loadMap(name) {
  const map = JSON.parse(readFileSync(`public/levels/${name}.json`, 'utf8'));
  const ground = map.layers.find((layer) => layer.name === 'ground');
  const objects = map.layers.find((layer) => layer.name === 'objects')?.objects ?? [];
  const realTile = (x, y) => (x < 0 || x >= map.width || y < 0 || y >= map.height ? 0 : ground.data[y * map.width + x]);

  const platforms = objects.filter((object) => object.type === 'moving-platform').map(platformPath);
  const platformAt = new Map();
  platforms.forEach((platform, index) => {
    for (const tile of platform.tiles) if (!realTile(...tile)) platformAt.set(key(...tile), index);
  });
  const tileAt = (x, y) => realTile(x, y) || (platformAt.has(key(x, y)) ? ONE_WAY : 0);
  const solid = (x, y) => x < 0 || x >= map.width || [TOP, FILL].includes(realTile(x, y));
  const standable = (x, y) => (solid(x, y) || tileAt(x, y) === ONE_WAY) && x >= 0 && x < map.width
    && !solid(x, y - 1) && tileAt(x, y - 1) !== HAZARD;

  // Landing anywhere on an awning throws the chicken up, so those tiles have no other move.
  const bounceAt = new Map();
  for (const object of objects.filter((o) => o.type === 'bounce')) {
    const row = object.y / SIZE;
    const power = Number(property(object, 'power') ?? BOUNCE_POWER);
    for (let x = Math.floor((object.x - BOUNCE_HALF_WIDTH - BODY_WIDTH / 2) / SIZE);
      x <= Math.floor((object.x + BOUNCE_HALF_WIDTH + BODY_WIDTH / 2 - 1) / SIZE); x++) {
      const centre = (x + 0.5) * SIZE;
      if (Math.abs(centre - object.x) < BOUNCE_HALF_WIDTH + BODY_WIDTH / 2) bounceAt.set(key(x, row), power);
    }
  }

  const mapProperties = Array.isArray(map.properties) ? map.properties : [];
  const scrollSpeed = Number(mapProperties.find((p) => p.name === 'scrollSpeed')?.value ?? 0);
  return {
    map, ground, objects, realTile, tileAt, solid, standable, platforms, platformAt, bounceAt, scrollSpeed,
  };
}

function checkStructure(name, level, fail) {
  const { map, ground, objects, realTile } = level;
  if (map.tilewidth !== SIZE || map.tileheight !== SIZE) fail('tiles must be 32x32');
  if (!ground || ground.type !== 'tilelayer') return fail('needs a "ground" tile layer');
  if (ground.data.length !== map.width * map.height) fail('ground data does not match the map size');
  if (!map.layers.some((layer) => layer.name === 'objects' && layer.type === 'objectgroup')) fail('needs an "objects" layer');
  const [tileset] = map.tilesets;
  if (!TILESETS.includes(tileset?.name)) fail(`unknown tileset ${tileset?.name}`);
  if (tileset?.columns !== 8 || tileset?.tilecount !== 8) fail('tileset must have 8 columns');
  if (ground.data.some((tile) => tile < 0 || tile > 8)) fail('tile outside the tileset');
  const wanted = MAIN_LEVELS[name] ?? BOSS_LEVELS[name];
  if (wanted && tileset?.name !== wanted) fail(`should use the ${wanted} tileset`);

  const ids = new Set(objects.map((object) => object.id));
  if (ids.size !== objects.length) fail('object ids are not unique');
  for (const object of objects) {
    const kind = property(object, 'kind');
    if (object.type === 'enemy' && !ENEMY_KINDS.includes(kind)) fail(`enemy with kind ${kind}`);
    if (object.type === 'powerup' && !POWERUP_KINDS.includes(kind)) fail(`power-up with kind ${kind}`);
    const footed = ['enemy', 'checkpoint', 'boss', 'scooter-boss', 'bounce'].includes(object.type)
      && !(object.type === 'enemy' && kind === 'pigeon')
      || ['spawn', 'goal'].includes(object.name);
    if (footed && !(object.name === 'goal' && isBossLevel(name))) {
      const [x, y] = [Math.floor(object.x / SIZE), object.y / SIZE];
      if (!Number.isInteger(y) || ![TOP, FILL, ONE_WAY].includes(realTile(x, y))) {
        fail(`${object.name || object.type} at column ${x} is not standing on a tile`);
      }
    }
    if (object.type === 'enemy' && kind === 'pigeon') checkPigeon(object, level, fail);
    if (object.type === 'enemy' && kind === 'cat') checkCat(object, level, fail);
    if (object.type === 'bounce') {
      const power = property(object, 'power');
      if (power !== undefined && !(power > 0)) fail(`bounce at column ${Math.floor(object.x / SIZE)} needs a positive power`);
    }
  }
  for (const objectName of ['spawn', 'goal']) {
    if (objects.filter((object) => object.name === objectName).length !== 1) fail(`needs exactly one ${objectName}`);
  }
  if (name === 'boss' && objects.filter((object) => object.type === 'boss').length !== 1) fail('needs a boss object');
  if (name === 'boss-2' && objects.filter((object) => object.type === 'scooter-boss').length !== 1) {
    fail('needs a scooter-boss object');
  }
}

// A pigeon's point is its feet while flying, 3-5 tiles above the floor below it.
function checkPigeon(object, { realTile, map }, fail) {
  const [x, y] = [Math.floor(object.x / SIZE), object.y / SIZE];
  let floor = y;
  while (floor < map.height && !realTile(x, floor)) floor += 1;
  const height = floor - y;
  if (!Number.isInteger(y) || height < PIGEON_HEIGHT[0] || height > PIGEON_HEIGHT[1]) {
    fail(`pigeon at column ${x} should fly ${PIGEON_HEIGHT.join('-')} tiles above a floor, is ${height}`);
  }
}

// A cat pounces along flat ground, so it needs a run of it.
function checkCat(object, { solid, map }, fail) {
  const [x, row] = [Math.floor(object.x / SIZE), object.y / SIZE];
  const flat = (column) => solid(column, row) && !solid(column, row - 1) && column > 0 && column < map.width - 1;
  let [from, to] = [x, x];
  while (flat(from - 1)) from -= 1;
  while (flat(to + 1)) to += 1;
  if (to - from + 1 < CAT_FLAT_TILES) fail(`cat at column ${x} has only ${to - from + 1} tiles of flat ground`);
}

// Platforms must start on the tile grid so the route search can model them, and
// must never run into the ground or leave a rider no headroom.
function checkPlatforms(level, fail) {
  const { objects, platforms, realTile, solid } = level;
  objects.filter((object) => object.type === 'moving-platform').forEach((object, index) => {
    const where = `moving-platform at column ${Math.floor(object.x / SIZE)}`;
    const { dx, dy, left, top, tiles, periodMs } = platforms[index];
    if (!(object.width > 0 && object.height > 0)) return fail(`${where} must be a rectangle`);
    if (!(periodMs > 0)) fail(`${where} needs a positive periodMs`);
    if (!dx && !dy) fail(`${where} does not move`);
    if (left % SIZE || top % SIZE || dx % SIZE || dy % SIZE || object.width % SIZE) {
      fail(`${where} must start and travel on the tile grid`);
    }
    if (dx && dy && Math.abs(dx) !== Math.abs(dy)) fail(`${where} may only move straight or at 45 degrees`);
    for (const [x, row] of tiles) {
      if (realTile(x, row)) fail(`${where} runs into a tile at ${x},${row}`);
      if (solid(x, row - 1)) fail(`${where} leaves no headroom at ${x},${row - 1}`);
    }
  });
}

function checkBossArena({ objects, solid, map }, fail) {
  const boss = objects.find((object) => object.type === 'boss');
  if (!boss) return;
  const row = boss.y / SIZE;
  const flatTo = (direction) => {
    let px = 0;
    for (let x = Math.floor(boss.x / SIZE) + direction; x >= 0 && x < map.width; x += direction) {
      if (!solid(x, row) || solid(x, row - 1)) break;
      px += SIZE;
    }
    return px + (direction > 0 ? SIZE - boss.x % SIZE : boss.x % SIZE);
  };
  const [left, right] = [flatTo(-1), flatTo(1)];
  if (Math.min(left, right) < BOSS_FLOOR_MIN) fail(`boss needs ${BOSS_FLOOR_MIN}px of floor each side, has ${left} and ${right}`);
  if (Math.max(left, right) < BOSS_FLOOR_PEN) fail(`boss needs ${BOSS_FLOOR_PEN}px of floor on one side for the pig pen`);
}

// The scooter boss drives across flat floor, at least 10 tiles each side, with
// room above it.
function checkScooterArena({ objects, solid, tileAt }, fail, notes) {
  const boss = objects.find((object) => object.type === 'scooter-boss');
  if (!boss) return;
  const [column, row] = [Math.floor(boss.x / SIZE), boss.y / SIZE];
  const flat = (x) => solid(x, row) && !solid(x, row - 1) && !solid(x, row - 2) && tileAt(x, row - 1) !== HAZARD;
  const reach = (direction) => {
    let tiles = 0;
    while (flat(column + direction * (tiles + 1))) tiles += 1;
    return tiles;
  };
  const [left, right] = [reach(-1), reach(1)];
  if (!flat(column) || Math.min(left, right) < SCOOTER_FLOOR_TILES) {
    fail(`scooter-boss needs ${SCOOTER_FLOOR_TILES} tiles of flat floor each side, has ${left} and ${right}`);
  }
  notes.push(`scooter arena with ${left} and ${right} tiles of floor`);
}

function checkSpareEggs({ objects }, fail) {
  const spare = objects.some((object) => object.type === 'powerup' && property(object, 'kind') === 'egg-throw');
  if (!spare) fail('boss arena needs a spare egg-throw power-up');
}

function checkMainLevel(name, level, fail, notes) {
  const world = WORLD_2.includes(name) ? 2 : 1;
  const count = (type) => level.objects.filter((object) => object.type === type).length;
  const checkpoints = count('checkpoint');
  const [fewest, most] = CHECKPOINTS[world];
  if (checkpoints < fewest || checkpoints > most) fail(`has ${checkpoints} checkpoints, wants ${fewest}-${most}`);
  if (count('golden-egg') !== 3) fail(`has ${count('golden-egg')} golden eggs, wants 3`);
  if (count('corn') < MIN_CORN[world]) fail(`has ${count('corn')} corn, wants at least ${MIN_CORN[world]}`);
  const props = count('bounce') + count('moving-platform') ? `, ${count('bounce')} bounces, ${count('moving-platform')} moving platforms` : '';
  notes.push(`${count('corn')} corn, ${checkpoints} checkpoints, ${count('enemy')} enemies, ${count('powerup')} power-ups${props}`);
}

function checkChases(level, fail, notes) {
  const { objects, map, solid } = level;
  const starts = objects.filter((object) => object.type === 'chase-start').sort((a, b) => a.x - b.x);
  const ends = objects.filter((object) => object.type === 'chase-end').sort((a, b) => a.x - b.x);
  if (level.scrollSpeed && starts.length + ends.length) fail('a moving level has no butcher chases, the screen is the chase');
  if (starts.length !== ends.length) fail('chase-start and chase-end do not pair up');
  starts.forEach((start, index) => {
    const end = ends[index];
    if (!end || end.x <= start.x) return fail('chase-end must come after its chase-start');
    const [from, to] = [Math.floor(start.x / SIZE), Math.floor(end.x / SIZE)];
    if (to - from < MIN_CHASE_TILES) fail(`chase at column ${from} is only ${to - from} tiles`);
    // Skips any roof, then finds the first solid tile below the open space.
    const floor = (x) => { let y = 0; while (y < map.height && solid(x, y)) y++; while (y < map.height && !solid(x, y)) y++; return y; };
    for (let x = from - 6; x <= to + 6; x++) {
      if (floor(x) !== floor(from)) fail(`chase at column ${from} is not flat at column ${x}, the butcher could get stuck`);
    }
    // Chase rectangles use the bottom-centre as x and y, like every other object.
    if (start.y !== floor(from) * SIZE) fail(`chase at column ${from}: y must be the floor, the bottom of the rectangle`);
    if (end.y !== floor(to) * SIZE) fail(`chase end at column ${to}: y must be the floor, the bottom of the rectangle`);
    const checkpoint = objects.some((object) => object.type === 'checkpoint'
      && object.x < start.x - start.width / 2 && object.x >= start.x - MAX_CHECKPOINT_BEFORE_CHASE * SIZE);
    if (!checkpoint) fail(`no checkpoint right before the chase at column ${from}`);
    if (objects.some((object) => object.type === 'enemy' && object.x >= start.x && object.x <= end.x)) {
      fail(`enemy inside the chase at column ${from}`);
    }
    if (objects.some((object) => ['bounce', 'moving-platform'].includes(object.type) && object.x >= start.x - 6 * SIZE && object.x <= end.x + 6 * SIZE)) {
      fail(`prop inside the chase at column ${from}`);
    }
    notes.push(`chase of ${to - from} tiles from column ${from}`);
  });
}

// Follows one jump or fall until it lands. Returns the tile it lands on and the
// time in the air, or null.
function flight(level, x, row, jumpSpeed, speed, touched) {
  const { map, solid, standable, tileAt } = level;
  const halfWidth = BODY_WIDTH / 2;
  const blocked = (left, feet) => {
    const [x1, x2] = [Math.floor(left / SIZE), Math.floor((left + BODY_WIDTH - 0.01) / SIZE)];
    const [y1, y2] = [Math.floor((feet - BODY_HEIGHT) / SIZE), Math.floor((feet - 0.01) / SIZE)];
    for (let cx = x1; cx <= x2; cx++) for (let cy = y1; cy <= y2; cy++) if (solid(cx, cy)) return true;
    return false;
  };
  let feet = row * SIZE;
  let vy = -jumpSpeed;
  let frames = 0;
  while (feet < map.height * SIZE + SIZE) {
    frames += 1;
    vy = Math.min(vy + GRAVITY * STEP, MAX_FALL);
    const nextX = x + speed * STEP;
    if (!blocked(nextX - halfWidth, feet)) x = nextX;
    let nextFeet = feet + vy * STEP;
    if (vy < 0 && blocked(x - halfWidth, nextFeet)) { vy = 0; nextFeet = feet; }
    if (vy >= 0) {
      const landingRow = Math.ceil(feet / SIZE - 1e-6);
      if (nextFeet >= landingRow * SIZE) {
        const columns = [Math.floor(x / SIZE), Math.floor((x - halfWidth + 1) / SIZE), Math.floor((x + halfWidth - 1) / SIZE)];
        const landing = columns.find((column) => solid(column, landingRow) || tileAt(column, landingRow) === ONE_WAY);
        if (landing !== undefined) {
          return standable(landing, landingRow) ? { tile: [landing, landingRow], time: frames * STEP } : null;
        }
      }
    }
    feet = nextFeet;
    const [centreX, centreY] = [Math.floor(x / SIZE), Math.floor((feet - CENTRE_ABOVE_FEET) / SIZE)];
    if (tileAt(centreX, centreY) === HAZARD) return null;
    touched?.add(key(Math.floor((x - halfWidth) / SIZE), centreY));
    touched?.add(key(Math.floor((x + halfWidth) / SIZE), centreY));
    touched?.add(key(centreX, Math.floor((feet - 2) / SIZE)));
    touched?.add(key(centreX, Math.floor((feet - BODY_HEIGHT) / SIZE)));
  }
  return null;
}

function hasRunUp(level, x, row, direction) {
  for (let i = 1; i <= RUN_UP.tiles; i++) {
    const behind = x - direction * i;
    if (!level.standable(behind, row) || level.bounceAt.has(key(behind, row))) return false;
  }
  return true;
}

const WALK_TIME = SIZE / RUN_SPEED;

// Every place reachable in one move from a tile.
function moves(level, x, row, limits, allowRunUp, touched) {
  const { standable, solid, bounceAt, platformAt, platforms } = level;
  const found = [];
  const add = (landing, move) => {
    if (landing && key(...landing.tile) !== key(x, row)) found.push({ to: landing.tile, time: landing.time, ...move });
  };

  // An awning throws the chicken up whatever it does, so it can only steer.
  const power = bounceAt.get(key(x, row));
  if (power) {
    for (const direction of [-1, 1]) {
      for (const speed of limits.speeds) {
        if (speed === 0 && direction === 1) continue;
        add(flight(level, (x + 0.5) * SIZE, row, power, direction * speed, touched), { bounce: true, direction, speed });
      }
    }
    return found;
  }

  for (const direction of [-1, 1]) {
    if (standable(x + direction, row)) {
      add({ tile: [x + direction, row], time: WALK_TIME }, { walk: true, direction });
      touched?.add(key(x + direction, row - 1));
    } else if (!solid(x + direction, row - 1)) {
      // Walking off a ledge.
      const edge = (x + (direction + 1) / 2) * SIZE + direction * (BODY_WIDTH / 2 + 1);
      for (const speed of [0, 70, 140, 190]) {
        add(flight(level, edge, row, 0, direction * speed, touched), { fall: true, direction, speed });
      }
    }
  }

  // Riding a moving platform to anywhere along its path. In the worst case it has
  // just left, so it takes a whole trip.
  const platform = platformAt.get(key(x, row));
  if (platform !== undefined) {
    for (const tile of platforms[platform].tiles) {
      if (platformAt.get(key(...tile)) === platform) {
        add({ tile, time: platforms[platform].periodMs / 1000 }, { ride: true, platform });
      }
    }
  }

  const rises = [1.2, 2.2, limits.rise];
  for (const rise of rises) {
    const jumpSpeed = Math.sqrt(2 * GRAVITY * rise * SIZE);
    for (const direction of [-1, 1]) {
      for (const speed of limits.speeds) {
        if (speed === 0 && direction === 1) continue;
        for (const offset of [2, 8, 16, 24, 30]) {
          const landing = flight(level, x * SIZE + offset, row, jumpSpeed, direction * speed, touched);
          if (!landing) continue;
          const gap = Math.abs(landing.tile[0] - x) - 1;
          if (gap <= limits.gap) add(landing, { rise, direction, speed, offset });
        }
      }
    }
  }
  if (allowRunUp) {
    const jumpSpeed = Math.sqrt(2 * GRAVITY * REQUIRED.rise * SIZE);
    for (const direction of [-1, 1]) {
      if (!hasRunUp(level, x, row, direction)) continue;
      const offset = direction > 0 ? SIZE - 2 : 2;
      const landing = flight(level, x * SIZE + offset, row, jumpSpeed, direction * RUN_UP.speed);
      if (landing && Math.abs(landing.tile[0] - x) - 1 === RUN_UP.gap) {
        add(landing, { rise: REQUIRED.rise, direction, speed: RUN_UP.speed, offset, runUp: true });
      }
    }
  }
  return found;
}

// With forwardOnly, as in a moving level, no move may end left of where it began.
function explore(level, start, limits, allowRunUp, touched, forwardOnly = false) {
  const parents = new Map([[key(...start), null]]);
  const edges = new Map();
  const queue = [start];
  while (queue.length) {
    const [x, row] = queue.shift();
    const from = key(x, row);
    let nextMoves = moves(level, x, row, limits, allowRunUp, touched);
    if (forwardOnly) nextMoves = nextMoves.filter((move) => move.to[0] >= x);
    edges.set(from, nextMoves);
    for (const move of nextMoves) {
      const to = key(...move.to);
      if (!parents.has(to)) {
        parents.set(to, { from, move });
        queue.push(move.to);
      }
    }
  }
  return { parents, edges };
}

// The route with the fewest run-up gaps, then the least jumping. Or with byTime,
// the quickest route.
function cheapestRoute(edges, start, target, byTime = false) {
  const moveCost = byTime
    ? (move) => move.time + (move.runUp ? 1 : 0)
    : (move) => (move.runUp ? 10000 : move.walk ? 1 : 8);
  const best = new Map([[start, { cost: 0 }]]);
  const open = new Set([start]);
  while (open.size) {
    let current;
    for (const tile of open) if (!current || best.get(tile).cost < best.get(current).cost) current = tile;
    open.delete(current);
    if (current === target) break;
    for (const move of edges.get(current) ?? []) {
      const to = key(...move.to);
      const cost = best.get(current).cost + moveCost(move);
      if (cost < (best.get(to)?.cost ?? Infinity)) {
        best.set(to, { cost, from: current, move });
        open.add(to);
      }
    }
  }
  const route = [];
  for (let tile = target; best.get(tile)?.from; tile = best.get(tile).from) {
    route.unshift({ from: parseKey(best.get(tile).from), ...best.get(tile).move });
  }
  return route;
}

// The screen's left edge over time in a moving level, from a start or respawn at x.
function screenClock(level, x) {
  const marks = level.objects.filter((object) => object.type === 'scroll-speed')
    .map((object) => ({ x: object.x, speed: Number(property(object, 'speed') ?? level.scrollSpeed) }))
    .sort((a, b) => a.x - b.x);
  const lastScroll = level.map.width * SIZE - SCREEN_WIDTH;
  let scroll = Math.min(Math.max(x - SCROLL_RESPAWN_LEAD, 0), lastScroll);
  let time = 0;
  return (until) => {
    for (; time < until; time += STEP) {
      if (time < SCROLL_START_DELAY) continue;
      const middle = scroll + SCREEN_WIDTH / 2;
      const speed = marks.filter((mark) => mark.x <= middle).at(-1)?.speed ?? level.scrollSpeed;
      scroll = Math.min(lastScroll, scroll + speed * STEP);
    }
    return scroll;
  };
}

// A moving level must be finishable going right only, from the spawn and from each
// checkpoint, and a player a little slower than the quickest route keeps up.
function checkMovingLevel(name, level, start, target, fail, notes) {
  const { objects } = level;
  for (const object of objects.filter((o) => o.name === 'spawn' || o.type === 'checkpoint')) {
    if (object.x < SCROLL_MIN_START_X) fail(`${object.name || object.type} at x ${object.x} is closer than ${SCROLL_MIN_START_X}px to the left end`);
  }
  const startPoints = [start, ...objects.filter((o) => o.type === 'checkpoint')
    .map((o) => [Math.floor(o.x / SIZE), Math.ceil(o.y / SIZE)])];
  let slowest = Infinity;
  startPoints.forEach((point, index) => {
    const forward = explore(level, point, REQUIRED, true, undefined, true);
    if (!forward.parents.has(target)) {
      const furthest = Math.max(...[...forward.parents.keys()].map((tile) => parseKey(tile)[0]));
      fail(`going right only from column ${point[0]}, stuck at column ${furthest}`);
      return;
    }
    const route = cheapestRoute(forward.edges, key(...point), target, true);
    if (index === 0 && wantRoutes) routes[name] = route;
    const clock = screenClock(level, point[0] * SIZE + SIZE / 2);
    let time = 0;
    for (const step of route) {
      time += step.time * PLAYER_SLOWNESS;
      // Rides wait for the platform, so check the start of each step too.
      for (const [x, at] of [[step.from[0], time - step.time * PLAYER_SLOWNESS], [step.to[0], time]]) {
        const lead = (x + 0.5) * SIZE - clock(at);
        slowest = Math.min(slowest, lead);
        if (lead < SCROLL_SAFE_PX) {
          fail(`from column ${point[0]}, a player falls behind the screen near column ${x}`);
          return;
        }
      }
    }
    notes.push(`moving: ${route.length} moves from column ${point[0]}, about ${Math.round(time)}s`);
  });
  notes.push(`moving: the closest the screen gets is ${Math.round(slowest)}px`);
}

function checkPath(name, level, fail, notes) {
  const { map, objects } = level;
  const objectTile = (object) => [Math.floor(object.x / SIZE), Math.ceil(object.y / SIZE)];
  const spawn = objects.find((object) => object.name === 'spawn');
  const goal = objects.find((object) => object.name === 'goal');
  const start = objectTile(spawn);
  if (!level.standable(...start)) return fail('cannot stand at the spawn');
  const target = key(...objectTile(goal));

  const found = explore(level, start, REQUIRED, !isBossLevel(name));
  const touched = new Set();
  const full = explore(level, start, FULL, true, touched);

  if (isBossLevel(name)) {
    if (full.parents.has(target)) fail('the goal must stay out of reach');
    for (const type of ['boss', 'scooter-boss']) {
      const boss = objects.find((object) => object.type === type);
      if (boss && !full.parents.has(key(...objectTile(boss)))) fail(`cannot reach the ${type}`);
    }
  } else if (!found.parents.has(target)) {
    const furthest = Math.max(...[...found.parents.keys()].map((tile) => parseKey(tile)[0]));
    fail(`no route from spawn to goal within the jump limits, stuck at column ${furthest}`);
  } else {
    const route = cheapestRoute(found.edges, key(...start), target);
    if (wantRoutes) routes[name] = route;
    const runUps = route.filter((step) => step.runUp);
    const bounces = route.filter((step) => step.bounce);
    const rides = route.filter((step) => step.ride);
    notes.push(`route of ${route.length} moves, ${route.filter((step) => step.rise).length} jumps, ${runUps.length} run-up gaps, ${bounces.length} bounces, ${rides.length} rides`);
    for (const step of runUps) {
      if (step.from[0] < map.width * LATE_FROM) fail(`run-up gap at column ${step.from[0]} is not late in the level`);
    }
    if (level.scrollSpeed) checkMovingLevel(name, level, start, target, fail, notes);

    // Nowhere reachable may be a dead end, as falling is the only other way out.
    const reverse = new Map();
    for (const [from, nextMoves] of full.edges) {
      for (const move of nextMoves) {
        const to = key(...move.to);
        if (!reverse.has(to)) reverse.set(to, []);
        reverse.get(to).push(from);
      }
    }
    const canFinish = new Set([target]);
    const queue = [target];
    while (queue.length) {
      for (const from of reverse.get(queue.pop()) ?? []) {
        if (!canFinish.has(from)) { canFinish.add(from); queue.push(from); }
      }
    }
    const stuck = [...full.parents.keys()].filter((tile) => !canFinish.has(tile));
    if (stuck.length) fail(`dead ends with no way on: ${stuck.slice(0, 8).join(' ')}`);
  }

  const touchedOrStood = (object) => {
    const [x, row] = [Math.floor(object.x / SIZE), Math.floor((object.y - 8) / SIZE)];
    return touched.has(key(x, row)) || full.parents.has(key(x, row + 1));
  };
  for (const object of objects) {
    if (['golden-egg', 'checkpoint', 'powerup', 'enemy', 'bounce'].includes(object.type) && !touchedOrStood(object)) {
      fail(`${object.type} at column ${Math.floor(object.x / SIZE)}, row ${object.y / SIZE} is out of reach`);
    }
  }
  level.platforms.forEach((platform) => {
    if (!platform.tiles.some((tile) => full.parents.has(key(...tile)))) {
      fail(`moving-platform at column ${platform.tiles[0][0]} can never be stood on`);
    }
  });
  const missedCorn = objects.filter((object) => object.type === 'corn' && !touchedOrStood(object));
  if (missedCorn.length) notes.push(`${missedCorn.length} corn only reachable with a power-up`);
  return found;
}

const levelNames = [...readFileSync('src/levels.ts', 'utf8').matchAll(/levels: (\[.*?\])/g)]
  .flatMap((match) => JSON.parse(match[1].replaceAll("'", '"')));
let failures = 0;

for (const name of levelNames) {
  const fail = (message) => { failures += 1; console.log(`  FAIL ${message}`); };
  console.log(name);
  const notes = [];
  try {
    const level = loadMap(name);
    checkStructure(name, level, fail);
    checkPlatforms(level, fail);
    if (MAIN_LEVELS[name]) checkMainLevel(name, level, fail, notes);
    checkChases(level, fail, notes);
    if (name === 'boss') checkBossArena(level, fail);
    if (name === 'boss-2') checkScooterArena(level, fail, notes);
    if (isBossLevel(name)) checkSpareEggs(level, fail);
    checkPath(name, level, fail, notes);
  } catch (error) {
    fail(error.message);
  }
  for (const note of notes) console.log(`  ${note}`);
}
if (wantRoutes) writeFileSync(process.argv[process.argv.indexOf('--route') + 1], JSON.stringify(routes));
console.log(failures ? `${failures} problems found` : 'All levels look good');
process.exit(failures ? 1 : 0);
