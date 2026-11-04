// Writes public/levels/level-4.json, The Market. A busy street of stalls and
// crates, where bouncy awnings throw the chicken up onto the roofs, with pigeons,
// cats and one butcher chase through the stalls.
import { Level } from './level-lib.mjs';

const G = 20; // the street
const WIDTH = 420;
const l = new Level({ width: WIDTH, height: 26, tileset: 'market' });

function pit(length, fromRow, toRow = fromRow) {
  const x = l.x;
  l.gap(length);
  l.cornArc(x - 1, x + length, Math.min(fromRow, toRow), 2);
}

// A stall the street runs under: a one-way board with a bouncy awning on top.
function stall(x, row, power) {
  l.oneWay(x - 1, x + 1, row);
  l.bounce(x, row, power);
}

// Spikes that stop the chicken but not the butcher, each with a corn hop over it.
function chaseSpikes(start, list) {
  for (const [column, length] of list) {
    l.hazard(start + column, start + column + length - 1, G);
    l.cornArc(start + column - 2, start + column + length + 1, G, 2);
  }
}

// The street. Crates to hop, and the first stall throws the chicken onto a roof of
// boards with corn on it.
let x = l.run(46, G);
l.spawn(4, G);
l.cornLine(7, 11, G);
l.box(13, G);
l.cornArc(12, 14, G, 2);
l.box(18, G, 2, 2);
l.cornLine(18, 19, G - 2);
stall(26, G - 3);
l.oneWay(21, 33, G - 9);
l.cornLine(21, 33, G - 9);
l.pigeon(31, G);
l.cornLine(29, 36, G, 2);
l.enemy('cat', 40, G);
l.cornLine(38, 44, G, 2);

// The market hall: too tall to jump, so an awning in front throws the chicken up.
// Another on the roof reaches a ledge with egg 1.
x = l.run(32, G);
l.bounce(x + 6, G);
const hall = x + 10;
l.box(hall, G, 22, 6);
l.cornLine(hall + 1, hall + 20, G - 6, 2);
l.pigeon(hall + 8, G - 6);
l.bounce(hall + 17, G - 6);
l.oneWay(hall + 10, hall + 13, G - 13);
l.corn(hall + 13, G - 13);
l.egg(hall + 11, G - 13);

// Back down to crates and drains.
x = l.run(10, G);
l.cornLine(x + 2, x + 8, G, 2);
l.enemy('rat', x + 6, G);
pit(3, G);
x = l.run(6, G - 1);
l.box(x + 3, G - 1);
l.cornArc(x + 2, x + 4, G - 1, 2);
pit(3, G - 1);
x = l.run(4, G - 3);
l.cornLine(x, x + 3, G - 3);
pit(3, G - 3, G);
x = l.run(14, G);
l.enemy('cat', x + 9, G);
l.box(x + 4, G, 2, 1);
l.box(x + 5, G - 1, 1, 1);
l.cornArc(x + 3, x + 7, G - 1, 2);
stall(x + 12, G - 3);
l.oneWay(x + 8, x + 16, G - 9);
l.cornLine(x + 8, x + 16, G - 9, 2);
l.powerup('egg-throw', x + 14, G - 9);
pit(3, G);
x = l.run(8, G - 2);
l.pigeon(x + 5, G - 2);
l.cornLine(x + 1, x + 7, G - 2, 2);
pit(2, G - 2, G);

// The first chase, between the stalls. The boards above are a way to dodge.
x = l.run(98, G);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
chaseSpikes(x, [[20, 2], [27, 3], [35, 2], [42, 3], [50, 2], [57, 3], [65, 2], [72, 3], [80, 2]]);
l.cornLine(x + 12, x + 17, G);
for (const board of [24, 46, 68]) {
  l.oneWay(x + board, x + board + 4, G - 3);
  l.cornLine(x + board, x + board + 4, G - 3, 2);
}
l.chaseEnd(x + 88, G);

// Over the rooftops: an awning throws the chicken up a wall, then roofs with gaps
// and pigeons. Egg 2 hides in a chimney gap under the second roof.
x = l.run(8, G);
l.bounce(x + 4, G);
x = l.run(14, G - 7);
l.cornLine(x + 2, x + 12, G - 7, 2);
l.pigeon(x + 9, G - 7);
pit(3, G - 7);
x = l.run(12, G - 8);
l.cornLine(x + 1, x + 11, G - 8, 2);
l.enemy('cat', x + 8, G - 8);
pit(3, G - 8, G - 6);
x = l.run(10, G - 6);
l.cornLine(x + 1, x + 9, G - 6, 2);
pit(2, G - 6);
x = l.run(12, G - 7);
l.pigeon(x + 6, G - 7);
l.cornLine(x + 1, x + 11, G - 7, 2);
// Egg 2: a shaft down from the roof into a loft, with a one-way board back up.
l.carve(x + 9, x + 10, G - 7, G - 3);
l.oneWay(x + 9, x + 9, G - 5);
l.egg(x + 10, G - 2);
pit(3, G - 7, G - 4);
x = l.run(8, G - 4);
l.cornLine(x + 1, x + 7, G - 4, 2);
x = l.run(6, G - 2);
l.cornLine(x + 1, x + 5, G - 2);

// The last street, with the second checkpoint, a dog and a cat, and the goal at the
// market gate. Egg 3 sits above the last stall.
x = l.run(70, G);
l.checkpoint(x + 3, G);
l.cornLine(x + 6, x + 14, G, 2);
l.enemy('dog', x + 14, G);
l.box(x + 18, G, 2, 2);
l.cornLine(x + 18, x + 19, G - 2);
l.box(x + 20, G);
l.enemy('rat', x + 26, G);
l.cornLine(x + 22, x + 30, G, 2);
stall(x + 34, G - 3, 820);
l.oneWay(x + 31, x + 33, G - 12);
l.egg(x + 32, G - 12);
l.corn(x + 31, G - 12);
l.enemy('cat', x + 40, G);
l.box(x + 44, G, 1, 2);
l.box(x + 45, G, 1, 1);
l.cornArc(x + 42, x + 47, G - 1, 3);
l.pigeon(x + 52, G);
l.cornLine(x + 49, x + 60, G, 2);
l.goal(x + 64, G);
x = l.run(WIDTH - l.x, G);

l.save('level-4');
