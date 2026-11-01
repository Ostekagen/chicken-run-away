// Writes public/levels/level-1.json, The Slaughterhouse. Each stretch teaches one
// thing before the next one uses it, and it ends in the first butcher chase.
import { Level } from './level-lib.mjs';

const G = 16; // the normal floor row
const WIDTH = 400;
const HOOK = 5; // decoration tile
const l = new Level({ width: WIDTH, height: 22, tileset: 'slaughterhouse' });

// Run: nothing but corn to follow.
let x = l.run(26, G);
l.spawn(3, G);
l.cornLine(x + 7, x + 24, G, 2);

// Jump: steps up, a safe ditch, then real gaps.
x = l.run(5, G - 1);
l.cornLine(x + 1, x + 4, G - 1);
x = l.run(5, G - 2);
l.cornLine(x + 1, x + 4, G - 2);
x = l.run(4, G);
x = l.run(3, G + 2);
l.cornArc(x - 1, x + 3, G, 2);
x = l.run(7, G);
l.cornLine(x + 2, x + 6, G);
x = l.x;
l.gap(2);
l.cornArc(x - 1, x + 2, G, 2);
x = l.run(7, G);
l.cornLine(x + 2, x + 5, G);
x = l.x;
l.gap(3);
l.cornArc(x - 1, x + 3, G, 2);
x = l.run(10, G);

// One-way platforms: the only way over the tall wall is up through them.
l.oneWay(x + 4, x + 8, G - 3);
l.cornLine(x + 4, x + 8, G - 3);
x = l.run(16, G - 6);
l.cornLine(x + 1, x + 14, G - 6, 2);
const wallEnd = x + 15;
x = l.run(8, G);

// Egg 1: an alcove under the wall, behind the player after the drop.
l.carve(wallEnd - 9, wallEnd, G - 2, G - 1);
l.cornLine(wallEnd - 3, wallEnd, G);
l.egg(wallEnd - 8, G);
l.checkpoint(x + 5, G);

// Hazards: one spike, then two, then three.
x = l.run(46, G);
l.cornArc(x + 3, x + 7, G, 2);
l.hazard(x + 5, x + 5, G);
l.cornArc(x + 12, x + 17, G, 2);
l.hazard(x + 14, x + 15, G);
l.cornArc(x + 22, x + 28, G, 2);
l.hazard(x + 24, x + 26, G);

// Egg 2: corn climbs out of view to a shelf that doubles back over the spikes.
l.oneWay(x + 31, x + 34, G - 3);
l.corn(x + 32, G - 3);
l.oneWay(x + 36, x + 39, G - 6);
l.corn(x + 37, G - 6);
l.oneWay(x + 28, x + 34, G - 9);
l.corn(x + 33, G - 9);
l.egg(x + 28, G - 9);

// Stomp: a rat in a trench, too narrow to pass without dealing with it.
x = l.run(3, G);
x = l.run(9, G + 1);
l.enemy('rat', x + 6, G + 1);
l.cornLine(x + 1, x + 7, G + 1, 2);
x = l.run(14, G);
l.enemy('rat', x + 9, G);
l.cornLine(x + 3, x + 12, G, 3);

// Power-ups: armour first, then the workers it protects from.
x = l.run(14, G);
l.oneWay(x + 4, x + 7, G - 3);
l.powerup('feather-armor', x + 5, G - 3);
x = l.run(26, G);
l.enemy('worker', x + 12, G);
l.cornLine(x + 2, x + 24, G, 3);
l.checkpoint(x + 1, G);
x = l.run(10, G);
l.powerup('egg-throw', x + 4, G);
x = l.run(30, G);
l.enemy('worker', x + 8, G);
l.enemy('rat', x + 16, G);
l.enemy('worker', x + 24, G);
l.cornLine(x + 2, x + 28, G, 2);

// Everything together: a spike floor crossed on one-way islands.
x = l.run(3, G);
x = l.run(20, G + 2);
l.hazard(x, x + 19, G + 2);
for (const island of [2, 8, 14]) {
  l.oneWay(x + island, x + island + 2, G - 1);
  l.cornLine(x + island, x + island + 2, G - 1);
}
x = l.run(8, G);
l.enemy('worker', x + 5, G);

// Egg 3: a ditch that looks like a dead end hides a tunnel running ahead.
x = l.run(6, G);
const ditch = l.run(3, G + 3);
x = l.run(16, G);
l.carve(x, x + 10, G + 1, G + 2);
l.cornLine(x, x + 3, G + 3);
l.egg(x + 10, G + 3);
l.cornLine(x + 4, x + 14, G, 2);
l.cornLine(ditch, ditch + 2, G + 3);

// The chase: a flat run, with spikes that stop the chicken but not the butcher.
x = l.run(WIDTH - l.x, G);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
for (const [spike, length] of [[22, 1], [33, 2], [44, 1], [52, 2], [62, 2], [71, 3]]) {
  l.hazard(x + spike, x + spike + length - 1, G);
  l.cornArc(x + spike - 2, x + spike + length + 1, G, 2);
}
l.cornLine(x + 12, x + 18, G);
l.chaseEnd(x + 80, G);
l.goal(x + 90, G);

// A roof over everything, with meat hooks hanging from it.
l.block(0, WIDTH - 1, 0, 2);
for (let hook = 4; hook < WIDTH; hook += 9) l.set(hook, 3, HOOK);

l.save('level-1');
