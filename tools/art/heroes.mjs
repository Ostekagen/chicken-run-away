// The chicken and the butcher, built from body-part grids so each frame stays on model.
import { Canvas, PALETTE } from './lib.mjs';

// ---------------------------------------------------------------- chicken 28x28
const HEN = [
  '................R..R........',
  '...............RRRRRR.......',
  '...............RRRRRRR......',
  '...............rRrRRrR......',
  '..............WWWWWWWWW.....',
  '.............WWWWWWWWWWW....',
  '.............WWWWKKKKWWWW...',
  '.............WWWWKKWKKWWW...',
  '.............WWWWKKKKKWWWO..',
  '.............WWWWWKKKWWWOOOO',
  '.s...........WWWWWWWWWWWoooo',
  '.ss..........WWWWWWWWWWRRo..',
  '.sWs.........wWWWWWWWWRRr...',
  '.sWWs.......wwWWWWWWWWRr....',
  '..WWWs....wwWWWWWWWWWWw.....',
  '..WWWWWWWWWWWWWWWWWWWWw.....',
  '..wWWWWWWWWWWWWWWWWWWWw.....',
  '..wWWWWWWWWWWWWWWWWWWwS.....',
  '...wWWWWWWWWWWWWWWWWwwS.....',
  '...wwWWWWWWWWWWWWWwwwS......',
  '....swwwwwwwwwwwwwwsS.......',
  '.....ssssssssssssssS........',
  '.......SSSSSSSSSS...........',
];

const WING_DOWN = [
  '...ssssss...',
  '..sWWWWWWs..',
  '.sWWWWWWWWs.',
  '.sWWWWWWWs..',
  '.swWwWWwWs..',
  '..swsWwsw...',
  '...s.ss.....',
];

const WING_MID = [
  '.ssssssss...',
  'sWWWWWWWWs..',
  'sWWWWWWWWWs.',
  'swWwWWwWWs..',
  '.s.sw.sw....',
];

const WING_UP = [
  '.....s.s....',
  '...s.s.s.s..',
  '...sswswss..',
  '...swWWWws..',
  '..swWWWWWs..',
  '..sWWWWWWWs.',
  '..sWWWWWWWs.',
  '...ssssss...',
];

const LEGS = {
  stand: [
    '..........O.....O...........',
    '..........O.....O...........',
    '..........O.....O...........',
    '.........OOOO..OOOO.........',
  ],
  // Run poses: front leg reaching, passing, pushing, passing.
  run1: [
    '............O....O..........',
    '...........O......O.........',
    '..........O........O........',
    '.........oO.........OOOO....',
  ],
  run2: [
    '............O.O.............',
    '............O.O.............',
    '............OOOOO...........',
    '...........oo...............',
  ],
  run3: [
    '.........O....O.............',
    '..........O....O............',
    '...........O....OOO.........',
    '..........oo................',
  ],
  run4: [
    '...........O.O..............',
    '...........O.O..............',
    '..........oo.OOOO...........',
    '............................',
  ],
  tucked: [
    '..........OOO..OOO..........',
    '...........O....O...........',
    '............................',
    '............................',
  ],
  dangle: [
    '..........O......O..........',
    '..........O......O..........',
    '.........OO.....OO..........',
    '.........O.O....O.O.........',
  ],
};

// Eye drawn over the head for the moments the chicken looks alarmed.
const WIDE_EYE = ['WKKKW', 'KKWKK', 'KKKKK', 'KKKKK', 'WKKKW'];

function hen({ legs, wing, wingX = 9, wingY = 11, bob = 0, wideEye = false }) {
  const frame = new Canvas(28, 28);
  frame.stamp(LEGS[legs], 0, 23);
  frame.stamp(HEN, 0, bob);
  if (wideEye) frame.stamp(WIDE_EYE, 17, 6 + bob);
  frame.stamp(wing, wingX, wingY + bob);
  return frame.outline();
}

export const chickenFrames = [
  hen({ legs: 'stand', wing: WING_DOWN }), // 0 idle
  hen({ legs: 'run1', wing: WING_MID, wingX: 8, wingY: 12, bob: 1 }), // 1-4 run
  hen({ legs: 'run2', wing: WING_DOWN, wingX: 8, wingY: 11, bob: 0 }),
  hen({ legs: 'run3', wing: WING_UP, wingX: 8, wingY: 7, bob: 1 }),
  hen({ legs: 'run4', wing: WING_DOWN, wingX: 8, wingY: 11, bob: 0 }),
  hen({ legs: 'tucked', wing: WING_MID, wingX: 7, wingY: 13, bob: 1 }), // 5 jump
  hen({ legs: 'dangle', wing: WING_UP, wingX: 8, wingY: 5, bob: 1, wideEye: true }), // 6 fall
];

// ---------------------------------------------------------------- butcher 40x56
const CHEF_HAT = [
  '.....WWWW..WWWW.....',
  '...WWWWWWWWWWWWWW...',
  '..WWWWWWWWWWWWWWWW..',
  '..WWWWWWWWWWWWWWsW..',
  '..WWWWWWWWWWWWWWsW..',
  '...WWWWWWWWWWWWss...',
  '....WWWWWWWWWWss....',
  '....WWWWWWWWWWss....',
  '....ssssssssssss....',
];

const BIG_HEAD = [
  '...nnFFFFFFFFFFFF...',
  '..nnFFFFFFFFFFFFFF..',
  '..nFFFnnnnFFFnnnnF..',
  '..FfFFFFFnnFnnFFFF..',
  '..fFFFFWWKFFFWWKFF..',
  '.ffFFFFWWKFFFWWKFF..',
  '.fPfFFFFFFFFFFFFFFf.',
  '.ffFFFFFFFFfFFFFFFff',
  '..FFFPPFFFFffffFFFff',
  '..FFFPPnnnnnnnnnnnff',
  '..FFFnnnnnnnnnnnnnnn',
  '..FFnnnFFFFFFFFnnnn.',
  '...FFFFFrrrrrrFFFF..',
  '...fFFFFFFFFFFFFFf..',
  '....ffffffffffff....',
];

// Blue shirt (stripes are added later) with a white apron over the big belly.
const TORSO = [
  '..........UUUUUUUUUUUUUU........',
  '.......UUUUUUwWWWWWWwUUUUU......',
  '.....UUUUUUUwWWWWWWWWwUUUUUU....',
  '....UUUUUUUUwWWWWWWWWwUUUUUUU...',
  '....UUUUUUUwWWWWWWWWWWwUUUUUU...',
  '...UUUUUUUwWWWWWWWWWWWWwUUUUUU..',
  '...UUUUUUwWWWWWWWWWWWWWWwUUUUUU.',
  '...UUUUUwWWWWWWWWWWWWWWWWwUUUUU.',
  '...UUUUwWWWWWWWWWWWWWWWWWWwUUUU.',
  '...UUUwRRRRRRRRRRRRRRRRRRRRwUUUU',
  '...UUUwrrrrrrrrRRRrrrrrrrrrrwUUU',
  '...UUUwWWWWWWWRrRrWWWWWWWWWWWwUU',
  '...UUwWWWWWWWWRrWrRWWWWWWWWWWWwU',
  '...UUwWWWWWWWWWWWWWWWWWWWWWWWWwU',
  '...UUwwssssssssssssssWWWWWWWWWwU',
  '...UUwwsWWWWWWWWWWWWsWWWWWWWWws.',
  '....UwwsWWWWWWWWWWWWsWWWWWWWwss.',
  '....UwwsWWWWWWWWWWWWsWWWWWWwss..',
  '.....wwwssssssssssssswwwwwwss...',
  '.......wwwwwwwwwwwwwwwwwwss.....',
  '........ssssssssssssssssSS......',
  '..........SSSSSSSSSSSSSS........',
];

const BUTCHER_LEGS = {
  run1: [
    '.........DDDDDD........DDDDDD.......',
    '........DDDDDDD........DDDDDDD......',
    '.......DDDDDD...........DDDDDDD.....',
    '......DDDDD..............DDDDDDD....',
    '.....DDDDD................DDDDDD....',
    '...nnnDDD.................nnnnnnn...',
    '...nnnnn..................nnnnnnnnn.',
    '...nnnn...................nnnnnnnnn.',
  ],
  run2: [
    '............DDDDDD.DDDDDD...........',
    '............DDDDDD.DDDDDD...........',
    '...........DDDDDD..DDDDDD...........',
    '...........DDDDD...DDDDDD...........',
    '..........DDDDDD...DDDDDD...........',
    '.........nnnnnn....nnnnnnnn.........',
    '.........nnnn......nnnnnnnnn........',
    '...................nnnnnnnnn........',
  ],
  run3: [
    '.........DDDDDD........DDDDDD.......',
    '.........DDDDDDD......DDDDDDD.......',
    '..........DDDDDD.....DDDDDD.........',
    '...........DDDDDD...DDDDDD..........',
    '...........DDDDD...DDDDDD...........',
    '...........nnnnnnnnnDDDD............',
    '...........nnnnnnnnnnnn.............',
    '...........nnnnnnnnn................',
  ],
  run4: [
    '...........DDDDDD.DDDDDD............',
    '...........DDDDDD.DDDDDD............',
    '............DDDDD.DDDDDD............',
    '............DDDDDD.DDDDD............',
    '............DDDDDD.DDDDD............',
    '.............nnnnnnnnnnnnn..........',
    '.............nnnnnnnnnnnnnn.........',
    '.............nnnnn..................',
  ],
  throw: [
    '.........DDDDDD.......DDDDDD........',
    '.........DDDDDD.......DDDDDDD.......',
    '........DDDDDD.........DDDDDDD......',
    '.......DDDDDD...........DDDDDD......',
    '.......DDDDD............DDDDDD......',
    '......nnnnnnn...........nnnnnnnn....',
    '......nnnnnnn...........nnnnnnnnnn..',
    '......nnnnn.............nnnnnnnnnn..',
  ],
};

// A chunky cleaver held upright: blade edge on the left, spine and handle on the right.
const CLEAVER_RAISED = [
  'WMMMMMMMMa.',
  'WMMMMMDDAa.',
  'WMMMMMDDAa.',
  'WMMMMMMMAa.',
  'WMMMMMMMAa.',
  'WMMMMMMMAa.',
  'WMMMMMMMAa.',
  'WMMMMMMMAa.',
  'WAAAAAAAAa.',
  '.......NnN.',
  '.......NnN.',
  '.......NnN.',
  '.......NnN.',
];

const ARM_UP = [
  '......FFFF..',
  '......FFFFF.',
  '......FFFFF.',
  '.....UUUFF..',
  '.....UUUUU..',
  '.....UUUUUU.',
  '......UUUUUU',
  '.......UUUUU',
  '........UUUU',
];

const ARM_BACK = [
  '.....UUUUUU',
  '...UUUUUUU.',
  '..UUUUUUU..',
  '.UUUUUU....',
  'FFFFF......',
  'FFFFF......',
  '.FFF.......',
];

const ARM_THROW = [
  'UUUUUUUUUUUFFF..',
  'UUUUUUUUUUUFFFF.',
  'UUUUUUUUUUUFFFFF',
  '.UUUUUUUUUUFFFF.',
  '...........FF...',
];

// Pinstripes the shirt, leaving a darker sleeve-side edge for shape.
function pinstripe(frame) {
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      if (frame.get(x, y) === PALETTE.U && x % 3 === 0) frame.set(x, y, PALETTE.C);
    }
  }
  return frame;
}

function butcher({ legs, bob = 0, armLift = 0 }) {
  const frame = new Canvas(40, 56);
  frame.stamp(BUTCHER_LEGS[legs], 1, 47);
  frame.stamp(TORSO, 7, 26 + bob);
  frame.stamp(CHEF_HAT, 13, 1 + bob);
  frame.stamp(BIG_HEAD, 13, 9 + bob);
  frame.outline();
  // The arm gets its own outline so it reads against the body behind it.
  const arm = new Canvas(40, 56);
  arm.stamp(CLEAVER_RAISED, 1, 6 + bob - armLift);
  arm.stamp(ARM_UP, 2, 19 + bob - armLift);
  frame.blit(pinstripe(arm).outline());
  return pinstripe(frame);
}

// Weight on the front foot, cleaver gone, throwing arm stretched out over the belly.
function butcherThrow() {
  const frame = new Canvas(40, 56);
  frame.stamp(BUTCHER_LEGS.throw, 1, 47);
  frame.stamp(ARM_BACK, 1, 28);
  frame.stamp(TORSO, 6, 26);
  frame.stamp(CHEF_HAT, 13, 1);
  frame.stamp(BIG_HEAD, 13, 9);
  frame.outline();
  const arm = new Canvas(40, 56);
  arm.stamp(ARM_THROW, 23, 28);
  frame.blit(pinstripe(arm).outline());
  return pinstripe(frame);
}
export const butcherFrames = [
  butcher({ legs: 'run1', bob: 1, armLift: 3 }), // 0-3 run
  butcher({ legs: 'run2', bob: 0 }),
  butcher({ legs: 'run3', bob: 1, armLift: 0 }),
  butcher({ legs: 'run4', bob: 0, armLift: 2 }),
  butcherThrow(), // 4 throw
];
