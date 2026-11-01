// Writes public/levels/boss.json, the short arena for the final fight. The boss
// calls scene.finishLevel(), but the game needs a goal, so one is sealed in the
// solid roof, out of view and out of reach.
import { Level } from './level-lib.mjs';

const G = 18;
const WIDTH = 40;
const WALL = 2;
const ROOF = 6;
const l = new Level({ width: WIDTH, height: 22, tileset: 'road' });

l.ground(0, WIDTH - 1, G);
l.block(0, WIDTH - 1, 0, ROOF - 1);
l.block(0, WALL - 1, 0, G);
l.block(WIDTH - WALL, WIDTH - 1, 0, G);

// Platforms to dodge cleavers from. They do not take away room on the floor.
l.oneWay(8, 12, G - 3);
l.oneWay(18, 22, G - 5);
l.oneWay(27, 31, G - 3);

l.spawn(5, G);
l.boss(30, G); // leaves 240px of floor to the right and more to the left
l.powerup('egg-throw', 14, G); // eggs can be lost on a hit, so keep a spare here
l.goal(20, 2);
l.cornLine(8, 12, G - 3);
l.cornLine(18, 22, G - 5);
l.cornLine(27, 31, G - 3);

l.save('boss');
