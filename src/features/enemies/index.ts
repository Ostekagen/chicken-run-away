// Enemies, chases and the bosses: registers "enemy", "chase-start", "chase-end", "boss" and
// "scooter-boss", and shows the butcher's van at the left edge of moving levels.
import Phaser from 'phaser';
import { LevelObjectFactory, objectProperty, registerLevelObject } from '../../levelObjects';
import type { GameScene } from '../../scenes/GameScene';
import { Boss } from './Boss';
import { addChaseEnd, addChaseStart } from './ButcherChase';
import type { EnemyKind } from './Enemy';
import { addEnemy } from './foes';
import { ScooterBoss } from './ScooterBoss';
import { addVanChaser } from './VanChaser';

type TiledObject = Phaser.Types.Tilemaps.TiledObject;

// Objects give their bottom-centre as x and y.
function rectangleOf(object: TiledObject) {
  const { x = 0, y = 0, width = 0, height = 0 } = object;
  return new Phaser.Geom.Rectangle(x - width / 2, y - height, width, height);
}

const hookedScenes = new WeakSet<GameScene>();

// The van in moving levels needs no map object. Any object of ours shows it straight away,
// and the scene is then watched so that every later level it builds gets it too.
function watchForMovingLevels(scene: GameScene) {
  addVanChaser(scene);
  if (hookedScenes.has(scene)) return;
  hookedScenes.add(scene);
  scene.events.on(Phaser.Scenes.Events.CREATE, () => addVanChaser(scene));
}

function register(type: string, factory: LevelObjectFactory) {
  registerLevelObject(type, (scene, object) => {
    factory(scene, object);
    watchForMovingLevels(scene);
  });
}

register('enemy', (scene, object) => {
  addEnemy(scene, objectProperty<EnemyKind>(object, 'kind'), object.x ?? 0, object.y ?? 0);
});
register('chase-start', (scene, object) => {
  addChaseStart(scene, rectangleOf(object), objectProperty<number>(object, 'speed'));
});
register('chase-end', (scene, object) => addChaseEnd(scene, rectangleOf(object)));
register('boss', (scene, object) => {
  new Boss(scene, object.x ?? 0, object.y ?? 0);
});
register('scooter-boss', (scene, object) => {
  new ScooterBoss(scene, object.x ?? 0, object.y ?? 0);
});

export { addVanChaser };
