// Writes public/levels/boss-2.json, the market square on the quay where the Scooter
// Butcher fights. Flat floor for the scooter, which piles its own crates 8 tiles
// either side and tips into the harbour 13 tiles to the right, so open water starts
// there. The sky stays open for the sausages' high arcs. The boss calls
// scene.finishLevel(), but the game needs a goal, so one is sealed in a solid
// block in the corner, out of reach.
import { Level } from './level-lib.mjs';

const G = 18;
const BOSS = 18;
const WATER = BOSS + 13; // where the quay ends
const WIDTH = WATER + 6;
const l = new Level({ width: WIDTH, height: 22, tileset: 'harbour' });

l.ground(0, WATER - 1, G);
l.block(0, 1, 0, G); // the market wall
l.block(2, 4, 0, 3); // the goal is sealed in here

// Boards to jump onto when the scooter charges. They leave the floor clear.
l.oneWay(4, 7, G - 3);
l.oneWay(9, 11, G - 6);
l.oneWay(24, 26, G - 6);
l.oneWay(28, 30, G - 3);

l.spawn(3, G);
l.scooterBoss(BOSS, G); // 16 tiles of floor to the left and 12 to the right
l.powerup('egg-throw', 5, G - 3); // eggs can be lost on a hit, so keep a spare here
l.goal(3, 2);
l.cornLine(4, 7, G - 3);
l.cornLine(9, 11, G - 6);
l.cornLine(24, 26, G - 6);
l.cornLine(28, 30, G - 3);

l.save('boss-2');
