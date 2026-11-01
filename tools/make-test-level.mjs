// Writes public/levels/test.json, a Tiled-format map for testing movement.
import { mkdirSync, writeFileSync } from 'node:fs';

const WIDTH = 120;
const HEIGHT = 20;
const TILE = 32;
const GROUND_ROW = 17;
const [GRASS, DIRT, ONE_WAY] = [1, 2, 3];

const tiles = new Array(WIDTH * HEIGHT).fill(0);
const set = (x, y, tile) => { tiles[y * WIDTH + x] = tile; };

const fillGround = (from, to, top = GROUND_ROW) => {
  for (let x = from; x <= to; x++) {
    set(x, top, GRASS);
    for (let y = top + 1; y < HEIGHT; y++) set(x, y, DIRT);
  }
};
const platform = (from, to, row) => {
  for (let x = from; x <= to; x++) set(x, row, ONE_WAY);
};

fillGround(0, 24);
fillGround(27, 44); // 2-tile gap: easy
fillGround(48, 62); // 3-tile gap
fillGround(50, 53, 15); // 2-tile step up
fillGround(67, 80); // 4-tile gap: needs a full run-up
fillGround(84, 119);

platform(10, 13, 14);
platform(15, 18, 11); // reachable only from the platform below
platform(32, 35, 13);
platform(70, 72, 14);
platform(75, 77, 12);
platform(90, 92, 14);
platform(95, 97, 11);

const map = {
  type: 'map',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  infinite: false,
  version: '1.10',
  tiledversion: '1.11.0',
  width: WIDTH,
  height: HEIGHT,
  tilewidth: TILE,
  tileheight: TILE,
  nextlayerid: 3,
  nextobjectid: 3,
  tilesets: [{
    firstgid: 1,
    name: 'placeholder',
    image: 'tiles.png',
    imagewidth: TILE * 8,
    imageheight: TILE,
    tilewidth: TILE,
    tileheight: TILE,
    tilecount: 8,
    columns: 8,
    margin: 0,
    spacing: 0,
  }],
  layers: [
    {
      id: 1, name: 'ground', type: 'tilelayer', visible: true, opacity: 1, x: 0, y: 0,
      width: WIDTH, height: HEIGHT, data: tiles,
    },
    {
      id: 2, name: 'objects', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0,
      draworder: 'topdown',
      objects: [
        { id: 1, name: 'spawn', type: '', point: true, x: 3 * TILE, y: GROUND_ROW * TILE, width: 0, height: 0, rotation: 0, visible: true },
        { id: 2, name: 'goal', type: '', point: true, x: 116 * TILE, y: GROUND_ROW * TILE, width: 0, height: 0, rotation: 0, visible: true },
      ],
    },
  ],
};

mkdirSync('public/levels', { recursive: true });
writeFileSync('public/levels/test.json', JSON.stringify(map));
