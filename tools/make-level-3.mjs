// Writes public/levels/level-3.json, The Road to Freedom. A forest of real pits,
// then the road with its vans, and a butcher chase in each half.
import { Level } from './level-lib.mjs';

const G = 20; // the normal ground row
const WIDTH = 480;
const l = new Level({ width: WIDTH, height: 26, tileset: 'road' });

function pit(length, fromRow) {
  const x = l.x;
  l.gap(length);
  l.cornArc(x - 1, x + length, fromRow, 2);
}

// One-way branches over a pit: each entry is [column, length, row].
function branches(list) {
  const start = l.x;
  let end = start;
  for (const [column, length, row] of list) {
    l.oneWay(start + column, start + column + length - 1, row);
    l.cornLine(start + column, start + column + length - 1, row);
    end = start + column + length + 3;
  }
  l.x = end;
}

// Spikes that stop the chicken but not the butcher, each with a corn hop over it.
function chaseSpikes(start, list) {
  for (const [column, length] of list) {
    l.hazard(start + column, start + column + length - 1, G);
    l.cornArc(start + column - 2, start + column + length + 1, G, 2);
  }
}

// The forest edge. A fox, and the first pits.
let x = l.run(24, G);
l.spawn(5, G);
l.cornLine(x + 9, x + 22, G, 2);
l.enemy('fox', x + 19, G);
pit(3, G);
x = l.run(5, G - 2);
l.cornLine(x + 1, x + 4, G - 2);
pit(3, G - 2);
x = l.run(5, G - 4);
l.cornLine(x + 1, x + 4, G - 4);
pit(3, G - 4);
x = l.run(9, G - 2);
l.enemy('fox', x + 5, G - 2);

// Up through the branches, with nothing below them.
branches([[3, 3, G - 4], [8, 3, G - 7], [13, 3, G - 5], [19, 3, G - 3], [25, 3, G - 5]]);
x = l.run(10, G - 3);
l.cornLine(x + 2, x + 8, G - 3, 2);

// Egg 1: a tall trunk with branches climbing past the top of the screen.
const trunk = x + 5;
l.block(trunk, trunk + 1, G - 12, G - 4);
l.oneWay(trunk - 3, trunk - 1, G - 6);
l.oneWay(trunk - 4, trunk - 2, G - 9);
l.corn(trunk - 2, G - 6);
l.corn(trunk - 3, G - 9);
l.egg(trunk + 1, G - 12);
// The trunk stands in the way, so step around it through a hole at the bottom.
l.carve(trunk, trunk + 1, G - 4, G - 4);

x = l.run(6, G);
pit(3, G);
x = l.run(4, G);
pit(3, G);
x = l.run(4, G - 2);
pit(3, G - 2);
x = l.run(12, G);
l.hazard(x + 3, x + 5, G);
l.cornArc(x + 1, x + 7, G, 2);
l.enemy('fox', x + 10, G);

// The first chase, out of the forest and onto the road.
x = l.run(92, G);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
chaseSpikes(x, [[20, 2], [28, 3], [37, 2], [44, 3], [53, 2], [60, 3], [68, 3], [75, 2]]);
l.cornLine(x + 12, x + 17, G);
l.chaseEnd(x + 84, G);

// The road. Vans run along it, and the signs above give room to dodge.
x = l.run(46, G);
l.checkpoint(x + 3, G);
l.cornLine(x + 6, x + 44, G, 2);
l.enemy('van', x + 30, G);
l.oneWay(x + 14, x + 18, G - 3);
l.oneWay(x + 26, x + 30, G - 3);
l.oneWay(x + 38, x + 42, G - 3);

// Mighty Crow, on top of a sign you have to climb to see.
l.oneWay(x + 32, x + 35, G - 6);
l.corn(x + 33, G - 6);
l.oneWay(x + 26, x + 29, G - 9);
l.powerup('mighty-crow', x + 27, G - 9);

// The bridge. Egg 2 waits on the ledge below it, and a ladder climbs back up.
x = l.run(8, G);
const bridge = l.x;
x = l.run(24, G);
l.carve(bridge, bridge + 2, G, G + 3);
l.carve(bridge, bridge + 23, G + 1, G + 3);
l.block(bridge + 24, bridge + 24, G + 1, G + 3);
l.cornLine(bridge + 3, bridge + 12, G + 4, 2);
l.enemy('fox', bridge + 16, G + 4);
l.egg(bridge + 22, G + 4);
l.carve(bridge + 21, bridge + 23, G, G);
l.oneWay(bridge + 21, bridge + 23, G + 1);
x = l.run(40, G);
l.enemy('van', x + 26, G);
l.cornLine(x + 3, x + 38, G, 2);
l.oneWay(x + 10, x + 14, G - 3);
l.oneWay(x + 22, x + 26, G - 3);
l.oneWay(x + 33, x + 36, G - 3);

// Egg 3: right at the top of a full jump, on the last sign.
l.oneWay(x + 34, x + 36, G - 7);
l.corn(x + 35, G - 3);
l.egg(x + 35, G - 7);

// Roadworks, with the wide run-up gap as the last test before the end.
x = l.run(8, G);
pit(3, G);
x = l.run(5, G);
pit(3, G);
x = l.run(10, G);
l.cornLine(x + 2, x + 8, G, 2);
pit(4, G);

// The final chase, hard all the way to the edge of the map.
x = l.run(WIDTH - l.x, G);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
chaseSpikes(x, [[20, 3], [27, 3], [34, 2], [40, 3], [47, 3], [54, 2], [60, 3], [67, 3], [74, 3]]);
l.cornLine(x + 12, x + 17, G);
l.chaseEnd(x + 84, G);
l.goal(x + 92, G);

l.save('level-3');
