// Small pixel canvas and PNG encoder shared by the art scripts. No dependencies.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';

// One palette for every sprite, so the whole game shares its colours.
// In a grid, each character is one pixel and '.' is transparent.
export const PALETTE = {
  K: 0x2a2035, // outline
  W: 0xffffff, w: 0xf3e9dc, s: 0xc8c4d4, S: 0x9a97ad, // whites and cool greys
  R: 0xe8433f, r: 0xa82a3a, P: 0xff9aa2, p: 0xe8788a, // reds and pinks
  O: 0xffa726, o: 0xd9741a, Y: 0xffd83d, y: 0xe0a52a, // oranges and yellows
  N: 0x8d5a34, n: 0x5f3a24, T: 0xc08a52, t: 0xa4703f, // browns
  F: 0xf7c09a, f: 0xdc9670, // skin
  G: 0x5cb85c, g: 0x3a8c48, L: 0xa6e05a, // greens
  U: 0x3f7fd6, u: 0x2b4f9e, C: 0x6fd0e8, c: 0x3aa0c0, // blues
  A: 0x8b93a5, a: 0x5a6175, M: 0xd7deea, D: 0x3d3a4a, // metal and charcoal
  V: 0x8e5ad6, v: 0x5f3aa0, // purples
  X: 0xe9722a, x: 0xb84f1c, // fox orange
  Z: 0xffc933, z: 0xd9962a, Q: 0xfff0a0, // gold
};

const TRANSPARENT = -1;

export class Canvas {
  constructor(width, height, fill = TRANSPARENT) {
    this.width = width;
    this.height = height;
    this.pixels = new Int32Array(width * height).fill(fill);
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return TRANSPARENT;
    return this.pixels[y * this.width + x];
  }

  set(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.pixels[y * this.width + x] = color;
  }

  rect(x, y, width, height, color) {
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) this.set(px, py, color);
    }
    return this;
  }

  // Filled ellipse centred on (cx, cy). Half-pixel centres give even widths.
  ellipse(cx, cy, rx, ry, color) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0001) this.set(x, y, color);
      }
    }
    return this;
  }

  // Thick line between two points, as a row of discs.
  line(x0, y0, x1, y1, radius, color) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, radius, color);
    }
    return this;
  }

  // Draws a character grid. '_' erases, which lets a part cut into what is below it.
  stamp(grid, x = 0, y = 0, { flip = false } = {}) {
    const width = Math.max(...grid.map((row) => row.length));
    grid.forEach((row, rowIndex) => {
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '.') continue;
        const px = flip ? x + width - 1 - i : x + i;
        if (char === '_') {
          this.set(px, y + rowIndex, TRANSPARENT);
          continue;
        }
        const color = PALETTE[char];
        if (color === undefined) throw new Error(`Unknown colour "${char}" in grid row: ${row}`);
        this.set(px, y + rowIndex, color);
      }
    });
    return this;
  }

  blit(source, x = 0, y = 0, scale = 1) {
    for (let sy = 0; sy < source.height; sy++) {
      for (let sx = 0; sx < source.width; sx++) {
        const color = source.get(sx, sy);
        if (color === TRANSPARENT) continue;
        this.rect(x + sx * scale, y + sy * scale, scale, scale, color);
      }
    }
    return this;
  }

  // Rings every opaque shape with a one-pixel line, so sprites read on any backdrop.
  outline(color = PALETTE.K) {
    const original = this.pixels.slice();
    const opaque = (x, y) =>
      x >= 0 && y >= 0 && x < this.width && y < this.height && original[y * this.width + x] !== TRANSPARENT;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (opaque(x, y)) continue;
        if (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1)) this.set(x, y, color);
      }
    }
    return this;
  }

  toPng() {
    const rows = Buffer.alloc((this.width * 4 + 1) * this.height);
    let offset = 0;
    for (let y = 0; y < this.height; y++) {
      rows[offset++] = 0; // no row filter
      for (let x = 0; x < this.width; x++) {
        const color = this.get(x, y);
        rows[offset++] = color === TRANSPARENT ? 0 : (color >> 16) & 255;
        rows[offset++] = color === TRANSPARENT ? 0 : (color >> 8) & 255;
        rows[offset++] = color === TRANSPARENT ? 0 : color & 255;
        rows[offset++] = color === TRANSPARENT ? 0 : 255;
      }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.width, 0);
    header.writeUInt32BE(this.height, 4);
    header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', header),
      pngChunk('IDAT', deflateSync(rows, { level: 9 })),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

// Lays frames out in one row, which is what Phaser's spritesheet loader expects.
export function hstrip(frames) {
  const { width, height } = frames[0];
  const strip = new Canvas(width * frames.length, height);
  frames.forEach((frame, index) => strip.blit(frame, index * width, 0));
  return strip;
}

export function writeOutput(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

// Seeded random numbers, so re-running the scripts gives identical files.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
