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

// ------------------------------------------------- scooter butcher 64x56 (Update 1)
// The same butcher, head, hat and striped shirt unchanged, riding a red delivery scooter with
// a sausage box on the back. Frames: drive, drive, dazed.
const SCOOTER_WHEEL = [
  [
    '...DDDDDD...',
    '..DDDDDDDD..',
    '.DDDAAAADDD.',
    'DDDAAMMAADDD',
    'DDAAMAAMAADD',
    'DDAMAAAAMADD',
    'DDAMAAAAMADD',
    'DDAAMAAMAADD',
    'DDDAAMMAADDD',
    '.DDDAAAADDD.',
    '..DDDDDDDD..',
    '...DDDDDD...',
  ],
  [
    '...DDDDDD...',
    '..DDDDDDDD..',
    '.DDDAMMADDD.',
    'DDDAAMMAADDD',
    'DDAAAAAAAADD',
    'DMMAAAAAAMMD',
    'DMMAAAAAAMMD',
    'DDAAAAAAAADD',
    'DDDAAMMAADDD',
    '.DDDAMMADDD.',
    '..DDDDDDDD..',
    '...DDDDDD...',
  ],
];

// A sausage link and cleaver on the delivery box, like the logo on the van.
const BOX_LOGO = [
  '.MMMMa...',
  '.MMMMaNN.',
  '.MMMMa...',
  '.........',
  'TTTTTTTT.',
  'NNNNNNNNn',
  '.nnnnnnn.',
];

const SCOOTER_ARM = [
  'UUUUUUUUUUFFF',
  'UUUUUUUUUUFFFF',
  '.UUUUUUUUUFFFF',
  '..........FFF.',
];

// Dizzy eyes and a wobbly mouth laid over the big head.
const DAZED_FACE = [
  '....................',
  '....................',
  '....................',
  '....................',
  '.......KFK...KFK....',
  '........K.....K.....',
  '.......KFK...KFK....',
  '....................',
  '....................',
  '....................',
  '....................',
  '....................',
  '.........WKKKW......',
];

const STAR = ['..Y..', '.YQY.', 'YQQQY', '.YQY.', '..Y..'];

function scooterButcher(step, dazed = false) {
  const { R, r, W, w, s, D, a, A, M, Y, Q, n } = PALETTE;
  const bob = step && !dazed ? 1 : 0;
  const frame = new Canvas(64, 56);

  // Delivery box on the rear rack, behind the rider.
  const back = new Canvas(64, 56);
  back.rect(1, 19 + bob, 15, 15, R);
  back.rect(1, 19 + bob, 15, 3, W);
  back.rect(1, 22 + bob, 15, 1, s);
  back.rect(1, 32 + bob, 15, 2, r);
  back.stamp(BOX_LOGO, 4, 24 + bob);
  back.rect(0, 34 + bob, 18, 2, A);
  frame.blit(back.outline());

  // The butcher, built exactly like the running one.
  const rider = new Canvas(64, 56);
  rider.stamp(TORSO, 13, 25 + bob);
  rider.stamp(CHEF_HAT, 19, bob);
  rider.stamp(BIG_HEAD, 19, 8 + bob);
  if (dazed) rider.stamp(DAZED_FACE, 19, 8 + bob);
  rider.outline();
  frame.blit(pinstripe(rider));

  // Scooter body: rear cowl, seat, floorboard, leg shield and front fender.
  const scooter = new Canvas(64, 56);
  scooter.ellipse(17, 44 + bob, 15, 8, R);
  scooter.ellipse(17, 42 + bob, 12, 4, 0xf0615a);
  scooter.rect(2, 45 + bob, 31, 4, R);
  scooter.rect(2, 47 + bob, 31, 2, r);
  scooter.rect(22, 38 + bob, 6, 2, w); // side trim
  scooter.rect(30, 45 + bob, 18, 3, a);
  scooter.rect(30, 45 + bob, 18, 1, M);
  for (let row = 0; row < 18; row++) {
    const x = 45 - Math.floor(row / 4) + (row > 13 ? row - 13 : 0);
    scooter.rect(x, 30 + row + bob, 6 - (row > 15 ? row - 15 : 0), 1, row < 2 ? 0xf0615a : R);
  }
  scooter.rect(50, 41 + bob, 12, 2, R);
  scooter.rect(51, 40 + bob, 9, 1, 0xf0615a);
  // Trousers and boot resting on the floorboard.
  scooter.rect(33, 41 + bob, 10, 4, D);
  scooter.rect(36, 43 + bob, 9, 2, n);
  scooter.outline();
  frame.blit(scooter);

  // Handlebar, headlight and the arm gripping it.
  const front = new Canvas(64, 56);
  front.rect(50, 24 + bob, 2, 8, A);
  front.rect(47, 23 + bob, 9, 2, D);
  front.ellipse(55, 29 + bob, 2.5, 2.5, M);
  front.ellipse(55.5, 29 + bob, 1.5, 1.5, Y);
  front.set(56, 28 + bob, Q);
  // Dazed, he lets go of the handlebar.
  if (!dazed) front.stamp(SCOOTER_ARM, 36, 22 + bob);
  frame.blit(pinstripe(front).outline());

  // Wheels last so they sit in front of everything.
  const wheels = new Canvas(64, 56);
  wheels.stamp(SCOOTER_WHEEL[step % 2], 8, 44);
  wheels.stamp(SCOOTER_WHEEL[step % 2], 50, 44);
  frame.blit(wheels.outline());

  if (!dazed && step === 1) frame.stamp(['.ss.', 'sWWs', 'sWWs', '.ss.'], 0, 46); // exhaust puff
  if (dazed) {
    frame.blit(new Canvas(64, 56).stamp(STAR, 17, 0).stamp(STAR, 42, 3).stamp(STAR, 30, 0).outline());
  }
  return frame;
}

export const scooterButcherFrames = [scooterButcher(0), scooterButcher(1), scooterButcher(0, true)];
