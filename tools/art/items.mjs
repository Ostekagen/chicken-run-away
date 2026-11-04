// Pickups, level furniture and power-up badges.
import { Canvas, PALETTE } from './lib.mjs';

function sprite(width, height, grid, x = 0, y = 0) {
  return new Canvas(width, height).stamp(grid, x, y).outline();
}

export const cleaver = sprite(16, 16, [
  '..................',
  '.WMMMMMMMMA.......',
  '.WMMMMMDDMA.......',
  '.WMMMMMDDMA.......',
  '.WMMMMMMMMANNNNNn.',
  '.WMMMMMMMMAnNNNNn.',
  '.WMMMMMMMMA.......',
  '.WMMMMMMMMA.......',
  '.WAAAAAAAAA.......',
], -1, 3);

export const egg = sprite(16, 16, [
  '......WWW.......',
  '.....WWWWW......',
  '....WWWWWWw.....',
  '...WWWWWWWWw....',
  '...WWWWWWWWw....',
  '..WWWWWWWWWwS...',
  '..WWWWWWWWWws...',
  '..WWWWWWWWwws...',
  '..wWWWWWWWwss...',
  '...wWWWWwwss....',
  '....wwwwsss.....',
  '.....sssss......',
], 0, 2);

export const corn = sprite(16, 16, [
  '.........YY.....',
  '........YYYY....',
  '.......YZYZY....',
  '......YYZYZYY...',
  '......ZYZYZYZ...',
  '.....GYYZYZYg...',
  '....LGGYZYZGg...',
  '....LGGYYZGGg...',
  '.....LGGYGGg....',
  '.....LLGGGgg....',
  '......LGGgg.....',
  '.......GGg......',
  '.......gg.......',
], 0, 1);

export const goldenEgg = sprite(20, 24, [
  '................W...',
  '.......QQQQ....WWW..',
  '......QQQQQQ....W...',
  '.....QQZZZZZZ.......',
  '....QQZZZZZZZZ......',
  '....QZZZZZZZZZz.....',
  '...QQZZZZZZZZZZz....',
  '...QZZZZZZZZZZZz....',
  '..QQZZZZZZZZZZZzz...',
  '..QZZZZZZZZZZZZZz...',
  '..QZZZZZZZZZZZZZz...',
  '..ZZZZZZZZZZZZZzz...',
  '..ZZZZZZZZZZZZZzz...',
  '..ZZZZZZZZZZZZzzz...',
  '..zZZZZZZZZZZZzzz...',
  '...zZZZZZZZZZzzz....',
  '...zzZZZZZZZzzzz....',
  '....zzzzzzzzzzz.....',
  '.....zzzzzzzzz......',
  '.......zzzzz........',
], 0, 2);

const POST = Array(44).fill('NNt');
const STONE = ['...aAAAAAa....', '..AAAAAAAAAa..', '.AAAAAAAAAAAa.'];
const FLAG_DOWN = [
  'sss.....',
  'sssss...',
  'ssssSS..',
  'ssssS...',
  'sssS....',
  'sSS.....',
  'SS......',
  'sS......',
  'sS......',
  'sS......',
];
const FLAG_UP = [
  'RRRRRRRRRRRRRR.',
  'RRRRRRRRRRRRRRR',
  'RRRRRYYRRRRRRR.',
  'RRRYYYYYYRRRRR.',
  'RRRRYYYYRRRRRRR',
  'RRRRYRRYRRRRRR.',
  'rrrrrrrrrrrrrr.',
];

function checkpoint(raised) {
  const frame = new Canvas(24, 48);
  frame.stamp(POST, 5, 2);
  frame.rect(5, 2, 3, 1, PALETTE.Z);
  frame.stamp(raised ? FLAG_UP : FLAG_DOWN, 8, 3);
  frame.stamp(STONE, 0, 44);
  return frame.outline();
}

// Frame 0 is waiting, frame 1 is reached.
export const checkpointFrames = [checkpoint(false), checkpoint(true)];

const GOAL_ARROW = [
  '................G...........',
  '................GG..........',
  '................GGG.........',
  '................GGGG........',
  'LLLLLLLLLLLLLLLLLGGGG.......',
  'LGGGGGGGGGGGGGGGGGGGGG......',
  'LGGGGGGGGGGGGGGGGGGGGGG.....',
  'LGGGGGGGGGGGGGGGGGGGGGGG....',
  'gGGGGGGGGGGGGGGGGGGGGGGG....',
  'gggggggggggggGGGGGGGGGG.....',
  'ggggggggggggggggggggg.......',
  '................gggg........',
  '................ggg.........',
  '................gg..........',
  '................g...........',
];

// A way-out signpost topped by a chequered flag.
export const goal = (() => {
  const frame = new Canvas(32, 64);
  frame.stamp(Array(50).fill('NNNt'), 6, 13);
  frame.rect(6, 3, 2, 12, PALETTE.a);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 18; x++) {
      frame.set(8 + x, 3 + y, (Math.floor(x / 3) + Math.floor(y / 2.67)) % 2 ? PALETTE.K : PALETTE.W);
    }
  }
  frame.stamp(GOAL_ARROW, 3, 20);
  frame.stamp(['..LLLLLLLLLLLLL.', '.GGGGGGGGGGGGGGg'], 0, 61);
  return frame.outline();
})();

// ------------------------------------------------------------- power-ups 24x24
const ICONS = {
  'egg-throw': [
    '......WWW.....',
    '.....WWWWW....',
    '....WWWWWWw...',
    '....WWWWWWw...',
    '...WWWWWWWwS..',
    '...WWWWWWWws..',
    '...WWWWWWwws..',
    'WW.wWWWWwwss..',
    '....wwwwsss...',
    'WWW..sssss....',
  ],
  'flappy-wings': [
    '.WW.......WW..',
    'WWWW.....WWWW.',
    'WWWWW...WWWWW.',
    'wWWWWW.WWWWWw.',
    'swWWWWYWWWWws.',
    '.swWWYYYWWws..',
    '..swWWYWWws...',
    '...swWWWws....',
    '....s.w.s.....',
  ],
  'feather-armor': [
    '..UUUUUUUUUU..',
    '.UCCCCCCCCCCu.',
    '.UCCCCCCWCCCu.',
    '.UCCCCCWWCCCu.',
    '.UCCCCWWWCCCu.',
    '.UCCCWWWWCCCu.',
    '.UCCCWWWCCCCu.',
    '..UCWWWCCCCu..',
    '..UCWCCCCCCu..',
    '...UCCCCCCu...',
    '....UCCCCu....',
    '......uu......',
  ],
  'corn-rush': [
    '.........YY...',
    '........YZYY..',
    '.......YZYZY..',
    'WWWW..YZYZYZ..',
    '.....GYZYZYg..',
    '.WWW.GGYZYGg..',
    '.....LGGYGg...',
    'WWWW..LGGg....',
    '.......gg.....',
  ],
  'mighty-crow': [
    '...R.R........',
    '..RRRRR.......',
    '..WWWWWW...Y..',
    '.WWWKWWWWO..Y.',
    '.WWWWWWWOOO.Y.',
    '.WWWWWWKKK..Y.',
    '.WWWWWWOOO.Y..',
    '.WWWWWWWO.....',
    '..RWWWWW......',
    '...WWWW.......',
  ],
};

const BADGES = {
  'egg-throw': [0xffb347, 0xc96a12, 0xffdca8],
  'flappy-wings': [0x6fd0e8, 0x2f8fb0, 0xc8f0fa],
  'feather-armor': [0xdfe7f5, 0x7f8ba5, 0xffffff],
  'corn-rush': [0x7ad06a, 0x37894a, 0xc6f0b0],
  'mighty-crow': [0xb57ae8, 0x6f3fb0, 0xe2c8fa],
};

function badge(kind) {
  const [color, dark, light] = BADGES[kind];
  const frame = new Canvas(24, 24);
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const dx = x - 11.5;
      const dy = y - 11.5;
      const distance = Math.hypot(dx, dy);
      if (distance > 11) continue;
      const rim = distance > 9.2;
      const glint = dist2(dx + 4, dy + 5) < 5;
      frame.set(x, y, rim ? (dy > 2 ? dark : color) : glint ? light : color);
    }
  }
  const icon = ICONS[kind];
  frame.outline();
  const layer = new Canvas(24, 24).stamp(icon, 5, Math.floor((24 - icon.length) / 2));
  frame.blit(layer.outline());
  return frame;
}

function dist2(x, y) {
  return Math.hypot(x, y * 0.7);
}

export const powerups = Object.fromEntries(Object.keys(ICONS).map((kind) => [kind, badge(kind)]));

// ============================================================ Update 1 items

// A cooked sausage, thrown by the scooter butcher. 16x16.
export const sausage = (() => {
  const frame = new Canvas(16, 16);
  const { N, n, T, Q, D } = PALETTE;
  frame.line(4, 11, 11, 4, 2.6, n);
  frame.line(4, 10, 10, 4, 2.2, N);
  frame.line(4.5, 9, 9.5, 4, 0.8, T);
  frame.set(6, 7, Q);
  frame.set(7, 6, Q);
  // Twisted ends.
  frame.rect(1, 13, 2, 2, D);
  frame.rect(13, 1, 2, 2, D);
  return frame.outline();
})();

// A sturdy market crate for the boss arena. Solid all the way to its edges. 32x32.
export const crate = (() => {
  const frame = new Canvas(32, 32);
  const { T, t, N, n, Q } = PALETTE;
  frame.rect(1, 1, 30, 30, T);
  for (const y of [9, 17, 25]) frame.rect(1, y, 30, 1, t);
  for (const [x, y, w] of [[5, 4, 6], [17, 13, 8], [8, 21, 5], [20, 28, 6]]) frame.rect(x, y, w, 1, t);
  frame.rect(1, 1, 30, 1, Q);
  // Frame and diagonal brace.
  frame.rect(1, 1, 30, 4, N).rect(1, 27, 30, 4, N);
  frame.rect(1, 1, 4, 30, N).rect(27, 1, 4, 30, N);
  frame.rect(1, 1, 30, 1, 0xb07a48);
  for (let i = 0; i < 22; i++) frame.rect(5 + i, 26 - i, 2, 2, N);
  frame.rect(1, 30, 30, 1, n).rect(30, 1, 1, 30, n);
  for (const [x, y] of [[2, 2], [28, 2], [2, 28], [28, 28]]) frame.rect(x, y, 2, 2, 0xd7deea);
  return frame.outline();
})();

// A striped market awning that throws the chicken up. 64x16, frames: resting, squashed.
function awning(squash) {
  const frame = new Canvas(64, 16);
  const { R, r, W, s } = PALETTE;
  const top = 2 + squash;
  const depth = 9 - squash;
  for (let x = 1; x < 63; x++) {
    const stripe = Math.floor((x - 1) / 8) % 2 === 0;
    const dome = Math.round(Math.sin(((x - 1) / 61) * Math.PI) * (squash ? 0 : 1.5));
    const y = top - dome;
    frame.rect(x, y, 1, depth + dome, stripe ? R : W);
    frame.set(x, y, stripe ? 0xff8a80 : 0xffffff);
    // Scalloped hem.
    const scallop = Math.round(Math.sin((((x - 1) % 8) / 8) * Math.PI) * 3);
    frame.rect(x, top + depth, 1, scallop, stripe ? r : s);
    // A soft fold shadow under the domed top.
    frame.set(x, top + depth - 2, stripe ? r : s);
  }
  return frame.outline();
}

export const bounceFrames = [awning(0), awning(3)];

// A wooden pallet slung under a crane: planks on top, blocks and steel straps below. 96x16.
export const movingPlatform = (() => {
  const frame = new Canvas(96, 16);
  const { T, t, N, n, A, a, M, Y, D } = PALETTE;
  frame.rect(0, 0, 96, 6, T);
  frame.rect(0, 0, 96, 1, 0xe2b57c);
  for (let x = 0; x < 96; x += 16) frame.rect(x, 0, 1, 6, N);
  for (const [x, w] of [[3, 7], [20, 9], [37, 5], [52, 8], [70, 6], [84, 7]]) frame.rect(x, 3, w, 1, t);
  frame.rect(0, 6, 96, 1, n);
  for (const x of [2, 42, 82]) {
    frame.rect(x, 7, 12, 5, N);
    frame.rect(x, 7, 12, 1, n);
  }
  frame.rect(0, 12, 96, 3, T);
  frame.rect(0, 14, 96, 1, t);
  // Steel lifting straps with shackle rings, where the crane cables hook on.
  for (const x of [10, 82]) {
    frame.rect(x, 0, 4, 15, A);
    frame.rect(x, 0, 1, 15, M);
    frame.rect(x + 3, 0, 1, 15, a);
    frame.rect(x + 1, 2, 2, 2, D);
  }
  // Hazard-striped ends so the edge reads while it moves.
  for (const x of [0, 93]) {
    for (let y = 0; y < 6; y++) frame.rect(x, y, 3, 1, y % 4 < 2 ? Y : D);
  }
  return frame;
})();

// ------------------------------------------------------------- hats 20x14
// Drawn to sit on the chicken's head facing right. Each hat's bottom-centre goes on the top of the
// head: chicken frame pixel (19, 6), so 5 px right of the frame centre and 22 px above its feet.
function hat(grid) {
  return new Canvas(20, 14).stamp(grid, 1, 13 - grid.length).outline();
}

export const hats = {
  straw: hat([
    '......yYYYYYy.....',
    '.....yYQYYYYYy....',
    '.....YYYYYyYYY....',
    '.....YyYYYYYyY....',
    '.....RRRRRRRRR....',
    '.....rrrrrrrrr....',
    '.yYYYYQYYYYYYQYYy.',
    'yYYQYYYYyYYYYYYYYy',
    '.yyyyyyyyyyyyyyyy.',
  ]),
  pirate: hat([
    '.......DDDD.......',
    '.....DDDDDDDD.....',
    'D...DDDDWWDDDD...D',
    'DD.DDDDWWWWDDDD.DD',
    'DDDDDDDWKWKDDDDDDD',
    'DDDDDDDDWWWDDDDDDD',
    '.DDDDDDDDDDDDDDDD.',
    '.ZZDDDDDDDDDDDDZZ.',
    '...ZZZZZZZZZZZZ...',
  ]),
  crown: hat([
    '..Q.....Q.....Q...',
    '.QZQ...QZQ...QZQ..',
    '..Z.Q..ZZZ..Q.Z...',
    '..ZZZ..ZZZ..ZZZ...',
    '..ZZZZZZZZZZZZZ...',
    '..ZZRZZZUZZZRZZ...',
    '..ZRRRZUUUZRRRZ...',
    '..ZZRZZZUZZZRZZ...',
    '..zzzzzzzzzzzzz...',
  ]),
};

// ------------------------------------------------------------- shop icons 32x32
function shopBadge([color, dark, light], draw) {
  const frame = new Canvas(32, 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x - 15.5;
      const dy = y - 15.5;
      const distance = Math.hypot(dx, dy);
      if (distance > 15) continue;
      const rim = distance > 12.8;
      const glint = Math.hypot(dx + 6, (dy + 7) * 0.7) < 6;
      frame.set(x, y, rim ? (dy > 3 ? dark : color) : glint ? light : color);
    }
  }
  frame.outline();
  const icon = new Canvas(32, 32);
  draw(icon);
  return frame.blit(icon.outline());
}

function heartShape(canvas, cx, cy, size, color) {
  canvas.ellipse(cx - size * 0.5, cy - size * 0.2, size * 0.55, size * 0.55, color);
  canvas.ellipse(cx + size * 0.5, cy - size * 0.2, size * 0.55, size * 0.55, color);
  for (let row = 0; row <= size * 1.1; row++) {
    const half = size * 1.05 - row;
    canvas.rect(Math.round(cx - half), Math.round(cy + row - size * 0.1), Math.round(half * 2), 1, color);
  }
}

const SMALL_CORN = [
  '...YY..',
  '..YZYY.',
  '..ZYZY.',
  '.GYZYZg',
  'LGGYZGg',
  '.LGGGg.',
  '..LGg..',
  '...g...',
];

const EGG_SMALL = ['.WWW.', 'WWWWw', 'WWWWw', 'WWWws', '.wss.'];

const SHOP_DRAW = {
  'extra-heart': (icon) => {
    const { R, r, P, W } = PALETTE;
    heartShape(icon, 15.5, 14, 8, r);
    heartShape(icon, 15.5, 13, 8, R);
    icon.ellipse(11, 9, 2, 1.5, P);
    icon.rect(14, 9, 4, 12, W);
    icon.rect(10, 13, 12, 4, W);
  },
  'corn-magnet': (icon) => {
    const { R, r, M, s } = PALETTE;
    // Horseshoe magnet opening to the right, pulling a corn cob in.
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const d = Math.hypot(x - 13, y - 15.5);
        if (x <= 13 && d <= 8.5 && d >= 3.6) icon.set(x, y, y > 15 ? r : R);
      }
    }
    icon.rect(13, 7, 5, 5, R).rect(13, 20, 5, 5, r);
    icon.rect(18, 7, 3, 5, M).rect(18, 20, 3, 5, M);
    icon.rect(18, 7, 3, 1, 0xffffff).rect(18, 20, 3, 1, 0xffffff);
    icon.stamp(SMALL_CORN, 22, 12);
    for (const y of [11, 21]) icon.rect(22, y, 3, 1, s);
  },
  'longer-powerups': (icon) => {
    const { W, s, K, R, U, u, Y } = PALETTE;
    icon.rect(13, 3, 6, 3, U);
    icon.rect(15, 5, 2, 2, u);
    icon.ellipse(15.5, 17, 10, 10, U);
    icon.ellipse(15.5, 17, 8, 8, W);
    icon.ellipse(16.5, 18, 7, 7, s);
    icon.ellipse(15.5, 17, 7, 7, W);
    for (const [x, y] of [[15, 10], [22, 17], [15, 23], [8, 17]]) icon.rect(x, y, 2, 1, K);
    icon.rect(15, 12, 2, 6, K);
    icon.rect(15, 16, 6, 2, R);
    icon.rect(15, 16, 2, 2, Y);
  },
  'egg-basket': (icon) => {
    const { T, t, N, n } = PALETTE;
    // Handle.
    for (let x = 5; x < 27; x++) {
      const y = Math.round(16 - Math.sin(((x - 5) / 21) * Math.PI) * 11);
      icon.rect(x, y, 1, 2, N);
    }
    icon.stamp(EGG_SMALL, 8, 11).stamp(EGG_SMALL, 18, 11).stamp(EGG_SMALL, 13, 9);
    for (let row = 0; row < 11; row++) {
      const inset = Math.floor(row / 3);
      icon.rect(5 + inset, 15 + row, 22 - inset * 2, 1, row % 3 === 0 ? N : T);
      for (let x = 5 + inset; x < 27 - inset; x++) if ((x + row) % 4 === 0 && row % 3) icon.set(x, 15 + row, t);
    }
    icon.rect(4, 15, 24, 2, n);
    icon.rect(4, 15, 24, 1, N);
  },
  'feather-start': (icon) => {
    const { W, s, S, a } = PALETTE;
    // A big white feather laid diagonally, quill at the bottom left, with notches in its vanes.
    const [x0, y0, x1, y1] = [7, 27, 25, 5];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const [dx, dy] = [(x1 - x0) / length, (y1 - y0) / length];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      if (t < 0.2) continue;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      const profile = Math.sin(Math.min(1, (t - 0.2) / 0.8 * 1.1) * Math.PI) ** 0.6;
      for (const side of [-1, 1]) {
        const notch = (side < 0 && Math.abs(t - 0.5) < 0.04) || (side > 0 && Math.abs(t - 0.68) < 0.04);
        const width = 6.5 * profile * (notch ? 0.35 : 1);
        for (let w = 0; w <= width; w += 0.5) {
          // Barbs sweep back towards the quill.
          const bx = px + -dy * side * w - dx * w * 0.45;
          const by = py + dx * side * w - dy * w * 0.45;
          icon.set(Math.round(bx), Math.round(by), side < 0 ? W : 0xe9e4f2);
        }
      }
    }
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      icon.set(Math.round(x0 + (x1 - x0) * t * 0.97), Math.round(y0 + (y1 - y0) * t * 0.97), t < 0.2 ? a : t < 0.6 ? S : s);
    }
  },
};

const SHOP_COLORS = {
  'extra-heart': [0xffc0c4, 0xd9707e, 0xffe6e8],
  'corn-magnet': [0x9ad6f0, 0x3f8fb8, 0xd8f2fc],
  'longer-powerups': [0xffe08a, 0xd29a2a, 0xfff4cc],
  'egg-basket': [0xa6e08a, 0x4f9a48, 0xdcf6c8],
  'feather-start': [0x8f7ad8, 0x5a44a8, 0xb8a8f0],
  'hat-straw': [0xff9f80, 0xc95a44, 0xffd6c8],
  'hat-pirate': [0x8fd8d0, 0x3a948e, 0xd6f6f2],
  'hat-crown': [0xc8a0f0, 0x7a4ab8, 0xeedcff],
};

for (const id of ['straw', 'pirate', 'crown']) {
  SHOP_DRAW[`hat-${id}`] = (icon) => icon.blit(hats[id], 6, 9);
}

export const shopIcons = Object.fromEntries(
  Object.keys(SHOP_COLORS).map((id) => [id, shopBadge(SHOP_COLORS[id], SHOP_DRAW[id])]),
);
