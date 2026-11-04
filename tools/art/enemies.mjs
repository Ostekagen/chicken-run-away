// Enemies. All of them face right; flip in code to walk left.
import { Canvas, PALETTE } from './lib.mjs';

// ---------------------------------------------------------------- worker 28x40
const WORKER = [
  '.........YYYYYYYY...........',
  '.......YYYYYYYYYYY..........',
  '......YYQYYYYYYYYYY.........',
  '......YQYYYYYYYYYYY.........',
  '.....yyyyyyyyyyyyyyyyy......',
  '.......FFFFFFFFFFFF.........',
  '.......FFFFnnnFFnnn.........',
  '.......FFFFFFKFFFKF.........',
  '.......FFFFFFKFFFKF.........',
  '......fPFFFFFFFFFFFF........',
  '.......FFFFFFFFFfFFf........',
  '.......FFFFFFKKKKFF.........',
  '........fFFFFFFFFF..........',
  '.........ffffffff...........',
  '.......wwwGGGGGGwww.........',
  '......wwwGGGGGGGGwww........',
  '......wwwGMGGGGMGwww........',
  '......wwwGMGGGGMGwww........',
  '......wwwGGGGGGGGwww........',
  '......wwwGGGggGGGwww........',
  '......wwwGGGGGGGGwww........',
  '......gGGGGGGGGGGGGG........',
  '......gGGGGGGGGGGGGG........',
  '......gGGGGGGGGGGGGG........',
  '......gGGGGGGGGGGGGG........',
  '......gGGGGGGGGGGGgg........',
  '......ggGGGGGGGGGGgg........',
  '......gggGGGGGGGGggg........',
  '.......gggggggggggg.........',
];

// A big meat hook held out in front, the worker's whole personality.
const WORKER_ARM_HOOK = [
  '...........aMMa.',
  '..........aM..Ma',
  '..........M....M',
  '...............M',
  '..............Ma',
  '.............Ma.',
  '.............M..',
  '.............M..',
  '.wwwww.......M..',
  '.wwwwwwwww.FFFFF',
  '.wwwwwwwwwwFFFFF',
  '..wwwwwwwwwFFFFF',
  '.............F..',
];

const WORKER_LEGS = [
  [
    '.......GGGGG...GGGGG........',
    '.......GGGGG...GGGGG........',
    '.......gGGGG...GGGGg........',
    '......gGGGG.....GGGGg.......',
    '......WWWWW.....WWWWWW......',
    '.....WWWWWW.....WWWWWWW.....',
    '.....WWWWW......WWWWWWWW....',
    '.....sssss......ssssssss....',
    '.....sssss......ssssssss....',
  ],
  [
    '.........GGGGGGGGG..........',
    '.........GGGGGGGGG..........',
    '.........gGGGGGGGg..........',
    '..........GGGGGGG...........',
    '..........WWWWWWW...........',
    '..........WWWWWWWWW.........',
    '..........WWWWWWWWWW........',
    '..........ssssssssss........',
    '..........ssssssssss........',
  ],
];

function worker(step) {
  const frame = new Canvas(28, 40);
  frame.stamp(WORKER_LEGS[step], 0, 30);
  frame.stamp(WORKER, 0, 1 + step);
  frame.outline();
  const arm = new Canvas(28, 40);
  arm.stamp(WORKER_ARM_HOOK, 11, 8 + step);
  return frame.blit(arm.outline());
}

export const workerFrames = [worker(0), worker(1)];

// ---------------------------------------------------------------- rat 28x16
const RAT_BODY = [
  '..............AAAAA.........',
  '..........AAAAAAAAAaPp......',
  '.......AAAAAAAAAAAAAPPp.....',
  '.....AAAAAAAAAAAAAAAAAAA....',
  '....AAAAAAAAAAAAAAAKAAAAAA..',
  '...aAAAAAAAAAAAAAAAAAAAAAAP.',
  '...aaAAAAAAAAAAAAAAAAAAAAAp.',
  '...aaaAAAAAAAAAAAAAsAAAWW...',
  '....aaaaaaaaaaaaaaaaa.WW....',
];

const RAT_TAIL = [
  [
    '........',
    '.P......',
    'P.......',
    'P.......',
    '.P......',
    '..PP....',
    '....PPPP',
  ],
  [
    '........',
    '........',
    'PP......',
    '..P.....',
    '...P....',
    '...PP...',
    '.....PPP',
  ],
];

const RAT_FEET = [
  ['......pp...pp.......pp..pp..', '.....ppp..ppp......ppp.ppp..'],
  ['........pp.....pp.......pp..', '.......ppp....ppp......ppp..'],
];

function rat(step) {
  const frame = new Canvas(28, 16);
  frame.stamp(RAT_TAIL[step], 0, 2);
  frame.stamp(RAT_BODY, 0, 3 + (step ? 0 : 1) - 1);
  frame.stamp(RAT_FEET[step], 0, 13);
  return frame.outline();
}

export const ratFrames = [rat(0), rat(1)];

// ---------------------------------------------------------------- dog 40x24
const DOG_BODY = [
  '............................nnnn........',
  '...........................nNNNNTTTTT...',
  '...........................nNNTTTTTTTT..',
  '.nn........................nNNTTKKTTTTTT',
  '..nn.......................nNNTTKKTTTKKK',
  '...nn......................nNNTTTTTTTKKK',
  '...TT......................nnNTTTTTwwwww',
  '...TTNNNNNNNNNNNNNNNNNNNNNRRnnTTwwWKWKWK',
  '...TTNNNNNNNNNNNNNNNNNNNRRMRRTTTwKKKKKPP',
  '...TTTNNNNNNNNNNNNNNNNNNRRRMRTTTwwWKWKW.',
  '...TTTTTNNNNNNNNNNNTTTTTTTRRMTTwwwwww...',
  '...TTTTTTTTTTTTTTTTTTTTTTTTTTTwwww......',
  '...tTTTTTTTTTTTTTTTTTTTTTTTTTwww........',
  '...ttTTTTTTTTTTTTTTTTTTTTTTTTww.........',
  '....ttttttttttttttttttttttttt...........',
];

const DOG_LEGS = [
  [
    '.....tTT....TTt.......tTT....TTt........',
    '....tTT......TTt.....tTT......TTt.......',
    '...tTT........TTt...tTT........TTt......',
    '..tTT..........TTt.tTT..........TTt.....',
    '..nnnn.........nnnnnnnn.........nnnn....',
  ],
  [
    '........TTt.TTt..........TTt.TTt........',
    '........TTt.TTt..........TTt.TTt........',
    '........TTt.TTt..........TTt.TTt........',
    '........TTt.TTt..........TTt.TTt........',
    '........nnnnnnnn.........nnnnnnnn.......',
  ],
];

// ---------------------------------------------------------------- fox 40x24
const FOX_BODY = [
  '..............................X...X.....',
  '.............................XKX.XKX....',
  '.............................XXXXXXX....',
  '............................XXXXXXXXX...',
  '.WW.........................XXXKXXXXXX..',
  'WWWWX......................wXXXKXXXWWWKK',
  'WWWXXX................XXXXwwXXXXWWWWWWKK',
  '.WXXXXXXXX..XXXXXXXXXXXXXXwwwXWWWWWWWW..',
  '..xXXXXXXXXXXXXXXXXXXXXXXXwWWWWWWKKKK...',
  '...xxXXXXXXXXXXXXXXXXXXXXXWWWWWWWw......',
  '.....xxxxXXXXXXXXXXXXXXXXXWWWWWw........',
  '.........XXXXXXXXXXXXXXXXXWWWww.........',
  '.........xXXXXXXXXXXXXXXXXXww...........',
  '..........xxxxxxxxxxxxxxxxx.............',
];

const FOX_LEGS = [
  [
    '.........xXX...XXx.......xXX...XXx......',
    '........xXX.....XXx.....xXX.....XXx.....',
    '.......xXX.......XXx...xXX.......XXx....',
    '......KKx.........KKx.KKx.........KKx...',
    '.....KKKK........KKKK.KKKK.......KKKK...',
  ],
  [
    '...........XXx.XXx.........XXx.XXx......',
    '...........XXx.XXx.........XXx.XXx......',
    '...........XXx.XXx.........XXx.XXx......',
    '...........KKx.KKx.........KKx.KKx......',
    '...........KKKKKKKK........KKKKKKKK.....',
  ],
];

function quadruped(body, legs, step) {
  const frame = new Canvas(40, 24);
  frame.stamp(legs[step], 0, 18);
  frame.stamp(body, 0, 19 - body.length - step);
  return frame.outline();
}

// The dog's spiked collar is drawn in the body grid.
export const dogFrames = [quadruped(DOG_BODY, DOG_LEGS, 0), quadruped(DOG_BODY, DOG_LEGS, 1)];
export const foxFrames = [quadruped(FOX_BODY, FOX_LEGS, 0), quadruped(FOX_BODY, FOX_LEGS, 1)];

// ---------------------------------------------------------------- goose 28x32
const GOOSE = [
  '.................WWWWW......',
  '................WWWWWWW.....',
  '................KKKWWWWW....',
  '................WWKKKWWWOO..',
  '................WWWKWWOOOOOO',
  '................WWWWWWoooooo',
  '.................WWWWWOoo...',
  '.................WWWWW......',
  '................WWWWW.......',
  '...............WWWWW........',
  '...............WWWWW........',
  '...............WWWWW........',
  '...............WWWWWW.......',
  '...............WWWWWW.......',
  '.s.............WWWWWWW......',
  '.sW...........WWWWWWWW......',
  '.sWWs.......WWWWWWWWWWW.....',
  '..WWWWWWWWWWWWWWWWWWWWW.....',
  '..sWWWWWWWWWWWWWWWWWWWw.....',
  '..sWWWWWWWWWWWWWWWWWWWw.....',
  '...sWWWWWWWWWWWWWWWWWw......',
  '...ssWWWWWWWWWWWWWWww.......',
  '.....ssssssssssssss.........',
];

const GOOSE_WING = [
  '...AAAAAAAAA.',
  '.AAsssssssssA',
  'AAsssssssssA.',
  'AsssssssAAA..',
  '.AAAAAA......',
];

const GOOSE_FEET = [
  [
    '........O.......O...........',
    '.......O.........O..........',
    '......O...........O.........',
    '....OOOO..........OOOO......',
    '............................',
  ],
  [
    '............O..O............',
    '............O..O............',
    '............O..O............',
    '...........OOOOOOOO.........',
    '............................',
  ],
];

function goose(step) {
  const frame = new Canvas(28, 32);
  frame.stamp(GOOSE_FEET[step], 0, 26);
  frame.stamp(GOOSE, 0, 3 + step);
  frame.stamp(GOOSE_WING, 4, 20 + step);
  return frame.outline();
}

export const gooseFrames = [goose(0), goose(1)];

// ---------------------------------------------------------------- van 96x48
const VAN_WHEEL = [
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

const VAN_DRIVER = [
  '....WWWW....',
  '...WWWWWW...',
  '...WWWWWW...',
  '...ssssss...',
  '...FFFFFFf..',
  '...FFFKFFF..',
  '...FFFFFFf..',
  '...nnnnnnn..',
  '..UUUUUUUU..',
];

// A cartoon cleaver and sausage link on the van's side.
const VAN_LOGO = [
  '..aaaaaaaaaaaaaa..............',
  '..aMMMMMMMMMDDMa..............',
  '..aMMMMMMMMMDDMa..............',
  '..aMMMMMMMMMMMMaNNNNNNNNNNNN..',
  '..aMMMMMMMMMMMMannnnnnnnnnnn..',
  '..aAAMMMMMMMMMMa..............',
  '..aWWWWWWWWWWWWa..............',
  '..aaaaaaaaaaaaaa..............',
];

function van(step) {
  const frame = new Canvas(96, 48);
  const { W, s, S, R, r, C, c, a, Y, O, D } = PALETTE;
  frame.rect(2, 8, 66, 30, W); // box
  frame.rect(2, 8, 66, 2, s);
  frame.rect(2, 26, 66, 5, R); // stripe
  frame.rect(2, 31, 66, 1, r);
  frame.rect(2, 35, 66, 3, s);
  // Cab, stepping down towards the front.
  for (let row = 0; row < 12; row++) frame.rect(68, 14 + row, 12 + Math.min(row, 7), 1, W);
  frame.rect(68, 26, 25, 12, W);
  frame.rect(68, 26, 25, 5, R);
  frame.rect(68, 31, 25, 1, r);
  frame.rect(68, 35, 25, 3, s);
  // Windscreen and driver.
  for (let row = 0; row < 10; row++) frame.rect(71, 16 + row, 9 + Math.min(row, 7), 1, C);
  frame.stamp(VAN_DRIVER, 72, 17);
  for (let row = 0; row < 3; row++) frame.set(84 + row, 19 + row * 2, 0xe4f6fb);
  frame.rect(68, 14, 2, 24, a);
  // Bumper and lights.
  frame.rect(0, 37, 95, 3, a);
  frame.rect(90, 29, 4, 4, Y);
  frame.rect(90, 29, 4, 1, O);
  frame.rect(1, 28, 2, 4, c);
  frame.stamp(VAN_LOGO, 16, 15);
  // Doors and wheels.
  frame.rect(64, 10, 1, 27, s);
  frame.rect(74, 28, 3, 1, D);
  frame.rect(14, 32, 16, 10, D);
  frame.rect(66, 32, 16, 10, D);
  frame.stamp(VAN_WHEEL[step], 16, 34);
  frame.stamp(VAN_WHEEL[step], 68, 34);
  return frame.outline();
}

export const vanFrames = [van(0), van(1)];

// ======================================================== Update 1: World 2 enemies

// ---------------------------------------------------------------- pigeon 28x20
// A plump city pigeon flapping along, with the green-purple sheen on its neck.
const PIGEON_BODY = [
  '...................AAAA.....',
  '..................AAAAAA....',
  '..................AAWKAAa...',
  '..................AAKKAAMD..',
  '.................GAAAAAa....',
  '................VGVAAAa.....',
  '.......aa......GVGVGAAa.....',
  'aaaa.aaAAAAAAAAAAGVAAAAa....',
  '.SaaAAAAAAAAAAAAAAAAAAAAa...',
  'SSSaaAAAAAAAAAAAAAAAAAAa....',
  '..SSaaAAAAAAAAAAAAAAAAa.....',
  '......aaaaAAAAAAAAAaa.......',
  '..........aaaaaaaaa.........',
  '.............pp..pp.........',
];

const PIGEON_WING_UP = [
  'ss..........',
  'sMs.........',
  'sMMs........',
  '.sMMss......',
  '.sMMMMss....',
  '..sMDMMMss..',
  '..sMMDMMMMss',
  '...sMMMDMMMs',
  '....sssssss.',
];

const PIGEON_WING_DOWN = [
  'sssssssssss.',
  '.sMMMDMMMDMs',
  '..sMMMDMMMs.',
  '...sMMMDMs..',
  '....sMMMs...',
  '.....sss....',
];

function pigeon(step) {
  const frame = new Canvas(28, 20);
  const bob = step ? 1 : 0;
  frame.stamp(PIGEON_BODY, 0, 5 + bob);
  frame.outline();
  const wing = new Canvas(28, 20);
  if (step === 0) wing.stamp(PIGEON_WING_UP, 7, 1);
  else wing.stamp(PIGEON_WING_DOWN, 7, 12);
  return frame.blit(wing.outline());
}

export const pigeonFrames = [pigeon(0), pigeon(1)];

// ---------------------------------------------------------------- cat 32x24
// A grey tabby alley cat. Frames: walk, walk, pounce.
const CAT_BODY = [
  '........................a....a..',
  '.......................aPa..aPa.',
  '.......................aAAaaAAa.',
  '..aa..................AAAAAAAAAA',
  '.aAa..................AALKAAALKA',
  '.aA...................AAAAAPAAAA',
  '.aA...................AWWWWWWWA.',
  '.aA....aaaaaaaaaaaaaaAAWWKWKWWA.',
  '..aA.aAAADAAADAAADAAAAAAWWWWWA..',
  '...aAAAADAAADAAADAAAAAAAAWWWW...',
  '....AAAAAAAAAAAAAAAAAAAAAWWW....',
  '....aAAAAAAAAAAAAAAAAAAAAAW.....',
  '.....aaaaaaaaaaaaaaaaaaaaa......',
];

const CAT_LEGS = [
  [
    '......AAa..AAa..........AAa..AAa',
    '.....AAa....AAa........AAa....AA',
    '....AAa......AAa......AAa......A',
    '...WWW........WWW....WWW.......W',
  ],
  [
    '........AAaAAa............AAaAA.',
    '........AAaAAa............AAaAA.',
    '........AAaAAa............AAaAA.',
    '........WWWWWW............WWWWW.',
  ],
];

// The pounce: stretched long and high, claws out, mouth open.
const CAT_POUNCE = [
  '..........................a....a',
  '.........................aPa..aP',
  '.........................aAAaaAA',
  '.aa.....................AAAAAAAA',
  'aAAa....................AAWWKAAW',
  'a..aa...aaaaaaaaaaaaaaaAAAAAAPAA',
  '.....aaAAADAAADAAADAAAAAAWWWWWWA',
  '......AAAADAAADAAADAAAAAAWKKKKWA',
  '......aAAAAAAAAAAAAAAAAAAWWRRWW.',
  '.......aAAAAAAAAAAAAAAAAAAWWWW..',
  '........aaaaaaaaaaaaaaaaaaaaa...',
];

const CAT_POUNCE_LEGS = [
  '........................AAAAAAa.',
  '......AAa...............aAAAAAWW',
  '.....AAa.................aaaa.WW',
  '....AAa.........................',
  '...AAa..........................',
  '..AAa...........................',
  '.WWW............................',
];

function cat(step) {
  const frame = new Canvas(32, 24);
  // Shifted left a pixel so the outline fits on the right.
  frame.stamp(CAT_LEGS[step], -1, 20);
  frame.stamp(CAT_BODY, -1, 8 - step);
  return frame.outline();
}

function catPounce() {
  const frame = new Canvas(32, 24);
  frame.stamp(CAT_POUNCE_LEGS, -2, 16);
  frame.stamp(CAT_POUNCE, -2, 5);
  return frame.outline();
}

export const catFrames = [cat(0), cat(1), catPounce()];

// ---------------------------------------------------------------- crab 32x20
const CRAB_CLAW = [
  [
    '.RRR...',
    'RRPRr..',
    'RR.....',
    'RRRRr..',
    '.RRRRr.',
    '..rRRr.',
    '...rRR.',
    '....rRR',
  ],
  [
    '.RRRR..',
    'RRPRRr.',
    'RRRRRr.',
    '.RRRRr.',
    '..RRRr.',
    '..rRRr.',
    '...rRR.',
    '....rRR',
  ],
];

const CRAB_EYES = [
  '.WW......WW.',
  'WKW.....WKW.',
  '.WW......WW.',
  '..r......r..',
  '..r......r..',
];

const CRAB_LEGS = [
  [
    '......r.r.r..........r.r.r......',
    '.....r.r.r............r.r.r.....',
    '....r.r.r..............r.r.r....',
    '....r.r.r..............r.r.r....',
  ],
  [
    '.......r.r.r........r.r.r.......',
    '......r.r.r..........r.r.r......',
    '......r.r.r..........r.r.r......',
    '.....r.r.r............r.r.r.....',
  ],
];

function crab(step) {
  const frame = new Canvas(32, 20);
  const { R, r, P, K } = PALETTE;
  frame.stamp(CRAB_LEGS[step], 0, 15);
  frame.ellipse(15.5, 12, 10, 5, R);
  for (let x = 6; x < 26; x++) frame.set(x, 16, r);
  frame.ellipse(15.5, 15, 8, 1, r);
  frame.rect(10, 9, 2, 1, P);
  frame.rect(13, 8, 3, 1, P);
  frame.rect(20, 9, 2, 1, P);
  // A happy little mouth.
  frame.rect(14, 13, 4, 1, K);
  frame.set(13, 12, K);
  frame.set(18, 12, K);
  frame.stamp(CRAB_EYES, 10, 3 + step);
  frame.stamp(CRAB_CLAW[step], 0, 1 + step);
  frame.stamp(CRAB_CLAW[step], 25, 1 + step, { flip: true });
  return frame.outline();
}

export const crabFrames = [crab(0), crab(1)];
