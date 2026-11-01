// Shared helper for the level scripts: builds a map and writes it as Tiled JSON.
// Columns and rows are in tiles. A "row" for an object is the tile row it stands
// on, so feet touch the top of that row.
import { mkdirSync, writeFileSync } from 'node:fs';

const SIZE = 32;
const [TOP, FILL, ONE_WAY, HAZARD] = [1, 2, 3, 4];
const DECORATION = [5, 6, 7, 8];

export class Level {
  constructor({ width, height, tileset }) {
    this.width = width;
    this.height = height;
    this.tileset = tileset;
    this.tiles = new Array(width * height).fill(0);
    this.objects = [];
    this.x = 0; // where run() and gap() continue from
  }

  set(x, y, tile) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) throw new Error(`Tile outside the map: ${x}, ${y}`);
    this.tiles[y * this.width + x] = tile;
  }
  get(x, y) { return this.tiles[y * this.width + x]; }

  // Solid ground with its surface at `row`, filled down to the bottom of the map.
  ground(from, to, row) { this.block(from, to, row, this.height - 1); }

  block(from, to, top, bottom) {
    for (let x = from; x <= to; x++) for (let y = top; y <= bottom; y++) this.set(x, y, FILL);
  }

  carve(from, to, top, bottom) {
    for (let x = from; x <= to; x++) for (let y = top; y <= bottom; y++) this.set(x, y, 0);
  }

  // Lays ground left to right and returns the first column of the new stretch.
  run(length, row) {
    const start = this.x;
    this.ground(start, start + length - 1, row);
    this.x += length;
    return start;
  }

  gap(length) { this.x += length; }

  oneWay(from, to, row) {
    for (let x = from; x <= to; x++) this.set(x, row, ONE_WAY);
  }

  // Spikes standing on the surface `row`.
  hazard(from, to, row) {
    for (let x = from; x <= to; x++) this.set(x, row - 1, HAZARD);
  }

  point(type, x, row, properties, name = '') {
    this.objects.push({ name, type, x: (x + 0.5) * SIZE, y: row * SIZE, properties });
  }

  spawn(x, row) { this.point('', x, row, undefined, 'spawn'); }
  goal(x, row) { this.point('', x, row, undefined, 'goal'); }
  checkpoint(x, row) { this.point('checkpoint', x, row); }
  egg(x, row) { this.point('golden-egg', x, row); }
  boss(x, row) { this.point('boss', x, row); }
  enemy(kind, x, row) { this.point('enemy', x, row, { kind }); }
  powerup(kind, x, row) { this.point('powerup', x, row, { kind }); }

  // Corn hovers a little above the surface `row`.
  corn(x, row) {
    this.objects.push({ name: '', type: 'corn', x: (x + 0.5) * SIZE, y: row * SIZE - 8 });
  }

  cornLine(from, to, row, step = 1) {
    for (let x = from; x <= to; x += step) this.corn(x, row);
  }

  // A hop of corn from one column to another, `lift` tiles above `row` at the middle.
  cornArc(from, to, row, lift = 2) {
    for (let x = from; x <= to; x++) {
      const t = (x - from) / (to - from);
      this.corn(x, row - lift * 4 * t * (1 - t));
    }
  }

  // x and y are the bottom-centre, as for every object in CONTRACTS.md, not Tiled's
  // usual top-left. Tall and wide, so a jump cannot pass over it.
  chaseZone(type, x, row) {
    const [width, height] = [6, 6];
    this.objects.push({
      name: '', type, x: (x + 0.5) * SIZE, y: row * SIZE, width: width * SIZE, height: height * SIZE,
    });
  }

  chaseStart(x, row) { this.chaseZone('chase-start', x, row); }
  chaseEnd(x, row) { this.chaseZone('chase-end', x, row); }

  // Grass, tile tops and scattered decoration, once all terrain is in place.
  finish() {
    const solid = (x, y) => [TOP, FILL].includes(this.get(x, y));
    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.get(x, y) === FILL && !solid(x, y - 1)) this.set(x, y, TOP);
      }
    }
    for (let y = 1; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pattern = (x * 7 + y * 13) % 11;
        if (this.get(x, y) === TOP && !this.get(x, y - 1) && pattern < DECORATION.length) {
          this.set(x, y - 1, DECORATION[pattern]);
        }
      }
    }
  }

  save(name) {
    this.finish();
    const objects = this.objects.map(({ name: objectName, type, x, y, width = 0, height = 0, properties }, index) => ({
      id: index + 1,
      name: objectName,
      type,
      ...(width ? {} : { point: true }),
      x,
      y,
      width,
      height,
      rotation: 0,
      visible: true,
      ...(properties && {
        properties: Object.entries(properties).map(([key, value]) => (
          { name: key, type: typeof value === 'number' ? 'int' : 'string', value }
        )),
      }),
    }));
    const map = {
      type: 'map',
      orientation: 'orthogonal',
      renderorder: 'right-down',
      infinite: false,
      version: '1.10',
      tiledversion: '1.11.0',
      width: this.width,
      height: this.height,
      tilewidth: SIZE,
      tileheight: SIZE,
      nextlayerid: 3,
      nextobjectid: objects.length + 1,
      tilesets: [{
        firstgid: 1,
        name: this.tileset,
        image: `../assets/tiles/tiles-${this.tileset}.png`,
        imagewidth: SIZE * 8,
        imageheight: SIZE,
        tilewidth: SIZE,
        tileheight: SIZE,
        tilecount: 8,
        columns: 8,
        margin: 0,
        spacing: 0,
      }],
      layers: [
        {
          id: 1, name: 'ground', type: 'tilelayer', visible: true, opacity: 1, x: 0, y: 0,
          width: this.width, height: this.height, data: this.tiles,
        },
        {
          id: 2, name: 'objects', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0,
          draworder: 'topdown', objects,
        },
      ],
    };
    mkdirSync('public/levels', { recursive: true });
    writeFileSync(`public/levels/${name}.json`, JSON.stringify(map));
  }
}
