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
