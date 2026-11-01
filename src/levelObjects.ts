import Phaser from 'phaser';
import type { GameScene } from './scenes/GameScene';

type TiledObject = Phaser.Types.Tilemaps.TiledObject;
export type LevelObjectFactory = (scene: GameScene, object: TiledObject) => void;

const factories = new Map<string, LevelObjectFactory>();

// Features call this at import time to claim a Tiled object type.
export function registerLevelObject(type: string, factory: LevelObjectFactory) {
  factories.set(type, factory);
}

export function createLevelObjects(scene: GameScene, map: Phaser.Tilemaps.Tilemap) {
  for (const object of map.getObjectLayer('objects')?.objects ?? []) {
    if (object.type) factories.get(object.type)?.(scene, object);
  }
}

export function findLevelObject(map: Phaser.Tilemaps.Tilemap, name: string) {
  const object = map.findObject('objects', (o) => o.name === name);
  if (!object) throw new Error(`Level is missing the "${name}" object`);
  return object;
}

export function objectProperty<T>(object: TiledObject, name: string): T | undefined {
  const properties = object.properties as { name: string; value: T }[] | undefined;
  return properties?.find((p) => p.name === name)?.value;
}
