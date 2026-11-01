// Checks every level in src/levels.ts: map structure, object placement, and that
// the goal can be reached on tile data alone, with the jump limits below and no
// power-ups. Runs a small copy of the chicken's physics from each place it can
// stand. Pass --route to also print the route found, for playtesting scripts.
import { readFileSync, writeFileSync } from 'node:fs';

const SIZE = 32;
const TILESETS = ['slaughterhouse', 'farm', 'road'];
const MAIN_LEVELS = { 'level-1': 'slaughterhouse', 'level-2': 'farm', 'level-3': 'road' };
const ENEMY_KINDS = ['worker', 'rat', 'dog', 'goose', 'fox', 'van'];
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
const MIN_CORN = 100;
const MAX_CHECKPOINT_BEFORE_CHASE = 20; // tiles
const MIN_CHASE_TILES = 30;
const BOSS_FLOOR_MIN = 110; // px each side, where eggs drop
const BOSS_FLOOR_PEN = 210; // px on one side, for the pig pen

const wantRoutes = process.argv.includes('--route');
const routes = {};

const key = (x, y) => `${x},${y}`;
const parseKey = (text) => text.split(',').map(Number);

function loadMap(name) {
  const map = JSON.parse(readFileSync(`public/levels/${name}.json`, 'utf8'));
  const ground = map.layers.find((layer) => layer.name === 'ground');
  const objects = map.layers.find((layer) => layer.name === 'objects')?.objects ?? [];
  const tileAt = (x, y) => (x < 0 || x >= map.width || y < 0 || y >= map.height ? 0 : ground.data[y * map.width + x]);
  const solid = (x, y) => x < 0 || x >= map.width || [TOP, FILL].includes(tileAt(x, y));
  const standable = (x, y) => (solid(x, y) || tileAt(x, y) === ONE_WAY) && x >= 0 && x < map.width
    && !solid(x, y - 1) && tileAt(x, y - 1) !== HAZARD;
  return { map, ground, objects, tileAt, solid, standable };
}

function checkStructure(name, level, fail) {
  const { map, ground, objects, tileAt } = level;
  if (map.tilewidth !== SIZE || map.tileheight !== SIZE) fail('tiles must be 32x32');
  if (!ground || ground.type !== 'tilelayer') return fail('needs a "ground" tile layer');
  if (ground.data.length !== map.width * map.height) fail('ground data does not match the map size');
  if (!map.layers.some((layer) => layer.name === 'objects' && layer.type === 'objectgroup')) fail('needs an "objects" layer');
  const [tileset] = map.tilesets;
  if (!TILESETS.includes(tileset?.name)) fail(`unknown tileset ${tileset?.name}`);
  if (tileset?.columns !== 8 || tileset?.tilecount !== 8) fail('tileset must have 8 columns');
  if (ground.data.some((tile) => tile < 0 || tile > 8)) fail('tile outside the tileset');
  if (MAIN_LEVELS[name] && tileset?.name !== MAIN_LEVELS[name]) fail(`should use the ${MAIN_LEVELS[name]} tileset`);
  if (name === 'boss' && tileset?.name !== 'road') fail('should use the road tileset');

  const ids = new Set(objects.map((object) => object.id));
  if (ids.size !== objects.length) fail('object ids are not unique');
  for (const object of objects) {
    const property = object.properties?.find((p) => p.name === 'kind')?.value;
    if (object.type === 'enemy' && !ENEMY_KINDS.includes(property)) fail(`enemy with kind ${property}`);
    if (object.type === 'powerup' && !POWERUP_KINDS.includes(property)) fail(`power-up with kind ${property}`);
    const footed = ['enemy', 'checkpoint', 'boss'].includes(object.type) || ['spawn', 'goal'].includes(object.name);
    if (footed && !(object.name === 'goal' && name === 'boss')) {
      const [x, y] = [Math.floor(object.x / SIZE), object.y / SIZE];
      if (!Number.isInteger(y) || ![TOP, FILL, ONE_WAY].includes(tileAt(x, y))) {
        fail(`${object.name || object.type} at column ${x} is not standing on a tile`);
      }
    }
  }
  for (const objectName of ['spawn', 'goal']) {
    if (objects.filter((object) => object.name === objectName).length !== 1) fail(`needs exactly one ${objectName}`);
  }
  if (name === 'boss' && objects.filter((object) => object.type === 'boss').length !== 1) fail('needs a boss object');
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
  const spare = objects.some((object) => object.type === 'powerup'
    && object.properties?.find((p) => p.name === 'kind')?.value === 'egg-throw');
  if (!spare) fail('boss arena needs a spare egg-throw power-up');
}

function checkMainLevel(level, fail, notes) {
  const count = (type) => level.objects.filter((object) => object.type === type).length;
  const checkpoints = count('checkpoint');
  if (checkpoints < 2 || checkpoints > 3) fail(`has ${checkpoints} checkpoints, wants 2-3`);
  if (count('golden-egg') !== 3) fail(`has ${count('golden-egg')} golden eggs, wants 3`);
  if (count('corn') < MIN_CORN) fail(`has ${count('corn')} corn, wants at least ${MIN_CORN} so a heart can be earned`);
  notes.push(`${count('corn')} corn, ${checkpoints} checkpoints, ${count('enemy')} enemies, ${count('powerup')} power-ups`);
}

function checkChases(level, fail, notes) {
  const { objects, map, solid } = level;
  const starts = objects.filter((object) => object.type === 'chase-start').sort((a, b) => a.x - b.x);
  const ends = objects.filter((object) => object.type === 'chase-end').sort((a, b) => a.x - b.x);
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
    notes.push(`chase of ${to - from} tiles from column ${from}`);
  });
}

// Follows one jump or fall until it lands. Returns the tile it lands on, or null.
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
  while (feet < map.height * SIZE + SIZE) {
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
        if (landing !== undefined) return standable(landing, landingRow) ? [landing, landingRow] : null;
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
    if (!level.standable(behind, row)) return false;
  }
  return true;
}

// Every place reachable in one move from a tile.
function moves(level, x, row, limits, allowRunUp, touched) {
  const { standable, solid } = level;
  const found = [];
  const add = (landing, move) => { if (landing && key(...landing) !== key(x, row)) found.push({ to: landing, ...move }); };
  for (const direction of [-1, 1]) {
    if (standable(x + direction, row)) {
      add([x + direction, row], { walk: true });
      touched?.add(key(x + direction, row - 1));
    } else if (!solid(x + direction, row - 1)) {
      // Walking off a ledge.
      const edge = (x + (direction + 1) / 2) * SIZE + direction * (BODY_WIDTH / 2 + 1);
      for (const speed of [0, 70, 140, 190]) {
        add(flight(level, edge, row, 0, direction * speed, touched), { fall: true, direction, speed });
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
          const gap = Math.abs(landing[0] - x) - 1;
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
      if (landing && Math.abs(landing[0] - x) - 1 === RUN_UP.gap) {
        add(landing, { rise: REQUIRED.rise, direction, speed: RUN_UP.speed, offset, runUp: true });
      }
    }
  }
  return found;
}

function explore(level, start, limits, allowRunUp, touched) {
  const parents = new Map([[key(...start), null]]);
  const edges = new Map();
  const queue = [start];
  while (queue.length) {
    const [x, row] = queue.shift();
    const from = key(x, row);
    const nextMoves = moves(level, x, row, limits, allowRunUp, touched);
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

// The route with the fewest run-up gaps, then the least jumping.
function cheapestRoute(edges, start, target) {
  const moveCost = (move) => (move.runUp ? 10000 : move.walk ? 1 : 8);
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

function checkPath(name, level, fail, notes) {
  const { map, objects } = level;
  const objectTile = (object) => [Math.floor(object.x / SIZE), Math.ceil(object.y / SIZE)];
  const spawn = objects.find((object) => object.name === 'spawn');
  const goal = objects.find((object) => object.name === 'goal');
  const start = objectTile(spawn);
  if (!level.standable(...start)) return fail('cannot stand at the spawn');
  const target = key(...objectTile(goal));

  const found = explore(level, start, REQUIRED, name !== 'boss');
  const touched = new Set();
  const full = explore(level, start, FULL, true, touched);

  if (name === 'boss') {
    if (full.parents.has(target)) fail('the goal must stay out of reach');
    const bossTile = objectTile(objects.find((object) => object.type === 'boss'));
    if (!full.parents.has(key(...bossTile))) fail('cannot reach the boss');
  } else if (!found.parents.has(target)) {
    const furthest = Math.max(...[...found.parents.keys()].map((tile) => parseKey(tile)[0]));
    fail(`no route from spawn to goal within the jump limits, stuck at column ${furthest}`);
  } else {
    const route = cheapestRoute(found.edges, key(...start), target);
    if (wantRoutes) routes[name] = route;
    const runUps = route.filter((step) => step.runUp);
    notes.push(`route of ${route.length} moves, ${route.filter((step) => step.rise).length} jumps, ${runUps.length} run-up gaps`);
    for (const step of runUps) {
      if (step.from[0] < map.width * LATE_FROM) fail(`run-up gap at column ${step.from[0]} is not late in the level`);
    }

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
    if (['golden-egg', 'checkpoint', 'powerup', 'enemy'].includes(object.type) && !touchedOrStood(object)) {
      fail(`${object.type} at column ${Math.floor(object.x / SIZE)}, row ${object.y / SIZE} is out of reach`);
    }
  }
  const missedCorn = objects.filter((object) => object.type === 'corn' && !touchedOrStood(object));
  if (missedCorn.length) notes.push(`${missedCorn.length} corn only reachable with a power-up`);
  return found;
}

const levelNames = JSON.parse(readFileSync('src/levels.ts', 'utf8').match(/LEVELS = (\[.*\])/)[1].replaceAll("'", '"'));
let failures = 0;

for (const name of levelNames) {
  const fail = (message) => { failures += 1; console.log(`  FAIL ${message}`); };
  console.log(name);
  const notes = [];
  try {
    const level = loadMap(name);
    checkStructure(name, level, fail);
    if (MAIN_LEVELS[name]) checkMainLevel(level, fail, notes);
    checkChases(level, fail, notes);
    if (name === 'boss') checkBossArena(level, fail);
    checkPath(name, level, fail, notes);
  } catch (error) {
    fail(error.message);
  }
  for (const note of notes) console.log(`  ${note}`);
}
if (wantRoutes) writeFileSync(process.argv[process.argv.indexOf('--route') + 1], JSON.stringify(routes));
console.log(failures ? `${failures} problems found` : 'All levels look good');
process.exit(failures ? 1 : 0);
