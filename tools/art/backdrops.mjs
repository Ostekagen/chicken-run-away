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

// ===================================================== Update 1: World 2, the city

function triangle(frame, cx, top, half, height, color) {
  for (let row = 0; row < height; row++) {
    const width = Math.round((row / height) * half);
    frame.rect(cx - width, top + row, width * 2 + 1, 1, color);
  }
}

// A striped awning seen from the front: sloped stripes and a scalloped hem.
function stallAwning(frame, x, y, width, colors) {
  const [stripe, plain, hem] = colors;
  for (let px = 0; px < width; px++) {
    const on = Math.floor(px / 10) % 2 === 0;
    frame.rect(x + px, y, 1, 18, on ? stripe : plain);
    const scallop = Math.round(Math.sin(((px % 10) / 10) * Math.PI) * 4);
    frame.rect(x + px, y + 18, 1, scallop, on ? hem : plain);
  }
  frame.rect(x, y, width, 2, plain);
}

export const market = (() => {
  const frame = new Canvas(WIDTH, HEIGHT);
  bandedSky(frame, [0x84ccf2, 0x96d5f4, 0xaadef6, 0xbee7f6, 0xd2eff4], 34);
  for (const [x, y, size] of [[70, 40, 10], [300, 24, 8], [500, 54, 11]]) cloudSoft(frame, x, y, size);
  const random = seededRandom(31);
  // Tall townhouses in soft pastel colours.
  const walls = [0xf2cbc4, 0xf6e4b0, 0xcde9d3, 0xdcd3ee, 0xf6d6b8, 0xcbe0f0];
  let x = -10;
  let index = 0;
  while (x < WIDTH) {
    const width = 70 + Math.floor(random() * 30);
    const top = 90 + Math.floor(random() * 50);
    const wall = walls[index++ % walls.length];
    frame.rect(x, top, width, HEIGHT - top, wall);
    frame.rect(x, top, 3, HEIGHT - top, 0xffffff);
    frame.rect(x + width - 3, top, 3, HEIGHT - top, 0xd8c8c0);
    // Gabled or flat roof.
    if (index % 2) triangle(frame, x + Math.floor(width / 2), top - 26, Math.floor(width / 2) + 2, 27, 0xcf9282);
    else {
      frame.rect(x - 2, top - 6, width + 4, 6, 0xcf9282);
      frame.rect(x - 2, top - 6, width + 4, 2, 0xe0aa9c);
    }
    for (let wy = top + 14; wy < 230; wy += 34) {
      for (let wx = x + 12; wx < x + width - 20; wx += 24) {
        frame.rect(wx - 2, wy - 2, 16, 22, 0xffffff);
        frame.rect(wx, wy, 12, 18, 0xa9d8ee);
        frame.rect(wx, wy, 12, 4, 0xcdeaf6);
        frame.rect(wx + 5, wy, 2, 18, 0xffffff);
        frame.rect(wx - 2, wy + 20, 16, 2, 0xd0c4bc);
      }
    }
    x += width + 2;
  }
  // Bunting strung across the street.
  const flags = [0xf28a84, 0xffd86a, 0x8fd38a, 0x86b8f0, 0xc69ae8];
  for (let start = 0; start < WIDTH; start += 160) {
    for (let i = 0; i < 160; i++) {
      const sag = Math.round(Math.sin((i / 160) * Math.PI) * 18);
      frame.set(start + i, 150 + sag, 0x8a7a8a);
      if (i % 14 === 4) triangle(frame, start + i + 3, 151 + sag, 4, 9, flags[(i / 14 + start / 160) % 5 | 0]);
    }
  }
  // Market stalls along the street.
  const awnings = [[0xf28a84, 0xfff6ee, 0xd86e68], [0x8fd38a, 0xfff6ee, 0x6fb86a], [0x86b8f0, 0xfff6ee, 0x6a9cd6], [0xffc86a, 0xfff6ee, 0xe0a84a]];
  const produce = [0xf28a84, 0xffd86a, 0x9ad87a, 0xffa860, 0xc69ae8];
  for (let i = 0; i < 5; i++) {
    const sx = 10 + i * 130;
    stallAwning(frame, sx, 214, 110, awnings[i % awnings.length]);
    frame.rect(sx + 4, 236, 3, 60, 0xb89a80);
    frame.rect(sx + 103, 236, 3, 60, 0xb89a80);
    frame.rect(sx, 270, 110, 26, 0xd8b48a);
    frame.rect(sx, 270, 110, 3, 0xe8caa4);
    for (let p = 0; p < 9; p++) circle(frame, sx + 10 + p * 11, 266, 5, produce[(p + i) % produce.length]);
  }
  // Pale cobbled street.
  frame.rect(0, 296, WIDTH, HEIGHT - 296, 0xd8ccbc);
  for (let row = 0; row < 8; row++) {
    for (let cx = (row % 2) * 8; cx < WIDTH; cx += 16) frame.rect(cx, 300 + row * 8, 12, 5, 0xe4dacc);
  }
  return frame;
})();

export const rooftops = (() => {
  const frame = new Canvas(WIDTH, HEIGHT);
  // Late afternoon, the sun going down: the chase is on.
  bandedSky(frame, [0x8a9ad8, 0xa2a6dc, 0xbcaedc, 0xd8b4d4, 0xf0bcc0, 0xf8caa8, 0xfcd8a4], 30);
  circle(frame, 470, 170, 40, 0xffe2b0);
  circle(frame, 470, 170, 32, 0xffcf86);
  for (const [x, y, size] of [[90, 50, 9], [300, 80, 7], [560, 40, 8]]) cloudSoft(frame, x, y, size);
  const random = seededRandom(47);
  const skyline = (base, minH, maxH, color, windows, seed) => {
    const r = seededRandom(seed);
    let x = -5;
    while (x < WIDTH) {
      const width = 24 + Math.floor(r() * 40);
      const top = base - minH - Math.floor(r() * (maxH - minH));
      frame.rect(x, top, width, HEIGHT - top, color);
      const roll = r();
      if (roll < 0.15) triangle(frame, x + Math.floor(width / 2), top - 30, 6, 30, color); // spire
      else if (roll < 0.3) circle(frame, x + Math.floor(width / 2), top, Math.floor(width / 3), color); // dome
      else if (roll < 0.5) frame.rect(x + 4, top - 10, 6, 10, color); // chimney stack
      if (windows) {
        for (let wy = top + 6; wy < HEIGHT; wy += 10) {
          for (let wx = x + 4; wx < x + width - 5; wx += 8) {
            if (r() < 0.35) frame.rect(wx, wy, 3, 4, windows);
          }
        }
      }
      x += width + Math.floor(r() * 6);
    }
  };
  skyline(250, 40, 120, 0xc3b2d6, null, 3);
  skyline(270, 30, 90, 0xa797c4, 0xf6e0b4, 8);
  // A clock tower standing above the rest.
  frame.rect(300, 92, 40, 200, 0x8f80b0);
  triangle(frame, 320, 50, 24, 44, 0x8f80b0);
  circle(frame, 320, 116, 12, 0xfff0cc);
  frame.rect(319, 106, 2, 10, 0x8f80b0);
  frame.rect(320, 115, 7, 2, 0x8f80b0);
  // Near rooftops: chimneys, a water tower and washing lines.
  frame.rect(0, 286, WIDTH, HEIGHT - 286, 0x8a7aa8);
  for (let x = 0; x < WIDTH; x += 8) frame.rect(x, 282 + ((x / 8) % 2) * 2, 8, 4, 0x8a7aa8);
  for (let i = 0; i < 9; i++) {
    const cx = 30 + i * 70 + Math.floor(random() * 20);
    const h = 18 + Math.floor(random() * 22);
    frame.rect(cx, 286 - h, 14, h, 0x8a7aa8);
    frame.rect(cx - 2, 286 - h, 18, 4, 0x9a8ab6);
    frame.rect(cx + 3, 280 - h, 3, 6, 0x9a8ab6);
    frame.rect(cx + 8, 282 - h, 3, 4, 0x9a8ab6);
  }
  // Water tower.
  frame.rect(520, 200, 50, 46, 0x8a7aa8);
  triangle(frame, 545, 176, 30, 26, 0x8a7aa8);
  for (const lx of [524, 562]) frame.rect(lx, 246, 4, 40, 0x8a7aa8);
  for (let y = 206; y < 246; y += 10) frame.rect(520, y, 50, 1, 0x9a8ab6);
  // A washing line with laundry.
  const laundry = [0xf6d6e0, 0xd6e8f6, 0xfff2c8, 0xd6f0d6];
  for (let i = 0; i < 180; i++) {
    const sag = Math.round(Math.sin((i / 180) * Math.PI) * 12);
    frame.set(100 + i, 244 + sag, 0x6e6090);
    if (i % 30 === 10) frame.rect(100 + i, 245 + sag, 12, 14, laundry[(i / 30) % 4 | 0]);
  }
  return frame;
})();

export const harbour = (() => {
  const frame = new Canvas(WIDTH, HEIGHT);
  bandedSky(frame, [0x7cc8f0, 0x8fd2f4, 0xa4dcf6, 0xbae6f8, 0xd0eef8], 36);
  for (const [x, y, size] of [[120, 40, 11], [380, 30, 8], [540, 70, 10]]) cloudSoft(frame, x, y, size);
  // Gulls.
  for (const [x, y] of [[230, 70], [250, 84], [460, 110], [90, 120]]) {
    for (let i = 0; i < 5; i++) {
      frame.set(x - i, y - Math.round(Math.sqrt(i) * 2), 0x6a7a8e);
      frame.set(x + i, y - Math.round(Math.sqrt(i) * 2), 0x6a7a8e);
    }
  }
  // Far headland with a lighthouse.
  hills(frame, 196, 6, 1, 0xa9cfae, 0xbfe0bf);
  frame.rect(560, 136, 16, 60, 0xffffff);
  for (const y of [148, 168, 188]) frame.rect(560, y, 16, 8, 0xf28a84);
  frame.rect(557, 126, 22, 10, 0x8fa0b8);
  frame.rect(562, 128, 12, 6, 0xfff0a0);
  triangle(frame, 568, 114, 12, 13, 0xf28a84);
  // The sea, in soft bands with glints.
  const sea = [0x8fd0e6, 0x82c8e0, 0x74bedb, 0x68b4d4];
  for (let y = 206; y < HEIGHT; y++) frame.rect(0, y, WIDTH, 1, sea[Math.min(3, Math.floor((y - 206) / 36))]);
  const random = seededRandom(61);
  for (let i = 0; i < 90; i++) {
    const y = 210 + Math.floor(random() * 140);
    frame.rect(Math.floor(random() * WIDTH), y, 4 + Math.floor(random() * 8), 1, 0xc6eaf4);
  }
  // A container ship on the horizon.
  frame.rect(380, 186, 120, 16, 0x8a9ab4);
  for (let row = 0; row < 6; row++) frame.rect(380 + row, 196 + row, 120 - row * 2, 1, 0x7a8aa4);
  const boxes = [0xf2a28a, 0x9ac8e8, 0xf6d68a, 0xa8dca0];
  for (let i = 0; i < 8; i++) frame.rect(392 + i * 12, 172 + (i % 3 === 1 ? -8 : 0), 11, 14 + (i % 3 === 1 ? 8 : 0), boxes[i % 4]);
  frame.rect(480, 160, 12, 26, 0xf6f6fb);
  // A sailing boat.
  triangle(frame, 150, 200, 22, 46, 0xffffff);
  frame.rect(150, 196, 2, 54, 0x9a8a7a);
  for (let row = 0; row < 10; row++) frame.rect(118 + row, 250 + row, 64 - row * 2, 1, row < 3 ? 0xf28a84 : 0xd86e68);
  // A little fishing boat.
  for (let row = 0; row < 12; row++) frame.rect(240 + row, 262 + row, 70 - row * 2, 1, row < 3 ? 0x86b8f0 : 0x6a9cd6);
  frame.rect(270, 244, 24, 18, 0xffffff);
  frame.rect(274, 248, 7, 6, 0xa9d8ee);
  frame.rect(284, 248, 7, 6, 0xa9d8ee);
  frame.rect(260, 226, 2, 36, 0x9a8a7a);
  // Harbour cranes in soft orange, cables down to their hooks.
  const crane = (x, height, reach) => {
    const top = 290 - height;
    frame.rect(x, top, 6, height, 0xeaa676);
    frame.rect(x + 30, top, 6, height, 0xd9946a);
    for (let y = top + 10; y < 290; y += 24) {
      for (let i = 0; i < 30; i++) frame.set(x + 3 + i, y + Math.round(i * 0.6), 0xeaa676);
    }
    frame.rect(x - 10, top - 10, 56, 12, 0xf0b484);
    frame.rect(x - 10, top - 10, 56, 3, 0xf8caa4);
    frame.rect(x + 36, top - 6, reach, 6, 0xf0b484);
    frame.rect(x - 30, top - 6, 24, 8, 0xd9946a);
    frame.rect(x + 10, top - 36, 4, 26, 0xeaa676);
    for (let i = 0; i < reach; i += 2) frame.set(x + 12 + i, top - 36 + Math.round((i / reach) * 30), 0x9a7a6a);
    frame.rect(x + 30 + reach, top, 1, 60, 0x7a6a6a);
    frame.rect(x + 27 + reach, top + 60, 7, 3, 0x7a6a6a);
  };
  crane(30, 170, 60);
  crane(420, 130, 50);
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
