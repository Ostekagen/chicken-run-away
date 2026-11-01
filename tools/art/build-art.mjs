// Writes every sprite, tileset and backdrop into public/assets, plus a contact sheet for
// review at docs/art-contact-sheet.png. Run with: node tools/art/build-art.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as backdrops from './backdrops.mjs';
import { dogFrames, foxFrames, gooseFrames, ratFrames, vanFrames, workerFrames } from './enemies.mjs';
import { butcherFrames, chickenFrames } from './heroes.mjs';
import { checkpointFrames, cleaver, corn, egg, goal, goldenEgg, powerups } from './items.mjs';
import { Canvas, PALETTE, hstrip, writeOutput } from './lib.mjs';
import * as tilesets from './tilesets.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = join(ROOT, 'public', 'assets');

const sheets = {
  chicken: chickenFrames,
  butcher: butcherFrames,
  worker: workerFrames,
  rat: ratFrames,
  dog: dogFrames,
  fox: foxFrames,
  goose: gooseFrames,
  van: vanFrames,
  checkpoint: checkpointFrames,
};

const images = {
  cleaver,
  egg,
  corn,
  'golden-egg': goldenEgg,
  goal,
  ...Object.fromEntries(Object.entries(powerups).map(([kind, image]) => [`powerup-${kind}`, image])),
};

for (const [key, frames] of Object.entries(sheets)) {
  writeOutput(join(ASSETS, 'sprites', `${key}.png`), hstrip(frames).toPng());
}
for (const [key, image] of Object.entries(images)) {
  writeOutput(join(ASSETS, 'sprites', `${key}.png`), image.toPng());
}
for (const theme of ['slaughterhouse', 'farm', 'road']) {
  writeOutput(join(ASSETS, 'tiles', `tiles-${theme}.png`), tilesets[theme].toPng());
  writeOutput(join(ASSETS, 'backdrops', `bg-${theme}.png`), backdrops[theme].toPng());
}

// ---------------------------------------------------------------- contact sheet
function contactSheet() {
  const scale = 4;
  const margin = 12;
  const width = 1500;
  const rows = [];
  const add = (label, canvases, drawScale = scale) => rows.push({ label, canvases, drawScale });

  for (const [key, frames] of Object.entries(sheets)) add(`${key} ${frames.length} frames`, frames);
  add('items', Object.values(images).filter((image) => image.width <= 20));
  add('power-ups', Object.values(powerups));
  add('goal golden-egg', [goal, goldenEgg]);
  for (const theme of ['slaughterhouse', 'farm', 'road']) add(`tiles-${theme}`, [tilesets[theme]], 3);
  add('backdrops', [backdrops.slaughterhouse, backdrops.farm], 1);
  add('', [backdrops.road, levelMockup()], 1);

  let height = margin;
  for (const row of rows) {
    const rowWidth = row.canvases.reduce((sum, c) => sum + (c.width + 3) * row.drawScale, 0);
    row.lines = Math.ceil(rowWidth / (width - margin * 2));
    height += 14 + row.lines * (row.canvases[0].height + 3) * row.drawScale;
  }

  const sheet = new Canvas(width, height, 0x7fb8d8);
  let y = margin;
  for (const row of rows) {
    text(sheet, row.label, margin, y, 2);
    y += 14;
    let x = margin;
    const step = (row.canvases[0].height + 3) * row.drawScale;
    for (const canvas of row.canvases) {
      if (x + canvas.width * row.drawScale > width - margin) {
        x = margin;
        y += step;
      }
      sheet.blit(canvas, x, y, row.drawScale);
      x += (canvas.width + 3) * row.drawScale;
    }
    y += step;
  }
  return sheet;
}

// Shows how a tileset sits on its backdrop, without needing the game.
function levelMockup() {
  const frame = new Canvas(640, 360).blit(backdrops.farm);
  const tileAt = (index, x, y) => {
    const tile = new Canvas(32, 32);
    for (let py = 0; py < 32; py++) {
      for (let px = 0; px < 32; px++) tile.set(px, py, tilesets.farm.get(index * 32 + px, py));
    }
    frame.blit(tile, x, y);
  };
  for (let x = 0; x < 640; x += 32) {
    tileAt(0, x, 296);
    tileAt(1, x, 328);
  }
  for (let x = 160; x < 288; x += 32) tileAt(2, x, 200);
  tileAt(3, 400, 264);
  tileAt(4, 64, 264);
  tileAt(5, 480, 264);
  tileAt(6, 512, 264);
  frame.blit(chickenFrames[1], 200, 268);
  frame.blit(butcherFrames[0], 96, 240);
  frame.blit(corn, 208, 176);
  return frame;
}

const FONT = {
  a: '010101111101101', b: '110101110101110', c: '011100100100011', d: '110101101101110', e: '111100110100111',
  f: '111100110100100', g: '011100101101011', h: '101101111101101', i: '111010010010111', j: '001001001101010',
  k: '101101110101101', l: '100100100100111', m: '101111111101101', n: '110101101101101', o: '010101101101010',
  p: '110101110100100', q: '010101101110011', r: '110101110101101', s: '011100010001110', t: '111010010010010',
  u: '101101101101111', v: '101101101101010', w: '101101111111101', x: '101101010101101', y: '101101010010010',
  z: '111001010100111', '-': '000000111000000', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111',
  3: '110001110001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110',
};

function text(canvas, string, x, y, scale) {
  for (const char of string) {
    const glyph = FONT[char];
    if (glyph) {
      for (let i = 0; i < 15; i++) {
        if (glyph[i] === '1') canvas.rect(x + (i % 3) * scale, y + Math.floor(i / 3) * scale, scale, scale, PALETTE.K);
      }
    }
    x += 4 * scale;
  }
}

writeOutput(join(ROOT, 'docs', 'art-contact-sheet.png'), contactSheet().toPng());
