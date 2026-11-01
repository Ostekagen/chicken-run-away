import Phaser from 'phaser';
import { ensureTexture } from '../../art';
import { ENEMIES } from '../../config';
import type { GameScene } from '../../scenes/GameScene';
import { clearCleavers, throwCleaver } from './cleavers';
import { isSolidTile, levelOver, listen, perRun, showDizzy, surfaceBelow } from './shared';

type Rectangle = Phaser.Geom.Rectangle;

const BODY = { width: 24, height: 50, offsetX: 8, offsetY: 6 };
const FEET_BELOW_CENTRE = 28;
const FLAT_ON_FACE_DROP_PX = 8;
const SKID_PX = 130;
const SKID_MS = 450;
const LIE_FLAT_MS = 900;
const WALK_BACK_PX = 420;
const WALK_BACK_MS = 1300;

interface Chase {
  start: Rectangle;
  speed: number;
  finished: boolean;
}

class ButcherChase {
  private readonly butcher: Phaser.Physics.Arcade.Sprite;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly chases: Chase[] = [];
  private readonly ends: Rectangle[] = [];
  private active: Chase | null = null;
  private resuming: Chase | null = null;
  private resumeAt = 0;
  private direction = 1;
  private entering = false;
  private stunnedUntil = 0;
  private stopDizzy?: () => void;
  private phasingUntil = 0;
  private nextJumpAt = 0;
  private nextThrowAt = 0;
  private stuckCheckAt = 0;
  private stuckCheckX = 0;

  constructor(private readonly scene: GameScene) {
    const { color, width, height } = ENEMIES.butcher;
    this.butcher = scene.physics.add.sprite(0, 0, ensureTexture(scene, 'butcher', color, width, height));
    this.body = this.butcher.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(BODY.width, BODY.height).setOffset(BODY.offsetX, BODY.offsetY);
    this.butcher.disableBody(true, true);

    scene.physics.add.collider(this.butcher, scene.ground, undefined, () => scene.time.now >= this.phasingUntil);
    scene.physics.add.overlap(scene.chicken, this.butcher, () => this.caught());

    listen(scene, Phaser.Scenes.Events.UPDATE, (time: number) => this.update(time));
    listen(scene, 'chicken:crow', () => this.stun());
    listen(scene, 'chicken:respawned', () => this.onRespawned());
  }

  addStart(start: Rectangle, speed = ENEMIES.butcher.speed) {
    this.chases.push({ start, speed, finished: false });
  }

  addEnd(end: Rectangle) {
    this.ends.push(end);
  }

  private update(time: number) {
    if (levelOver(this.scene)) return;
    if (this.active) {
      if (this.chickenIn(this.ends)) this.giveUp(this.active);
      else this.run(time, this.active);
      return;
    }
    const entered = this.chases.find((chase) => !chase.finished && this.chickenIn([chase.start]));
    const resumed = this.resuming && time >= this.resumeAt ? this.resuming : null;
    if (entered ?? resumed) this.begin(time, (entered ?? resumed) as Chase);
  }

  private chickenIn(rectangles: Rectangle[]) {
    const { x, y } = this.scene.chicken;
    return rectangles.some((rectangle) => rectangle.contains(x, y));
  }

  private begin(time: number, chase: Chase) {
    const { firstThrowMs, stuckCheckMs } = ENEMIES.butcher;
    this.hide();
    this.direction = this.directionOf(chase);
    this.active = chase;
    this.entering = true;
    this.nextThrowAt = time + firstThrowMs;
    this.stuckCheckAt = time + stuckCheckMs;
    this.butcher.enableBody(true, this.leashX(), this.scene.chicken.y, true, true);
    this.stuckCheckX = this.butcher.x;
    this.leash(time);
  }

  // A chase runs towards its nearest end.
  private directionOf(chase: Chase) {
    const end = this.nearestEnd(chase);
    return end && end.centerX < chase.start.centerX ? -1 : 1;
  }

  private nearestEnd(chase: Chase) {
    const distance = (end: Rectangle) => Math.abs(end.centerX - chase.start.centerX);
    return [...this.ends].sort((a, b) => distance(a) - distance(b))[0] as Rectangle | undefined;
  }

  private run(time: number, chase: Chase) {
    const { chicken } = this.scene;
    const { butcher } = this;
    const { entranceGapX, entranceSpeed, pitLeapSpeed, jumpCooldownMs } = ENEMIES.butcher;
    this.updatePhasing(time);

    if (time < this.stunnedUntil) {
      butcher.setVelocityX(0);
      return;
    }
    if (butcher.y > this.scene.ground.tilemap.heightInPixels) {
      butcher.setVelocityY(-pitLeapSpeed);
      this.nextJumpAt = time + jumpCooldownMs;
    }
    if (this.isBehindLeash()) this.leash(time);

    const gap = chicken.x - butcher.x;
    if (Math.abs(gap) < entranceGapX) this.entering = false;
    const speed = this.entering ? entranceSpeed : chase.speed;
    const heading = Math.sign(gap) || this.direction;
    butcher.setVelocityX(heading * speed);
    butcher.setFlipX(heading < 0);

    if (this.body.blocked.down && time >= this.nextJumpAt && this.shouldJump(heading, gap)) {
      butcher.setVelocityY(-ENEMIES.butcher.jumpSpeed);
      this.nextJumpAt = time + jumpCooldownMs;
    }
    this.checkStuck(time, gap);
    this.throwAtChicken(time, gap);
  }

  private shouldJump(heading: number, gap: number) {
    const { scene, body } = this;
    const aheadX = this.butcher.x + heading * (body.halfWidth + 16);
    const wall = heading < 0 ? body.blocked.left : body.blocked.right;
    const obstacle = isSolidTile(scene, aheadX, body.bottom - 8);
    const ledge = surfaceBelow(scene, aheadX, body.bottom + 1) === null;
    const chickenAbove = scene.chicken.y < body.top && Math.abs(gap) < 120;
    return wall || obstacle || ledge || chickenAbove;
  }

  // If jumping does not get him past something, he phases up through it.
  private checkStuck(time: number, gap: number) {
    const { stuckCheckMs, stuckMinMovePx, phaseMs } = ENEMIES.butcher;
    if (time < this.stuckCheckAt) return;
    const stuck = Math.abs(this.butcher.x - this.stuckCheckX) < stuckMinMovePx && Math.abs(gap) > 48;
    if (stuck) this.phasingUntil = time + phaseMs;
    this.stuckCheckAt = time + stuckCheckMs;
    this.stuckCheckX = this.butcher.x;
  }

  private updatePhasing(time: number) {
    const inside = this.isInsideGround();
    if (inside) this.phasingUntil = time + 100;
    const phasing = time < this.phasingUntil;
    this.body.setAllowGravity(!phasing);
    if (phasing) this.butcher.setVelocityY(inside ? -ENEMIES.butcher.phaseRiseSpeed : 0);
  }

  private isInsideGround() {
    const { left, right, top, bottom } = this.body;
    const inset = 3;
    const { tileWidth } = this.scene.ground.tilemap;
    for (let x = left + inset; x < right; x += tileWidth) {
      for (let y = top + inset; y < bottom; y += tileWidth) {
        if (isSolidTile(this.scene, x, y)) return true;
      }
    }
    return isSolidTile(this.scene, right - inset, bottom - inset);
  }

  private throwAtChicken(time: number, gap: number) {
    const { chicken } = this.scene;
    const { butcher } = this;
    const { throwRangeX, throwEveryMs, throwFlightMs, throwLead } = ENEMIES.butcher;
    if (time < this.nextThrowAt || Math.abs(gap) > throwRangeX) return;
    this.nextThrowAt = time + throwEveryMs;
    const lead = (chicken.body.velocity.x * throwFlightMs * throwLead) / 1000;
    throwCleaver(this.scene, butcher.x, butcher.y - 16, chicken.x + lead, chicken.y, throwFlightMs);
  }

  // The nearest he may be kept, just out of sight behind the chicken.
  private leashX() {
    const { worldView } = this.scene.cameras.main;
    const { leashGapX, leashScreenMargin } = ENEMIES.butcher;
    const { x } = this.scene.chicken;
    return this.direction > 0
      ? Math.min(worldView.left - leashScreenMargin, x - leashGapX)
      : Math.max(worldView.right + leashScreenMargin, x + leashGapX);
  }

  private isBehindLeash() {
    return (this.butcher.x - this.leashX()) * this.direction < 0;
  }

  private leash(time: number) {
    const x = this.leashX();
    const surface = surfaceBelow(this.scene, x, this.scene.chicken.y - 96);
    this.butcher.setX(x);
    if (surface === null) {
      this.phasingUntil = time + 100;
      this.butcher.setY(this.scene.chicken.y);
    } else if (this.body.blocked.down) {
      this.butcher.setY(surface - FEET_BELOW_CENTRE);
    }
  }

  private stun() {
    if (!this.active) return;
    this.stunnedUntil = this.scene.time.now + ENEMIES.stunMs;
    this.stopDizzy?.();
    this.stopDizzy = showDizzy(this.scene, this.butcher, ENEMIES.stunMs);
  }

  private caught() {
    const { scene } = this;
    if (this.active && scene.time.now >= this.stunnedUntil && !levelOver(scene)) scene.catchChicken();
  }

  private onRespawned() {
    const chase = this.active ?? this.resuming;
    if (!chase) return;
    this.hide();
    this.butcher.setPosition(chase.start.left, chase.start.bottom - FEET_BELOW_CENTRE);
    clearCleavers(this.scene);
    // Past the start already, so a checkpoint inside the chase does not skip it.
    if (this.isChickenInsideChase(chase)) {
      this.resuming = chase;
      this.resumeAt = this.scene.time.now + ENEMIES.butcher.resumeChaseMs;
    }
  }

  private isChickenInsideChase(chase: Chase) {
    const { x } = this.scene.chicken;
    const direction = this.directionOf(chase);
    const end = this.nearestEnd(chase);
    return (x - chase.start.centerX) * direction > 0 && (!end || (end.centerX - x) * direction > 0);
  }

  private hide() {
    this.scene.tweens.killTweensOf(this.butcher);
    this.stopDizzy?.();
    this.active = null;
    this.resuming = null;
    this.stunnedUntil = 0;
    this.phasingUntil = 0;
    this.butcher.setAngle(0).setAlpha(1);
    this.butcher.disableBody(true, true);
  }

  // Trips on his apron, lies flat for a moment, then trudges back the way he came.
  private giveUp(chase: Chase) {
    const { scene, butcher, direction } = this;
    const { worldView } = scene.cameras.main;
    chase.finished = true;
    this.active = null;
    this.stopDizzy?.();
    this.stunnedUntil = 0;

    const edge = direction > 0 ? worldView.left : worldView.right;
    const x = (butcher.x - edge) * direction < 0 ? edge : butcher.x;
    const surface = surfaceBelow(scene, x, scene.chicken.y - 96) ?? butcher.y + FEET_BELOW_CENTRE;
    butcher.setPosition(x, surface - FEET_BELOW_CENTRE).setFlipX(direction < 0);
    butcher.disableBody();

    scene.tweens.chain({
      targets: butcher,
      tweens: [
        {
          x: x + direction * SKID_PX,
          y: butcher.y + FLAT_ON_FACE_DROP_PX,
          angle: direction * 90,
          duration: SKID_MS,
          ease: 'Quad.easeOut',
          onComplete: () => showDizzy(scene, butcher, LIE_FLAT_MS),
        },
        {
          angle: 0,
          y: butcher.y,
          delay: LIE_FLAT_MS,
          duration: 200,
          onComplete: () => butcher.setFlipX(direction > 0),
        },
        {
          x: x + direction * (SKID_PX - WALK_BACK_PX),
          alpha: 0,
          duration: WALK_BACK_MS,
          onComplete: () => this.hide(),
        },
      ],
    });
  }
}

const chaseOf = perRun((scene) => new ButcherChase(scene));

export function addChaseStart(scene: GameScene, start: Rectangle, speed?: number) {
  chaseOf(scene).addStart(start, speed);
}

export function addChaseEnd(scene: GameScene, end: Rectangle) {
  chaseOf(scene).addEnd(end);
}
