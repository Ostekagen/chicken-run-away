// Writes public/levels/level-5.json, Runaway Cart. A moving level: the screen
// scrolls on its own over the rooftops, with the butcher's van at its left edge, and
// speeds up for the last stretch. Everything goes right, and every wall can be
// climbed without stepping back.
import { Level } from './level-lib.mjs';

const G = 14; // the usual roof height
const WIDTH = 500;
const FAST_FROM = 372; // where the screen speeds up
const l = new Level({ width: WIDTH, height: 22, tileset: 'rooftops' });
l.properties.scrollSpeed = 88;

function roof(length, row, cornStep = 3) {
  const x = l.run(length, row);
  l.cornLine(x + 1, x + length - 2, row, cornStep);
  return x;
}

function gap(length, fromRow, toRow = fromRow) {
  const x = l.x;
  l.gap(length);
  if (length > 2) l.cornArc(x - 1, x + length, Math.min(fromRow, toRow), 2);
}

// A chimney standing on the roof `row`, with a corn on top.
function chimney(x, row, height = 2) {
  l.box(x, row, 1, height);
  l.corn(x, row - height);
}

// Off the cart and onto the first roof. The spawn leaves room for the screen.
let x = roof(18, G);
l.spawn(9, G);
gap(2, G);
x = roof(8, G - 1);
chimney(x + 4, G - 1);
gap(3, G - 1, G - 2);
x = roof(10, G - 2);
l.pigeon(x + 7, G - 2);
gap(2, G - 2, G);
x = roof(6, G);
gap(3, G, G + 1);
x = roof(14, G + 1);
chimney(x + 4, G + 1);
chimney(x + 9, G + 1, 3);

// Egg 1: a ledge down inside a gap, with a hop up the far side.
const ledgeGap = l.x;
gap(3, G + 1, G - 1);
l.oneWay(ledgeGap + 1, ledgeGap + 1, G + 3);
l.egg(ledgeGap + 1, G + 3);
x = roof(9, G - 1);
l.pigeon(x + 5, G - 1);
gap(2, G - 1, G - 3);
x = roof(7, G - 3);
gap(3, G - 3, G - 1);
x = roof(12, G - 1);
chimney(x + 3, G - 1, 2);
chimney(x + 4, G - 1, 3);
l.enemy('cat', x + 9, G - 1);
gap(2, G - 1, G + 1);
x = roof(8, G + 1);
gap(3, G + 1, G);
x = roof(16, G);
l.checkpoint(x + 4, G);
chimney(x + 9, G, 2);
chimney(x + 13, G, 2);

// Washing lines and an awning. The awning throws the chicken up to egg 2 on the
// high line, which runs on ahead and drops back to the roofs.
gap(2, G, G - 2);
x = roof(10, G - 2);
l.bounce(x + 5, G - 2);
l.oneWay(x + 8, x + 18, G - 9);
l.cornLine(x + 8, x + 17, G - 9);
l.egg(x + 18, G - 9);
gap(3, G - 2, G - 1);
x = roof(9, G - 1);
l.pigeon(x + 6, G - 1);
gap(3, G - 1, G - 3);
x = roof(6, G - 3);
gap(2, G - 3);
x = roof(10, G - 3);
chimney(x + 5, G - 3, 3);
gap(3, G - 3, G);
x = roof(12, G);
l.enemy('cat', x + 8, G);
gap(2, G, G - 2);
x = roof(5, G - 2);
gap(3, G - 2, G - 2);
x = roof(5, G - 2);
gap(3, G - 2, G);
x = roof(14, G);
chimney(x + 5, G, 2);
chimney(x + 6, G, 3);
chimney(x + 7, G, 2);
l.pigeon(x + 11, G);
gap(2, G, G + 1);
x = roof(8, G + 1);
gap(3, G + 1, G - 1);
x = roof(10, G - 1);
gap(2, G - 1, G - 2);

// The middle: the second checkpoint, then stairs of roofs and the last pigeons
// before the speed-up.
x = roof(16, G - 2);
l.checkpoint(x + 4, G - 2);
chimney(x + 10, G - 2, 2);
gap(3, G - 2, G - 1);
x = roof(6, G - 1);
gap(2, G - 1, G - 4);
x = roof(6, G - 4);
l.pigeon(x + 3, G - 4);
gap(2, G - 4, G - 2);
x = roof(8, G - 2);
gap(3, G - 2, G);
x = roof(12, G);
chimney(x + 3, G, 3);
l.enemy('cat', x + 8, G);
gap(3, G, G - 1);
x = roof(9, G - 1);
gap(2, G - 1, G + 1);
x = roof(10, G + 1);
l.scrollSpeed(FAST_FROM, G, 126);
chimney(x + 5, G + 1, 2);
gap(3, G + 1, G);

// Faster now. Plainer roofs, but less time to think.
x = roof(12, G);
gap(2, G, G - 1);
x = roof(8, G - 1);
l.pigeon(x + 5, G - 1);
gap(3, G - 1);
x = roof(10, G - 1);
chimney(x + 4, G - 1, 2);
// Egg 3: on top of a tall chimney, only a full jump from the roof reaches it.
chimney(x + 8, G - 1, 3);
l.egg(x + 8, G - 4);
gap(2, G - 1, G - 2);
x = roof(8, G - 2);
gap(3, G - 2, G);
x = roof(10, G);
l.pigeon(x + 6, G);
gap(2, G, G - 1);
x = roof(6, G - 1);
gap(3, G - 1, G - 1);
x = roof(8, G - 1);
chimney(x + 4, G - 1, 2);
gap(2, G - 1, G);
x = roof(WIDTH - l.x, G, 1);
l.goal(WIDTH - 6, G);

l.save('level-5');
