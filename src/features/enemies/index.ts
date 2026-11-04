// Enemies, chases and the bosses: registers "enemy", "chase-start", "chase-end", "boss" and
// "scooter-boss". GameScene adds the butcher's van at the left edge of moving levels.
import Phaser from 'phaser';
import { objectProperty, registerLevelObject } from '../../levelObjects';
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

registerLevelObject('enemy', (scene, object) => {
  addEnemy(scene, objectProperty<EnemyKind>(object, 'kind'), object.x ?? 0, object.y ?? 0);
});
registerLevelObject('chase-start', (scene, object) => {
  addChaseStart(scene, rectangleOf(object), objectProperty<number>(object, 'speed'));
});
registerLevelObject('chase-end', (scene, object) => addChaseEnd(scene, rectangleOf(object)));
registerLevelObject('boss', (scene, object) => {
  new Boss(scene, object.x ?? 0, object.y ?? 0);
});
registerLevelObject('scooter-boss', (scene, object) => {
  new ScooterBoss(scene, object.x ?? 0, object.y ?? 0);
});

export { addVanChaser };
