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
