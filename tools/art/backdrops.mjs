// 640x360 backdrops. Colours stay soft so the outlined sprites stand out in front of them.
import { Canvas, seededRandom } from './lib.mjs';

const WIDTH = 640;
const HEIGHT = 360;

// Sky in flat bands with a dithered row between them, the classic 16-bit look.
function bandedSky(frame, colors, bandHeight) {
  for (let y = 0; y < HEIGHT; y++) {
    const band = Math.min(Math.floor(y / bandHeight), colors.length - 1);
    const next = Math.min(band + 1, colors.length - 1);
    const nearEdge = y % bandHeight >= bandHeight - 4;
    for (let x = 0; x < WIDTH; x++) {
      frame.set(x, y, nearEdge && (x + y) % 2 === 0 ? colors[next] : colors[band]);
    }
  }
}

function circle(frame, cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) frame.set(cx + x, cy + y, color);
    }
  }
}

// Fills everything below a rolling line. Waves repeat cleanly across the screen.
function hills(frame, base, height, wave, color, top) {
  for (let x = 0; x < WIDTH; x++) {
    const phase = (x / WIDTH) * Math.PI * 2;
    const y = Math.round(base + Math.sin(phase * wave + height) * height + Math.sin(phase * wave * 2.5) * height * 0.3);
    frame.rect(x, y, 1, HEIGHT - y, color);
    frame.rect(x, y, 1, 2, top);
  }
}

function barn(frame, x, y) {
  const wall = 0xd9786a;
  const dark = 0xbb6258;
  frame.rect(x, y, 70, 46, wall);
  for (let plank = 0; plank < 70; plank += 7) frame.rect(x + plank, y, 1, 46, dark);
  for (let row = 0; row < 22; row++) {
    frame.rect(x - 4 + row * 2, y - row, 78 - row * 4, 1, row < 2 ? 0x7f8aa0 : 0x98a3b8);
  }
  frame.rect(x + 25, y + 18, 20, 28, 0xf4e6d4);
  frame.rect(x + 27, y + 20, 16, 26, dark);
  frame.rect(x + 28, y - 12, 14, 9, 0xf4e6d4);
  frame.rect(x + 29, y - 11, 12, 7, 0x6c5a68);
  // Silo.
  frame.rect(x + 74, y - 22, 22, 68, 0xcfd6e2);
  frame.rect(x + 74, y - 22, 5, 68, 0xe4e9f1);
  frame.rect(x + 91, y - 22, 5, 68, 0xb4bdcc);
  circle(frame, x + 85, y - 22, 11, 0xa3adc0);
  frame.rect(x + 74, y - 22, 22, 12, 0xcfd6e2);
  frame.rect(x + 74, y - 22, 5, 12, 0xe4e9f1);
  frame.rect(x + 91, y - 22, 5, 12, 0xb4bdcc);
}

function windmill(frame, x, y) {
  frame.rect(x - 2, y, 4, 60, 0xa3adc0);
  for (let row = 0; row < 60; row += 10) frame.rect(x - 6 - row / 8, y + row, 12 + row / 4, 1, 0xa3adc0);
  for (let t = 0; t < 22; t++) {
    frame.rect(x + t, y - 1, 2, 3, 0xe9eef5);
    frame.rect(x - t - 1, y - 1, 2, 3, 0xe9eef5);
    frame.rect(x - 1, y + t, 3, 2, 0xe9eef5);
    frame.rect(x - 1, y - t - 1, 3, 2, 0xe9eef5);
  }
  circle(frame, x, y, 3, 0x8b93a5);
}

export const farm = (() => {
  const frame = new Canvas(WIDTH, HEIGHT);
  bandedSky(frame, [0x7cc8f0, 0x8fd3f4, 0xa4dcf6, 0xb9e6f6, 0xcdeef5, 0xe2f5ee], 34);
  circle(frame, 540, 62, 30, 0xfff4b8);
  circle(frame, 540, 62, 24, 0xffe680);
  const random = seededRandom(5);
  for (const [x, y, size] of [[60, 60, 13], [230, 36, 9], [360, 86, 11], [470, 130, 7], [150, 124, 7]]) {
    cloudSoft(frame, x, y, size);
  }
  hills(frame, 214, 14, 2, 0xa8dcae, 0xbfe8c0);
  windmill(frame, 120, 150);
  barn(frame, 400, 212);
  hills(frame, 256, 9, 3, 0x93d08e, 0xaee0a4);
  // Tufts on the near hill.
  for (let i = 0; i < 70; i++) {
    frame.rect(Math.floor(random() * WIDTH), 276 + Math.floor(random() * 80), 3, 1, 0x82c47e);
  }
  return frame;
})();

function cloudSoft(frame, x, y, size) {
  const color = 0xffffff;
  const shade = 0xdcefff;
  const lumps = [[0, 0, 1], [1.1, -0.45, 1.3], [2.3, 0, 1.05], [3.2, 0.15, 0.75]];
  for (const [dx, dy, r] of lumps) circle(frame, Math.round(x + dx * size), Math.round(y + dy * size + 2), Math.round(r * size), shade);
  for (const [dx, dy, r] of lumps) circle(frame, Math.round(x + dx * size), Math.round(y + dy * size), Math.round(r * size), color);
}

export const road = (() => {
  const frame = new Canvas(WIDTH, HEIGHT);
  bandedSky(frame, [0x76b6e8, 0x8fc6ec, 0xb1d6ec, 0xd8e0d8, 0xf6e2bc, 0xfcd29a, 0xfcc088], 34);
  circle(frame, 110, 196, 44, 0xffe6a8);
  circle(frame, 110, 196, 36, 0xffd27a);
  for (const [x, y, size] of [[300, 50, 11], [80, 40, 8], [500, 90, 10], [420, 24, 6]]) cloudSoft(frame, x, y, size);
  // Mountains, with snow on the peaks: freedom is out there.
  const peaks = [[60, 90], [190, 130], [320, 100], [470, 150], [600, 110]];
  for (const [peak, height] of peaks) {
    const top = 250 - height;
    for (let row = 0; row < height + 20; row++) {
      const half = Math.round(row * 1.15);
      frame.rect(peak - half, top + row, half, 1, 0xa79fc7);
      frame.rect(peak, top + row, half, 1, 0x938bb5);
      if (row < 14 + (peak % 7)) frame.rect(peak - half, top + row, half * 2, 1, row % 2 ? 0xf6f2fb : 0xffffff);
    }
  }
  hills(frame, 252, 8, 2, 0xa6c99e, 0xbedbae);
  // Far treeline.
  const random = seededRandom(9);
  for (let x = 0; x < WIDTH; x += 14 + Math.floor(random() * 12)) {
    const radius = 6 + Math.floor(random() * 7);
    circle(frame, x, 256 + Math.floor(random() * 6), radius, 0x8db48e);
  }
  // Telegraph poles walking along the road, wires repeating across the screen.
  for (let pole = 40; pole < WIDTH; pole += 160) {
    frame.rect(pole, 170, 3, 106, 0x7a6a78);
    frame.rect(pole - 12, 178, 27, 3, 0x7a6a78);
    for (let wire = 0; wire < 160; wire++) {
      const sag = Math.round(Math.sin((wire / 160) * Math.PI) * 10);
      frame.set(pole - 10 + wire, 181 + sag, 0x6d6072);
      frame.set(pole + 12 + wire, 181 + sag, 0x6d6072);
    }
  }
  hills(frame, 276, 5, 3, 0x8fb88a, 0xa8cc9e);
  return frame;
})();

export const slaughterhouse = (() => {
  const frame = new Canvas(WIDTH, HEIGHT, 0xcfe6df);
  // Wall of big pale tiles.
  for (let y = 0; y < HEIGHT; y += 24) {
    frame.rect(0, y, WIDTH, 1, 0xbcd8d0);
    for (let x = (y / 24) % 2 ? 24 : 0; x < WIDTH; x += 48) frame.rect(x, y, 1, 24, 0xbcd8d0);
  }
  // Windows with the outside world in them: the way out.
  for (const x of [60, 230, 400, 570]) {
    frame.rect(x - 4, 48, 88 - 20, 74, 0x8fb0ac);
    frame.rect(x, 52, 60, 66, 0x9fdcf5);
    frame.rect(x, 96, 60, 22, 0xa6e0a0);
    frame.rect(x, 94, 60, 2, 0x88cc84);
    frame.rect(x + 8, 62, 18, 5, 0xffffff);
    frame.rect(x + 14, 58, 12, 5, 0xffffff);
    frame.rect(x + 29, 52, 2, 66, 0x8fb0ac);
    frame.rect(x, 84, 60, 2, 0x8fb0ac);
  }
  // Pipes along the ceiling.
  frame.rect(0, 14, WIDTH, 12, 0xa9bcc8);
  frame.rect(0, 16, WIDTH, 3, 0xc9d8e0);
  frame.rect(0, 24, WIDTH, 2, 0x8fa2b0);
  for (let x = 30; x < WIDTH; x += 120) frame.rect(x, 12, 6, 16, 0x8fa2b0);
  // Overhead rail with empty hooks.
  frame.rect(0, 136, WIDTH, 5, 0x9fb2bc);
  frame.rect(0, 136, WIDTH, 1, 0xbccbd4);
  for (let x = 24; x < WIDTH; x += 80) {
    frame.rect(x, 141, 2, 16, 0x9fb2bc);
    frame.rect(x, 157, 2, 8, 0x9fb2bc);
    frame.rect(x + 2, 164, 7, 2, 0x9fb2bc);
    frame.rect(x + 8, 158, 2, 7, 0x9fb2bc);
  }
  // Lower wall band, darker so the floor sits on something solid.
  frame.rect(0, 216, WIDTH, HEIGHT - 216, 0xb7d6cc);
  frame.rect(0, 216, WIDTH, 4, 0x9dc3b8);
  for (let y = 244; y < HEIGHT; y += 24) frame.rect(0, y, WIDTH, 1, 0xa6c9be);
  for (let x = 0; x < WIDTH; x += 48) frame.rect(x, 220, 1, HEIGHT - 220, 0xa6c9be);
  return frame;
})();
