// Writes public/levels/level-6.json, The Harbour. Docks over open water, crane
// platforms to ride across the widest stretches, crabs everywhere, and two butcher
// chases. The hardest level of World 2.
import { Level } from './level-lib.mjs';

const G = 18; // the quay
const WIDTH = 500;
const l = new Level({ width: WIDTH, height: 26, tileset: 'harbour' });

// Open water: falling in sends the chicken back.
function water(length, fromRow, toRow = fromRow) {
  const x = l.x;
  l.gap(length);
  if (length <= 4) l.cornArc(x - 1, x + length, Math.min(fromRow, toRow), 2);
}

function dock(length, row, cornStep = 3) {
  const x = l.run(length, row);
  l.cornLine(x + 1, x + length - 2, row, cornStep);
  return x;
}

// A crane carries a platform across water too wide to jump, from the near dock to
// the far one. Corn hangs over the middle of the crossing.
function crane(length, row, periodMs) {
  const x = l.x;
  l.gap(length);
  l.platform(x, row, 3, length - 4, 0, periodMs);
  l.cornLine(x + 2, x + length - 3, row - 2, 2);
}

// Spikes that stop the chicken but not the butcher, each with a corn hop over it.
function chaseSpikes(start, list) {
  for (const [column, length] of list) {
    l.hazard(start + column, start + column + length - 1, G);
    l.cornArc(start + column - 2, start + column + length + 1, G, 2);
  }
}

// The fish quay. Crabs, crates and the first patches of water.
let x = dock(20, G);
l.spawn(4, G);
l.box(12, G);
l.enemy('crab', 16, G);
water(2, G);
x = dock(8, G);
l.enemy('crab', x + 5, G);
water(3, G, G - 2);
x = dock(6, G - 2);
water(3, G - 2);
x = dock(10, G - 1);
l.box(x + 1, G - 1, 2, 1);
l.cornLine(x + 1, x + 2, G - 2);
l.enemy('cat', x + 8, G - 1);
water(3, G - 1, G);

// Egg 1: under the jetty. A ladder of boards leads back up.
x = dock(16, G);
l.enemy('crab', x + 4, G);
l.enemy('rat', x + 15, G);
const jetty = x + 10;
l.carve(jetty, jetty + 1, G, G);
l.carve(jetty, jetty + 5, G + 1, G + 3);
l.egg(jetty + 5, G + 4);
l.cornLine(jetty + 1, jetty + 4, G + 4);
l.oneWay(jetty + 2, jetty + 3, G + 1);
l.carve(jetty + 2, jetty + 3, G, G);

// The first crane, over the harbour mouth.
crane(10, G, 4200);
x = dock(8, G);
l.pigeon(x + 5, G);
water(3, G, G - 2);
x = dock(5, G - 2);
water(2, G - 2, G);

// The first chase, along the long pier. Nets and hooks stop the chicken but not
// the butcher.
x = dock(98, G, 4);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
chaseSpikes(x, [[18, 2], [24, 3], [31, 2], [37, 3], [43, 3], [50, 2], [56, 3], [62, 3], [69, 2], [75, 3], [81, 3]]);
l.cornLine(x + 12, x + 16, G);
l.chaseEnd(x + 90, G);

// The container yard. Stacks to climb, crabs on top, and a crane lift up to the
// top of the tallest stack, where egg 2 waits.
water(3, G);
x = dock(46, G);
l.box(x + 4, G, 3, 2);
l.enemy('crab', x + 5, G - 2);
l.box(x + 9, G, 4, 4);
l.cornLine(x + 9, x + 12, G - 4);
l.enemy('crab', x + 10, G - 4);
l.box(x + 16, G, 3, 2);
l.cornLine(x + 16, x + 18, G - 2);
l.pigeon(x + 21, G);
l.box(x + 25, G, 3, 3);
l.box(x + 33, G, 4, 9);
l.platform(x + 29, G - 1, 3, 0, -8, 5000);
l.cornLine(x + 33, x + 36, G - 9);
l.egg(x + 36, G - 9);
l.enemy('crab', x + 40, G);
l.enemy('crab', x + 44, G);
l.cornLine(x + 38, x + 44, G, 2);

// More water with a second crane, and a run-up leap at the end.
water(3, G, G - 1);
x = dock(7, G - 1);
l.enemy('crab', x + 4, G - 1);
water(3, G - 1, G);
x = dock(5, G);
l.enemy('crab', x + 3, G);
crane(11, G, 3800);
x = dock(10, G);
l.enemy('cat', x + 6, G);
l.pigeon(x + 2, G);
water(3, G, G - 2);
x = dock(6, G - 2);
l.box(x + 3, G - 2);
water(2, G - 2, G - 3);
x = dock(6, G - 3);
water(4, G - 3);
l.cornArc(x + 5, x + 10, G - 3, 2);

// Egg 3: a mast above the last dock, a full jump from the top of the crates.
x = dock(18, G - 3);
l.box(x + 6, G - 3, 2, 2);
l.oneWay(x + 10, x + 12, G - 9);
l.egg(x + 11, G - 9);
l.corn(x + 10, G - 9);
l.enemy('crab', x + 14, G - 3);
water(3, G - 3, G);

// The final chase down the fish market to the goal.
x = dock(WIDTH - l.x, G, 4);
l.checkpoint(x + 3, G);
l.chaseStart(x + 10, G);
chaseSpikes(x, [[18, 3], [25, 3], [32, 2], [38, 3], [45, 3], [52, 2], [58, 3], [65, 3], [72, 3], [79, 3]]);
l.cornLine(x + 12, x + 16, G);
l.chaseEnd(x + 88, G);
l.goal(x + 95, G);

l.save('level-6');
