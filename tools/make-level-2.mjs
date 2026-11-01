// Writes public/levels/level-2.json, The Farm. Wide and tall, with a ground route
// past dogs and geese, and secret routes through lofts, a cellar and the sky.
import { Level } from './level-lib.mjs';

const G = 24; // the normal ground row
const l = new Level({ width: 353, height: 30, tileset: 'farm' });

// Doors at floor level on both ends, one-way lofts inside, and a stepped roof.
function barn(x, width, floor, lofts) {
  const right = x + width - 1;
  const wallTop = floor - 8;
  l.block(x, x, wallTop, floor - 3);
  l.block(right, right, wallTop, floor - 3);
  for (let step = 0; step * 2 < width / 2 - 1; step++) {
    l.block(x + step * 2, right - step * 2, wallTop - step, wallTop - step);
  }
  for (const [from, to, row] of lofts) l.oneWay(x + from, x + to, floor - row);
}

// Solid, so it is jumped over: a long body with a tall cab at the back.
function tractor(x, floor) {
  l.block(x, x + 6, floor - 2, floor - 1);
  l.block(x + 4, x + 6, floor - 3, floor - 3);
}

function haystack(x, floor) {
  l.block(x, x + 2, floor - 1, floor - 1);
}

// The yard: a dog to meet, and hay to hop.
let x = l.run(34, G);
l.spawn(4, G);
l.cornLine(x + 8, x + 18, G, 2);
haystack(x + 20, G);
l.cornArc(x + 18, x + 24, G, 3);
l.enemy('dog', x + 28, G);
x = l.run(3, G - 1);
x = l.run(3, G - 2);
l.cornLine(x, x + 2, G - 2);
x = l.run(3, G - 1);
x = l.run(14, G);
l.cornLine(x + 1, x + 7, G);

// Barn one. The ground floor is the way through. Hay outside climbs to the roof,
// and the high loft hides Flappy Wings.
const barnOne = x + 12;
l.oneWay(barnOne - 6, barnOne - 3, G - 3);
l.corn(barnOne - 4, G - 3);
l.oneWay(barnOne - 5, barnOne - 2, G - 6);
x = l.run(26, G);
barn(barnOne, 24, G, [[2, 7, 3], [9, 14, 6], [16, 21, 3]]);
l.cornLine(barnOne + 2, barnOne + 21, G, 2);
l.enemy('goose', barnOne + 12, G);
l.powerup('flappy-wings', barnOne + 13, G - 6);
l.cornLine(barnOne + 2, barnOne + 7, G - 3);
l.cornLine(barnOne + 16, barnOne + 21, G - 3);
l.cornLine(barnOne + 10, barnOne + 13, G - 13);

// The field, with tractors. Behind the second one, a hole drops into the cellar.
x = l.run(70, G);
l.checkpoint(x + 4, G);
tractor(x + 12, G);
l.cornArc(x + 10, x + 20, G, 4);
l.enemy('dog', x + 28, G);
l.cornLine(x + 22, x + 34, G, 2);
tractor(x + 38, G);
l.cornArc(x + 36, x + 46, G, 4);
const hole = x + 46;
const cellarEnd = hole + 26;
l.enemy('goose', x + 56, G);

// The cellar: a tunnel below the field, with corn, Corn Rush and an egg. The way
// out comes up through the field further on.
x = l.run(14, G);
l.carve(hole, hole + 1, G, G + 3);
l.carve(hole, cellarEnd, G + 1, G + 3);
l.cornLine(hole + 3, cellarEnd - 5, G + 4, 2);
l.powerup('corn-rush', hole + 14, G + 4);
l.egg(cellarEnd - 3, G + 4);
l.carve(cellarEnd + 1, cellarEnd + 3, G, G + 3);
l.block(cellarEnd + 4, cellarEnd + 4, G + 1, G + 3);
l.oneWay(cellarEnd + 1, cellarEnd + 3, G + 1);

// The hill: up to a plateau, with a hay ladder into the sky.
x = l.run(6, G - 2);
l.cornLine(x + 1, x + 5, G - 2, 2);
x = l.run(6, G - 4);
l.cornLine(x + 1, x + 5, G - 4, 2);
x = l.run(6, G - 6);
l.cornLine(x + 1, x + 5, G - 6, 2);
x = l.run(26, G - 8);
l.checkpoint(x + 2, G - 8);
l.enemy('goose', x + 14, G - 8);
l.cornLine(x + 6, x + 24, G - 8, 3);

// Egg 3: hay bales up out of view, with a corn or two as the hint.
const P = G - 8;
l.oneWay(x + 8, x + 11, P - 3);
l.corn(x + 9, P - 3);
l.oneWay(x + 12, x + 15, P - 6);
l.corn(x + 13, P - 6);
l.oneWay(x + 17, x + 20, P - 9);
l.oneWay(x + 22, x + 25, P - 9);
l.corn(x + 23, P - 9);
l.egg(x + 25, P - 9);

// Down the far side, over the pond.
x = l.x;
l.gap(3);
l.cornArc(x - 1, x + 3, P, 2);
x = l.run(10, G - 5);
l.cornLine(x + 1, x + 8, G - 5, 2);
x = l.x;
l.gap(3);
l.cornArc(x - 1, x + 3, G - 5, 1);
x = l.run(12, G - 2);
l.enemy('dog', x + 7, G - 2);
x = l.run(8, G);

// Barn two, with the silo right behind it. The silo top holds egg 1.
const barnTwo = l.x + 2;
x = l.run(32, G);
barn(barnTwo, 26, G, [[2, 8, 3], [11, 17, 6], [18, 23, 3]]);
l.cornLine(barnTwo + 2, barnTwo + 23, G, 2);
l.enemy('goose', barnTwo + 9, G);
l.enemy('dog', barnTwo + 18, G);
l.powerup('flappy-wings', barnTwo + 14, G - 6);
// Bonus corn only Flappy Wings can reach, from the top of the barn.
l.cornLine(barnTwo + 6, barnTwo + 22, G - 15, 2);

x = l.run(10, G);
const silo = x + 3;
l.block(silo, silo + 3, G - 13, G - 3); // walk under it, through the doors
l.cornLine(silo, silo + 3, G);
l.oneWay(silo + 5, silo + 7, G - 3);
l.oneWay(silo + 5, silo + 7, G - 6);
l.oneWay(silo + 5, silo + 7, G - 9);
l.oneWay(silo + 5, silo + 7, G - 12);
l.corn(silo + 6, G - 3);
l.corn(silo + 6, G - 9);
l.egg(silo + 1, G - 13);

// Last stretch to the farm gate.
x = l.run(64, G);
l.checkpoint(x + 12, G);
l.hazard(x + 20, x + 21, G);
l.cornArc(x + 18, x + 23, G, 2);
tractor(x + 28, G);
l.cornArc(x + 26, x + 36, G, 4);
l.enemy('dog', x + 42, G);
l.enemy('goose', x + 50, G);
l.cornLine(x + 38, x + 56, G, 2);
l.goal(x + 60, G);

l.save('level-2');
