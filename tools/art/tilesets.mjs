// The three 8-tile tilesets. Order is fixed: top, fill, one-way, hazard, then four decorations.
// Top, fill and one-way tiles repeat seamlessly side by side.
import { Canvas, PALETTE, hstrip, seededRandom } from './lib.mjs';

const SIZE = 32;

function tile() {
  return new Canvas(SIZE, SIZE);
}

function decoration(grid, x = 0, y = 0) {
  return tile().stamp(grid, x, y).outline();
}

// Spikes rising from the floor of the tile. Their shape is shared, their base changes.
function spikes({ light, mid, dark, base, baseDark }) {
  const frame = tile();
  for (const left of [1, 11, 21]) {
    for (let row = 0; row < 18; row++) {
      const half = Math.floor((row + 1) / 4) + 1;
      const y = 10 + row;
      frame.rect(left + 5 - half, y, half, 1, light);
      frame.rect(left + 5, y, half, 1, mid);
      frame.set(left + 5 + half - 1, y, dark);
    }
  }
  frame.outline();
  frame.rect(0, 27, SIZE, 3, base);
  frame.rect(0, 30, SIZE, 2, baseDark);
  return frame;
}

// ------------------------------------------------------------- slaughterhouse
function slaughterFill() {
  const frame = new Canvas(SIZE, SIZE, 0x3f6f73);
  for (let y = 0; y < SIZE; y += 16) {
    for (let x = 0; x < SIZE; x += 16) {
      frame.rect(x + 1, y + 1, 15, 15, (x + y) % 32 ? 0x5f9a9a : 0x6dabaa);
      frame.rect(x + 1, y + 1, 15, 1, 0x93cfca);
      frame.rect(x + 1, y + 1, 1, 15, 0x93cfca);
      frame.rect(x + 2, y + 15, 14, 1, 0x4d8285);
    }
  }
  return frame;
}

function slaughterTop() {
  const frame = slaughterFill();
  frame.rect(0, 0, SIZE, 8, 0xc4ccd8);
  frame.rect(0, 0, SIZE, 2, 0xeef2f8);
  frame.rect(0, 7, SIZE, 1, 0x5a6175);
  frame.rect(0, 8, SIZE, 2, 0x2f5459);
  for (const x of [5, 21]) {
    frame.rect(x, 3, 2, 2, 0x8b93a5);
    frame.set(x, 3, 0xffffff);
  }
  return frame;
}

function slaughterPlatform() {
  const frame = tile();
  const { M, A, a, Y, D } = PALETTE;
  frame.rect(0, 0, SIZE, 4, M);
  frame.rect(0, 0, SIZE, 1, 0xffffff);
  frame.rect(0, 4, SIZE, 1, a);
  for (let x = 0; x < SIZE; x += 8) frame.rect(x, 1, 4, 3, x % 16 ? Y : D);
  // Truss below the walkway.
  frame.rect(0, 10, SIZE, 2, A);
  frame.rect(0, 12, SIZE, 1, a);
  for (let i = 0; i < 6; i++) {
    frame.rect(i * 2 + 2, 4 + i, 2, 1, A);
    frame.rect(28 - i * 2, 4 + i, 2, 1, A);
  }
  frame.rect(15, 4, 2, 7, a);
  return frame;
}

const HOOK = [
  '...............AA...............',
  '...............aA...............',
  '...............AA...............',
  '...............Aa...............',
  '...............AA...............',
  '...............aA...............',
  '...............AA...............',
  '...............Aa...............',
  '...............AA...............',
  '..............MMMM..............',
  '..............MaaM..............',
  '...............MM...............',
  '...............MM...............',
  '...............MM...............',
  '...............MM...............',
  '...............MM...............',
  '...............MMA..............',
  '...............MMMA.............',
  '...........M.....MMA............',
  '..........MMA.....MMA...........',
  '..........MMA.....MMA...........',
  '..........MMA.....MMA...........',
  '...........MMA...MMA............',
  '............MMMMMMA.............',
  '..............MMA...............',
];

const VENT = [
  '...aaaaaaaaaaaaaaaaaaaaaaaaaa...',
  '..aMMMMMMMMMMMMMMMMMMMMMMMMMMa..',
  '..aMaMMMMMMMMMMMMMMMMMMMMMMaMa..',
  '..aMMMMMMMMMMMMMMMMMMMMMMMMMMa..',
  '..aMMDDDDDDDDDDDDDDDDDDDDDDMMa..',
  '..aMMAAAAAAAAAAAAAAAAAAAAAAMMa..',
  '..aMMDDDDDDDDDDDDDDDDDDDDDDMMa..',
  '..aMMAAAAAAAAAAAAAAAAAAAAAAMMa..',
  '..aMMDDDDDDDDDDDDDDDDDDDDDDMMa..',
  '..aMMAAAAAAAAAAAAAAAAAAAAAAMMa..',
  '..aMMDDDDDDDDDDDDDDDDDDDDDDMMa..',
  '..aMMAAAAAAAAAAAAAAAAAAAAAAMMa..',
  '..aMMDDDDDDDDDDDDDDDDDDDDDDMMa..',
  '..aMMMMMMMMMMMMMMMMMMMMMMMMMMa..',
  '..aMaMMMMMMMMMMMMMMMMMMMMMMaMa..',
  '..aMMMMMMMMMMMMMMMMMMMMMMMMMMa..',
  '...aaaaaaaaaaaaaaaaaaaaaaaaaa...',
];

const CRATE = [
  '.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.',
  '.TNNNNNNNNNNNNNNNNNNNNNNNNNNNNT.',
  '.TNTtttttttttttttttttttttttttNT.',
  '.TNtTttttttttttttttttttttttTtNT.',
  '.TNttTttttttttttttttttttttTttNT.',
  '.TNtttTttttttttttttttttttTtttNT.',
  '.TNttttTttttttttttttttttTttttNT.',
  '.TNtttttTttttttttttttttTtttttNT.',
  '.TNttttttTttttttttttttTttttttNT.',
  '.TNtttttttTttttttttttTtttttttNT.',
  '.TNttttttttTtttttttttTttttttNNT.',
  '.TNtttttttttTtttttttTtttttttNNT.',
  '.TNttttttttttTtttttTttttttttNNT.',
  '.TNtttttttttttTtttTtttttttttNNT.',
  '.TNttttttttttttTtTttttttttttNNT.',
  '.TNtttttttttttttTtttttttttttNNT.',
  '.TNttttttttttttTtTttttttttttNNT.',
  '.TNtttttttttttTtttTtttttttttNNT.',
  '.TNttttttttttTtttttTttttttttNNT.',
  '.TNtttttttttTtttttttTtttttttNNT.',
  '.TNttttttttTtttttttttTttttttNNT.',
  '.TNtttttttTttttttttttTtttttttNT.',
  '.TNttttttTttttttttttttTttttttNT.',
  '.TNtttttTttttttttttttttTtttttNT.',
  '.TNttttTttttttttttttttttTttttNT.',
  '.TNtttTttttttttttttttttttTtttNT.',
  '.TNNNNNNNNNNNNNNNNNNNNNNNNNNNNT.',
  '.TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.',
];

const MOP_BUCKET = [
  '.....................NN.........',
  '.....................NN.........',
  '....................NN..........',
  '....................NN..........',
  '...................NN...........',
  '...................NN...........',
  '..................NN............',
  '..................NN............',
  '.................NN.............',
  '................NN..............',
  '............SSS.NN..............',
  '..........SSs...NSSS............',
  '.........S.......MMMS...........',
  '........U...wwWWWWWWw..U........',
  '.......UUUUUUUUUUUUUUUUuu.......',
  '.......UCUUUUUUUUUUUUUUuu.......',
  '.......UCUUUUUUUUUUUUUUuu.......',
  '.......UCUUUUUUUUUUUUUUuu.......',
  '........UCUUUUUUUUUUUUuu........',
  '........UCUUUUUUUUUUUUuu........',
  '........UUUUUUUUUUUUUUuu........',
  '.........UUUUUUUUUUUUuu.........',
  '.........uuuuuuuuuuuuuu.........',
];

export const slaughterhouse = hstrip([
  slaughterTop(),
  slaughterFill(),
  slaughterPlatform(),
  spikes({ light: 0xffffff, mid: 0xd7deea, dark: 0x8b93a5, base: 0xffd83d, baseDark: 0x3d3a4a }),
  decoration(HOOK),
  decoration(VENT, 0, 8),
  decoration(CRATE, 0, 3),
  decoration(MOP_BUCKET, 0, 8),
]);

// ------------------------------------------------------------------------ farm
const EARTH = 0x9a6438;

function speckle(frame, seed, colors, count, top = 2) {
  const random = seededRandom(seed);
  for (let i = 0; i < count; i++) {
    const x = 2 + Math.floor(random() * 26);
    const y = top + Math.floor(random() * (28 - top));
    const color = colors[Math.floor(random() * colors.length)];
    frame.rect(x, y, 2 + Math.floor(random() * 2), 2, color);
    frame.set(x, y + 1, color);
  }
  return frame;
}

function farmFill() {
  return speckle(new Canvas(SIZE, SIZE, EARTH), 11, [0x87542e, 0xae7746, 0x7a4a2a, 0xb98552], 16);
}

function farmTop() {
  const frame = speckle(new Canvas(SIZE, SIZE, EARTH), 12, [0x87542e, 0xae7746, 0xb98552], 9, 14);
  // The grass lip uses a pattern that wraps at 32 pixels.
  const lip = [9, 10, 9, 8, 9, 11, 12, 11, 9, 8, 8, 9, 10, 12, 13, 12, 10, 9, 8, 9, 11, 12, 10, 9, 8, 8, 10, 12, 13, 11, 10, 9];
  for (let x = 0; x < SIZE; x++) {
    frame.rect(x, 0, 1, lip[x], 0x62c24f);
    frame.rect(x, lip[x], 1, 2, 0x3a8c48);
    frame.rect(x, lip[x] + 2, 1, 1, 0x6b4426);
    frame.rect(x, 0, 1, 2, 0xa6e05a);
  }
  for (const x of [4, 12, 22, 28]) frame.rect(x, 2, 2, 1, 0xa6e05a);
  for (const x of [8, 17, 25]) frame.rect(x, 5, 2, 1, 0x4caa44);
  return frame;
}

function farmPlatform() {
  const frame = tile();
  const { T, t, N, n, Y } = PALETTE;
  frame.rect(0, 0, SIZE, 7, T);
  frame.rect(0, 0, SIZE, 1, 0xe2b57c);
  frame.rect(0, 7, SIZE, 2, N);
  frame.rect(0, 9, SIZE, 1, n);
  for (const [x, y, width] of [[2, 3, 7], [18, 2, 9], [11, 5, 6], [27, 5, 4]]) frame.rect(x, y, width, 1, t);
  frame.rect(15, 0, 1, 7, N);
  frame.rect(5, 2, 1, 1, n);
  frame.rect(26, 3, 1, 1, n);
  // Rope lashing.
  frame.rect(8, 0, 3, 10, Y);
  frame.rect(8, 2, 3, 1, 0xe0a52a);
  frame.rect(8, 5, 3, 1, 0xe0a52a);
  frame.rect(8, 8, 3, 1, 0xe0a52a);
  return frame;
}

function bramble() {
  const frame = tile();
  const { V, v, G, g, W } = PALETTE;
  const blob = (cx, cy, r, color) => {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) frame.set(cx + x, cy + y, color);
    }
  };
  blob(8, 23, 7, g);
  blob(23, 23, 7, g);
  blob(16, 20, 9, 0x2f7a42);
  blob(13, 18, 4, G);
  blob(22, 22, 3, G);
  blob(7, 24, 3, G);
  frame.rect(0, 28, SIZE, 4, g);
  // Thorns, each a pale point so the danger reads at a glance.
  const thorns = [[16, 6, 0], [6, 11, -1], [26, 11, 1], [11, 8, -1], [21, 8, 1], [1, 17, -1], [30, 17, 1]];
  for (const [x, y, lean] of thorns) {
    for (let row = 0; row < 8; row++) {
      const px = x - lean * Math.floor(row / 2);
      frame.rect(px - Math.floor(row / 3), y + row, 1 + Math.floor(row / 3) * 2, 1, row < 3 ? W : V);
      if (row >= 3) frame.set(px + Math.floor(row / 3), y + row, v);
    }
  }
  return frame.outline();
}

const FENCE = [
  '.....T.................T........',
  '....TTt...............TTt.......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'ttttttttttttttttttttttttttttttt.',
  'ttttttttttttttttttttttttttttttt.',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'ttttttttttttttttttttttttttttttt.',
  'ttttttttttttttttttttttttttttttt.',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
  '...TTTtt.............TTTtt......',
];

function hayBale() {
  const frame = tile();
  const { Y, y, Q, N } = PALETTE;
  frame.rect(1, 6, 30, 25, Y);
  frame.rect(1, 6, 30, 2, Q);
  frame.rect(1, 28, 30, 3, y);
  const random = seededRandom(21);
  for (let i = 0; i < 40; i++) {
    const px = 2 + Math.floor(random() * 27);
    const py = 8 + Math.floor(random() * 20);
    frame.rect(px, py, 2 + Math.floor(random() * 3), 1, random() > 0.5 ? y : Q);
  }
  frame.rect(8, 6, 2, 25, N);
  frame.rect(22, 6, 2, 25, N);
  return frame.outline();
}

const SUNFLOWER = [
  '...........Y..Y..Y..............',
  '.........Y.YY.YY.YY.Y...........',
  '.........YYYYYYYYYYYY...........',
  '.......YYYYYnnnnnnYYYYY.........',
  '.......YYYnnNnNnNnnnYYY.........',
  '......YYYnnNnNnNnNnnnYYY........',
  '.......YYnNnNnNnNnNnnYY.........',
  '......YYYnnNnNnNnNnNnYYY........',
  '.......YYnNnNnNnNnNnnYY.........',
  '......YYYnnNnNnNnNnnnYYY........',
  '.......YYYnnNnNnNnnnYYY.........',
  '.......YYYYYnnnnnnYYYYY.........',
  '.........YYYYYYYYYYYY...........',
  '.........Y.YY.GG.YY.Y...........',
  '...........Y..GG.Y..............',
  '..............GG................',
  '..............GG.LLLL...........',
  '..............GGLLLLLL..........',
  '.....gggg.....GGLLLLL...........',
  '....gGGGGG....GGGLL.............',
  '.....gGGGGG...GG................',
  '.......gGGGGG.GG................',
  '..............GG................',
  '..............GG................',
  '..............GG................',
  '..............Gg................',
];

const PUMPKIN = [
  '...............gGG..............',
  '..............gGGG..............',
  '..............GGg...............',
  '.........XXXXXGGXXXXXX..........',
  '......XXXOOXXXXXXOOOXXXX........',
  '.....XXOOOXXOOOOXXOOOOXXX.......',
  '....XXOOOXXOOOOOOXXOOOOXXX......',
  '...XXOOOOXXOOOOOOXXOOOOOXXx.....',
  '...XOOOOXXOOOOOOOOXXOOOOOXx.....',
  '...XOOOOXXOOOOOOOOXXOOOOOXx.....',
  '...XOOOOXXOOOOOOOOXXOOOOOXx.....',
  '...XOOOOXXOOOOOOOOXXOOOOOXx.....',
  '...XXOOOXXOOOOOOOOXXOOOOXXx.....',
  '....XXOOOXXOOOOOOXXOOOOXXx......',
  '.....XXXOOXXOOOOXXOOOXXxx.......',
  '.......xXXXXXXXXXXXXXxx.........',
  '.........xxxxxxxxxxxx...........',
];

export const farm = hstrip([
  farmTop(),
  farmFill(),
  farmPlatform(),
  bramble(),
  decoration(FENCE, 0, 10),
  hayBale(),
  decoration(SUNFLOWER, 1, 5),
  decoration(PUMPKIN, 2, 14),
]);

// ------------------------------------------------------------------------ road
function roadFill() {
  // Roadbed stone: staggered blocks that wrap in both directions.
  const frame = new Canvas(SIZE, SIZE, 0x5b5664);
  const block = (x, y, width, color) => {
    for (let px = x; px < x + width; px++) {
      for (let py = y; py < y + 15; py++) frame.set((px + SIZE) % SIZE, py, color);
    }
    for (let px = x; px < x + width; px++) frame.set((px + SIZE) % SIZE, y, 0x9d97a6);
  };
  block(1, 1, 15, 0x7c7686);
  block(17, 1, 15, 0x857f8f);
  block(-7, 17, 15, 0x847e8e);
  block(9, 17, 15, 0x77717f);
  return frame;
}

function roadTop() {
  const frame = roadFill();
  const { Y } = PALETTE;
  frame.rect(0, 0, SIZE, 13, 0x4a4757);
  frame.rect(0, 0, SIZE, 1, 0x7f7c8c);
  frame.rect(0, 1, SIZE, 1, 0x605d6e);
  frame.rect(2, 5, 16, 3, Y);
  frame.rect(2, 7, 16, 1, 0xe0a52a);
  for (const [x, y] of [[23, 3], [6, 10], [27, 9], [20, 11], [13, 3]]) frame.set(x, y, 0x605d6e);
  frame.rect(0, 13, SIZE, 2, 0x3a3745);
  return frame;
}

function roadPlatform() {
  const frame = tile();
  const { R, r } = PALETTE;
  frame.rect(0, 0, SIZE, 3, 0xf0615a);
  frame.rect(0, 0, SIZE, 1, 0xff9a90);
  frame.rect(0, 3, SIZE, 1, r);
  frame.rect(0, 9, SIZE, 3, R);
  frame.rect(0, 12, SIZE, 1, r);
  for (let i = 0; i < 16; i += 8) {
    for (let row = 0; row < 5; row++) {
      frame.rect(i * 2 + row * 2 + 1, 4 + row, 3, 1, R);
      frame.rect(i * 2 + 13 - row * 2, 4 + row, 3, 1, R);
    }
  }
  for (const x of [3, 19]) {
    frame.rect(x, 1, 2, 1, 0xa82a3a);
    frame.rect(x, 10, 2, 1, 0xa82a3a);
  }
  return frame;
}

const GUARDRAIL = [
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'MMMMMMaMMMMMMMMMMMMMMMMMMaMMMMMM',
  'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
  '.....aAAAa...............aAAAa..',
];

const CONE = [
  '...............RR...............',
  '..............RRRR..............',
  '..............RRRr..............',
  '.............RRRRrr.............',
  '.............WWWWWw.............',
  '............WWWWWWww............',
  '............RRRRRRrr............',
  '...........RRRRRRRRrr...........',
  '...........RRRRRRRRrr...........',
  '..........WWWWWWWWWWww..........',
  '..........WWWWWWWWWWww..........',
  '.........RRRRRRRRRRRRrr.........',
  '.........RRRRRRRRRRRRrr.........',
  '......RRRRRRRRRRRRRRRRRRrr......',
  '.....rrrrrrrrrrrrrrrrrrrrrr.....',
];

// A yellow chicken-crossing sign.
const SIGN = [
  '...............KK...............',
  '..............KYYK..............',
  '.............KYYYYK.............',
  '............KYYYYYYK............',
  '...........KYYYYYYYYK...........',
  '..........KYYYYRRYYYYK..........',
  '.........KYYYYKKKKYYYYK.........',
  '........KYYYYYKKWKKOYYYK........',
  '.......KYYYYYYKKKKYYYYYYK.......',
  '......KYYKYYYYKKKYYYYYYYYK......',
  '.....KYYYKKYYKKKKKYYYYYYYYK.....',
  '.....KYYYYKKKKKKKKYYYYYYYYK.....',
  '......KYYYYKKKKKKYYYYYYYYK......',
  '.......KYYYYYKYKYYYYYYYYK.......',
  '........KYYYYKYKYYYYYYYK........',
  '.........KYYKKYKKYYYYYK.........',
  '..........KYYYYYYYYYYK..........',
  '...........KYYYYYYYYK...........',
  '............KYYYYYYK............',
  '.............KYYYYK.............',
  '..............KYYK..............',
  '...............AA...............',
  '...............AA...............',
  '...............AA...............',
  '...............AA...............',
  '...............aa...............',
  '...............aa...............',
  '...............aa...............',
];

function roadBush() {
  const frame = tile();
  const { G, g, L } = PALETTE;
  const blob = (cx, cy, r, color) => {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) frame.set(cx + x, cy + y, color);
    }
  };
  blob(9, 22, 7, g);
  blob(23, 23, 6, g);
  blob(16, 17, 8, g);
  blob(8, 21, 5, G);
  blob(22, 22, 4, G);
  blob(15, 16, 6, G);
  blob(13, 14, 2, L);
  blob(6, 19, 1, L);
  blob(21, 20, 1, L);
  frame.rect(1, 29, 30, 3, g);
  return frame.outline();
}

export const road = hstrip([
  roadTop(),
  roadFill(),
  roadPlatform(),
  spikes({ light: 0xffffff, mid: 0xb8c0d0, dark: 0x5a6175, base: 0xe8433f, baseDark: 0x2a2035 }),
  decoration(GUARDRAIL, 0, 17),
  decoration(CONE, 0, 16),
  decoration(SIGN, 0, 3),
  roadBush(),
]);

// ===================================================== Update 1: World 2, the city

// Sets a pixel with horizontal wrap-around, so shapes crossing the edge repeat seamlessly.
function wrapSet(frame, x, y, color) {
  frame.set(((x % SIZE) + SIZE) % SIZE, y, color);
}

function wrapEllipse(frame, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) wrapSet(frame, x, y, color);
    }
  }
}

// ---------------------------------------------------------------------- market
const COBBLES = [
  [4, 4, 0xcdbba4], [13, 4, 0xbfae98], [22, 4, 0xd6c6b0], [30, 4, 0xc4b39c],
  [0, 12, 0xc6b49d], [8, 12, 0xd2c1aa], [17, 12, 0xbcab95], [25, 12, 0xcfbea7],
  [4, 20, 0xc2b19a], [12, 20, 0xd3c3ad], [21, 20, 0xc7b69f], [29, 20, 0xbdac96],
  [0, 28, 0xcfbea8], [8, 28, 0xc0af99], [16, 28, 0xd5c5af], [25, 28, 0xc6b59e],
];

function marketFill() {
  const frame = new Canvas(SIZE, SIZE, 0x8a7a70);
  for (const [cx, cy, color] of COBBLES) {
    wrapEllipse(frame, cx + 0.5, cy + 0.5, 3.6, 3, 0x9c8b7e);
    wrapEllipse(frame, cx, cy, 3.4, 2.9, color);
    wrapSet(frame, cx - 2, cy - 2, 0xeee2d0);
    wrapSet(frame, cx - 1, cy - 2, 0xeee2d0);
  }
  return frame;
}

function marketTop() {
  const frame = marketFill();
  frame.rect(0, 0, SIZE, 9, 0xe3d6c2);
  frame.rect(0, 0, SIZE, 2, 0xf6eee0);
  frame.rect(0, 7, SIZE, 2, 0xc2b29c);
  frame.rect(0, 9, SIZE, 2, 0x6e5f58);
  for (const x of [0, 16]) frame.rect(x, 2, 1, 7, 0xc2b29c);
  for (const [x, y] of [[6, 4], [23, 5], [11, 6]]) frame.rect(x, y, 2, 1, 0xd2c4ae);
  return frame;
}

// A market counter: a plank with a green-and-white tablecloth hanging off it.
function marketPlatform() {
  const frame = tile();
  const { T, t, N, n, G, g, W } = PALETTE;
  frame.rect(0, 0, SIZE, 5, T);
  frame.rect(0, 0, SIZE, 1, 0xe2b57c);
  frame.rect(0, 4, SIZE, 1, t);
  frame.rect(0, 5, SIZE, 1, n);
  for (const [x, w] of [[3, 6], [19, 8]]) frame.rect(x, 2, w, 1, t);
  frame.rect(15, 0, 1, 5, N);
  for (let x = 0; x < SIZE; x++) {
    const check = Math.floor(x / 4) % 2 === 0;
    frame.rect(x, 6, 1, 3, check ? G : W);
    frame.rect(x, 9, 1, 2, check ? W : G);
    const scallop = Math.round(Math.sin(((x % 8) / 8) * Math.PI) * 2);
    frame.rect(x, 11, 1, scallop, g);
  }
  return frame;
}

function appleCrate() {
  const frame = tile();
  const { T, t, N, R, r, P, G, n } = PALETTE;
  const apples = [[7, 14], [13, 13], [19, 14], [25, 14], [10, 10], [16, 9], [22, 10]];
  for (const [x, y] of apples) {
    frame.ellipse(x, y, 3.2, 3, r);
    frame.ellipse(x - 0.4, y - 0.4, 2.7, 2.6, R);
    frame.set(x - 1, y - 1, P);
    frame.set(x, y - 3, n);
    frame.set(x + 1, y - 4, G);
  }
  frame.rect(2, 16, 28, 16, T);
  for (const y of [21, 26]) frame.rect(2, y, 28, 1, t);
  frame.rect(2, 16, 28, 2, N);
  frame.rect(2, 16, 3, 16, N).rect(27, 16, 3, 16, N);
  frame.rect(9, 22, 14, 4, 0xf3e9dc);
  frame.rect(10, 23, 12, 2, R);
  return frame.outline();
}

function flowerBucket() {
  const frame = tile();
  const { M, A, a, G, g, R, Y, V, P, W } = PALETTE;
  for (const [x, top, color] of [[9, 4, R], [14, 2, Y], [19, 5, V], [23, 3, P], [12, 7, W], [17, 6, R]]) {
    frame.rect(x, top + 3, 1, 14 - top, g);
    frame.ellipse(x, top + 1.5, 2.2, 2.2, color);
    frame.set(x, top + 1, Y);
  }
  frame.rect(7, 12, 3, 2, G).rect(21, 13, 3, 2, G);
  for (let row = 0; row < 14; row++) {
    const inset = Math.floor(row / 5);
    frame.rect(7 + inset, 17 + row, 18 - inset * 2, 1, row < 2 ? M : A);
    frame.rect(7 + inset, 17 + row, 2, 1, M);
    frame.rect(23 - inset, 17 + row, 2, 1, a);
  }
  frame.rect(7, 20, 18, 1, a);
  return frame.outline();
}

function potatoSack() {
  const frame = tile();
  const { T, t, N, n, Y } = PALETTE;
  frame.ellipse(15.5, 22, 11, 9, 0xc9a874);
  frame.ellipse(14, 20, 8, 6, 0xd8ba88);
  frame.rect(8, 9, 16, 6, 0xc9a874);
  frame.rect(9, 12, 14, 2, n);
  for (const [x, y] of [[10, 7], [15, 6], [20, 7]]) {
    frame.ellipse(x, y, 3, 2.4, N);
    frame.set(x - 1, y - 1, T);
  }
  frame.rect(4, 30, 24, 2, 0xb08f5c);
  for (const [x, y] of [[10, 22], [19, 25], [15, 18]]) frame.rect(x, y, 3, 1, 0xb08f5c);
  frame.rect(12, 21, 8, 5, Y);
  frame.rect(13, 22, 6, 3, t);
  return frame.outline();
}

function cheeseStack() {
  const frame = tile();
  const { Y, y, z, Q, R } = PALETTE;
  for (const [cy, rx] of [[26, 13], [18, 11], [11, 9]]) {
    frame.ellipse(15.5, cy + 2, rx, 3, z);
    frame.rect(Math.round(15.5 - rx), cy - 2, Math.round(rx * 2) + 1, 4, Y);
    frame.ellipse(15.5, cy - 2, rx, 3, Q);
    frame.rect(Math.round(15.5 - rx), cy + 1, Math.round(rx * 2) + 1, 1, y);
  }
  // Cheese holes on the sides of the wheels, and a red wax seal.
  for (const [x, yy] of [[10, 11], [19, 12], [8, 19], [15, 20], [22, 19], [6, 27], [13, 28], [20, 27], [25, 26]]) {
    frame.rect(x, yy, 2, 2, y);
    frame.set(x, yy, z);
  }
  frame.rect(17, 26, 3, 2, R);
  return frame.outline();
}

export const market = hstrip([
  marketTop(),
  marketFill(),
  marketPlatform(),
  spikes({ light: 0xffffff, mid: 0xd7deea, dark: 0x8b93a5, base: 0xc08a52, baseDark: 0x5f3a24 }),
  appleCrate(),
  flowerBucket(),
  potatoSack(),
  cheeseStack(),
]);

// -------------------------------------------------------------------- rooftops
const MORTAR = 0xd9b9a2;

function brickFill() {
  const frame = new Canvas(SIZE, SIZE, MORTAR);
  const shades = [0xb8604a, 0xc06a50, 0xa95843, 0xbd6449];
  let i = 0;
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 ? 8 : 0;
    for (let x = offset; x < SIZE + offset; x += 16) {
      const color = shades[i++ % shades.length];
      for (let px = 1; px < 16; px++) {
        for (let py = 1; py < 8; py++) wrapSet(frame, x + px, row * 8 + py, color);
        wrapSet(frame, x + px, row * 8 + 1, 0xd98468);
        wrapSet(frame, x + px, row * 8 + 7, 0x9a4c3a);
      }
    }
  }
  return frame;
}

// Rows of rounded terracotta roof tiles, overlapping like scales.
function roofTop() {
  const frame = brickFill();
  for (let row = 0; row < 2; row++) {
    for (let x = 0; x < SIZE; x++) {
      const local = (x + row * 4) % 8;
      const curve = Math.round(Math.sin((local / 8) * Math.PI) * 3);
      const top = row * 6;
      frame.rect(x, top, 1, 6 + curve, local < 2 ? 0xc85f3c : 0xe07a4e);
      frame.set(x, top + 5 + curve, 0x8f3f2a);
      if (local === 3 || local === 4) frame.set(x, top + 1, 0xf6a77a);
    }
  }
  frame.rect(0, 0, SIZE, 1, 0xf6a77a);
  frame.rect(0, 15, SIZE, 1, 0x6e3424);
  return frame;
}

// A scaffold board on a steel tube.
function rooftopPlatform() {
  const frame = tile();
  const { T, t, N, A, a, M, Y } = PALETTE;
  frame.rect(0, 0, SIZE, 5, T);
  frame.rect(0, 0, SIZE, 1, 0xe2b57c);
  frame.rect(0, 5, SIZE, 1, N);
  for (const [x, w] of [[2, 9], [17, 7], [27, 4]]) frame.rect(x, 2, w, 1, t);
  frame.rect(0, 8, SIZE, 3, A);
  frame.rect(0, 8, SIZE, 1, M);
  frame.rect(0, 10, SIZE, 1, a);
  for (const x of [6, 22]) {
    frame.rect(x, 5, 4, 7, a);
    frame.rect(x + 1, 6, 2, 1, Y);
  }
  return frame;
}

function chimney() {
  const frame = tile();
  const { W } = PALETTE;
  const pots = [[10, 0xd9734a], [20, 0xc8603c]];
  // Smoke curling up from the pots.
  for (const [x, y, r] of [[11, 3, 2], [13, 1, 1.5]]) frame.ellipse(x, y, r, r, W);
  for (const [x] of pots) {
    frame.rect(x - 2, 6, 5, 7, x === 10 ? 0xd9734a : 0xc8603c);
    frame.rect(x - 3, 6, 7, 2, 0xf09a6a);
  }
  frame.rect(4, 13, 24, 3, 0xe3d6c2);
  frame.rect(4, 13, 24, 1, 0xf6eee0);
  for (let row = 0; row < 16; row++) {
    for (let x = 6; x < 26; x++) {
      const joint = row % 4 === 3 || (x + (Math.floor(row / 4) % 2 ? 4 : 0)) % 8 === 0;
      frame.set(x, 16 + row, joint ? MORTAR : x < 9 ? 0xc87058 : x > 22 ? 0x9a4c3a : 0xb8604a);
    }
  }
  return frame.outline();
}

function tvAerial() {
  const frame = tile();
  const { A, a, M } = PALETTE;
  frame.rect(15, 6, 2, 26, A);
  frame.rect(16, 6, 1, 26, a);
  for (const [y, half] of [[7, 13], [12, 10], [17, 7]]) {
    frame.rect(16 - half, y, half * 2, 2, M);
    frame.rect(16 - half, y + 1, half * 2, 1, A);
    for (const x of [16 - half, 16 + half - 2]) frame.rect(x, y - 1, 2, 4, A);
  }
  frame.rect(12, 28, 8, 4, a);
  frame.rect(12, 28, 8, 1, M);
  return frame.outline();
}

function skylight() {
  const frame = tile();
  const { A, a, M, C, c, W } = PALETTE;
  frame.rect(3, 14, 26, 18, a);
  frame.rect(3, 14, 26, 2, M);
  frame.rect(5, 17, 22, 13, c);
  frame.rect(5, 17, 10, 6, C);
  frame.rect(17, 24, 10, 6, C);
  frame.rect(15, 17, 2, 13, A);
  frame.rect(5, 23, 22, 1, A);
  for (let i = 0; i < 4; i++) frame.set(7 + i, 21 - i, W);
  return frame.outline();
}

function geraniumPot() {
  const frame = tile();
  const { G, g, R, r, P } = PALETTE;
  for (const [x, y, rad] of [[9, 14, 4], [16, 11, 5], [23, 14, 4], [12, 17, 3], [20, 17, 3]]) frame.ellipse(x, y, rad, rad, g);
  for (const [x, y, rad] of [[9, 13, 3], [16, 10, 4], [23, 13, 3]]) frame.ellipse(x, y, rad, rad, G);
  for (const [x, y] of [[10, 8], [17, 5], [23, 9], [13, 12], [20, 12]]) {
    frame.ellipse(x, y, 2, 2, R);
    frame.set(x - 1, y - 1, P);
    frame.set(x + 1, y + 1, r);
  }
  frame.rect(6, 19, 20, 3, 0xe07a4e);
  frame.rect(6, 19, 20, 1, 0xf6a77a);
  for (let row = 0; row < 10; row++) frame.rect(8 + Math.floor(row / 4), 22 + row, 16 - Math.floor(row / 4) * 2, 1, 0xc8603c);
  return frame.outline();
}

export const rooftops = hstrip([
  roofTop(),
  brickFill(),
  rooftopPlatform(),
  spikes({ light: 0xffffff, mid: 0xc8c4d4, dark: 0x5a6175, base: 0x8b93a5, baseDark: 0x3d3a4a }),
  chimney(),
  tvAerial(),
  skylight(),
  geraniumPot(),
]);

// -------------------------------------------------------------------- harbour
function quayFill() {
  const frame = new Canvas(SIZE, SIZE, 0x56637a);
  const shades = [0x8494a8, 0x7a8a9e, 0x8c9bb0, 0x7f8fa3];
  let i = 0;
  for (let row = 0; row < 2; row++) {
    const offset = row ? 10 : 0;
    for (let x = offset; x < SIZE + offset; x += 20) {
      const width = x - offset < 20 ? 19 : 11;
      const color = shades[i++ % shades.length];
      for (let px = 1; px < Math.min(width, 20); px++) {
        for (let py = 1; py < 16; py++) wrapSet(frame, x + px, row * 16 + py, color);
        wrapSet(frame, x + px, row * 16 + 1, 0xa9b7c8);
        wrapSet(frame, x + px, row * 16 + 15, 0x66748a);
      }
    }
  }
  // A little moss where the tide reaches.
  for (const [x, y] of [[4, 30], [5, 29], [18, 14], [19, 14], [27, 30]]) frame.set(x, y, 0x6a9a5a);
  return frame;
}

function dockTop() {
  const frame = quayFill();
  const { T, t, N, n, A } = PALETTE;
  frame.rect(0, 0, SIZE, 8, T);
  frame.rect(0, 0, SIZE, 1, 0xe2b57c);
  frame.rect(0, 4, SIZE, 1, t);
  frame.rect(0, 7, SIZE, 1, t);
  for (const x of [11, 27]) frame.rect(x, 0, 1, 4, N);
  for (const x of [4, 19]) frame.rect(x, 4, 1, 4, N);
  for (const [x, y] of [[13, 2], [25, 2], [6, 5], [17, 5]]) frame.set(x, y, A);
  frame.rect(0, 8, SIZE, 3, N);
  frame.rect(0, 10, SIZE, 1, n);
  return frame;
}

// A narrow jetty walkway on a crossbeam, with a rope along it.
function harbourPlatform() {
  const frame = tile();
  const { N, n, Y, y } = PALETTE;
  const plank = 0xc9a77a;
  frame.rect(0, 0, SIZE, 5, plank);
  frame.rect(0, 0, SIZE, 1, 0xe8cfa6);
  for (const x of [0, 8, 16, 24]) frame.rect(x, 0, 1, 5, 0x9a7a52);
  frame.rect(0, 5, SIZE, 2, N);
  frame.rect(0, 7, SIZE, 1, n);
  for (let x = 0; x < SIZE; x++) {
    const sag = Math.round(Math.sin((x / SIZE) * Math.PI) * 2);
    frame.set(x, 9 + sag, x % 3 ? Y : y);
  }
  frame.rect(14, 5, 4, 8, n);
  return frame;
}

// Sea water: falling in counts as a hit. The crest repeats every 16 px.
function harbourWater() {
  const frame = tile();
  const { W, C, c, u } = PALETTE;
  for (let x = 0; x < SIZE; x++) {
    const crest = 8 + Math.round(Math.sin((x / 16) * Math.PI * 2) * 2);
    frame.rect(x, crest, 1, SIZE - crest, c);
    frame.rect(x, crest, 1, 2, C);
    frame.set(x, crest, W);
    frame.rect(x, 26, 1, 6, 0x2f86a8);
    if (x % 16 < 3) frame.set(x, crest - 1, W);
  }
  for (const [x, y, w] of [[3, 16, 6], [19, 20, 7], [10, 23, 4], [26, 14, 3]]) frame.rect(x, y, w, 1, C);
  frame.rect(0, 31, SIZE, 1, u);
  return frame;
}

function bollard() {
  const frame = tile();
  const { D, a, T, t } = PALETTE;
  frame.rect(9, 12, 14, 20, D);
  frame.rect(9, 12, 3, 20, a);
  frame.ellipse(15.5, 11, 9, 3, D);
  frame.ellipse(15.5, 10, 8, 2, a);
  frame.rect(6, 30, 20, 2, D);
  // A rope wound around it, trailing off to the left.
  for (const y of [18, 21, 24]) {
    frame.rect(8, y, 16, 2, T);
    for (let x = 8; x < 24; x += 3) frame.set(x, y + 1, t);
  }
  for (let x = 0; x < 8; x++) frame.rect(x, 25 + Math.floor(x / 3), 1, 2, T);
  return frame.outline();
}

function lifebuoy() {
  const frame = tile();
  const { R, W, N, n, s } = PALETTE;
  frame.rect(14, 2, 4, 30, N);
  frame.rect(17, 2, 1, 30, n);
  frame.rect(12, 2, 8, 2, n);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - 15.5;
      const dy = y - 15.5;
      const d = Math.hypot(dx, dy);
      if (d > 11 || d < 6) continue;
      const angle = Math.atan2(dy, dx) + Math.PI / 4;
      const quarter = Math.floor(((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2));
      frame.set(x, y, quarter % 2 ? W : R);
      if (d > 10) frame.set(x, y, quarter % 2 ? s : 0xa82a3a);
    }
  }
  return frame.outline();
}

function barrel() {
  const frame = tile();
  const { T, t, N, n, A, M } = PALETTE;
  for (let row = 0; row < 26; row++) {
    const bulge = Math.round(Math.sin((row / 25) * Math.PI) * 3);
    const left = 7 - bulge;
    const width = 18 + bulge * 2;
    frame.rect(left, 6 + row, width, 1, T);
    frame.rect(left, 6 + row, 2, 1, 0xd9a670);
    frame.rect(left + width - 3, 6 + row, 3, 1, t);
    for (const x of [13, 19]) frame.set(x, 6 + row, N);
  }
  for (const y of [9, 27]) {
    const bulge = Math.round(Math.sin(((y - 6) / 25) * Math.PI) * 3);
    frame.rect(7 - bulge, y, 18 + bulge * 2, 2, A);
    frame.rect(7 - bulge, y, 18 + bulge * 2, 1, M);
  }
  frame.ellipse(15.5, 6, 9, 2, n);
  frame.ellipse(15.5, 6, 7, 1, N);
  return frame.outline();
}

function anchor() {
  const frame = tile();
  const { A, a, M } = PALETTE;
  frame.ellipse(15.5, 5, 3.5, 3.5, A);
  frame.ellipse(15.5, 5, 1.6, 1.6, -1);
  frame.rect(14, 8, 4, 18, A);
  frame.rect(14, 8, 1, 18, M);
  frame.rect(8, 11, 16, 3, A);
  frame.rect(8, 11, 16, 1, M);
  for (let i = 0; i < 11; i++) {
    const y = 26 - Math.round(Math.sqrt(i) * 3);
    frame.rect(15 - i, y + 1, 2, 3, A);
    frame.rect(16 + i, y + 1, 2, 3, a);
  }
  for (const [x, dir] of [[4, -1], [27, 1]]) {
    for (let i = 0; i < 4; i++) frame.rect(x + dir * Math.floor(i / 2), 16 - i, 2, 1, A);
  }
  frame.rect(14, 26, 4, 3, a);
  return frame.outline();
}

export const harbour = hstrip([
  dockTop(),
  quayFill(),
  harbourPlatform(),
  harbourWater(),
  bollard(),
  lifebuoy(),
  barrel(),
  anchor(),
]);
