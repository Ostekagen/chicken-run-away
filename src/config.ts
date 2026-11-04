export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 32;

// Every tileset is 8 tiles in one row, with these meanings. Tiles 5-8 are decoration.
export const TILE = { top: 1, fill: 2, oneWay: 3, hazard: 4 };
export const TILESET_COLUMNS = 8;

// Tuning values for power-ups. Speeds are pixels per second.
export const POWERUPS = {
  // Tint on the chicken while held, and the colour of placeholder pick-ups.
  colors: {
    'egg-throw': 0xff9eb5,
    'flappy-wings': 0x7fd0ff,
    'feather-armor': 0xc39bff,
    'corn-rush': 0xffe14d,
    'mighty-crow': 0xff8a4c,
  },
  // Holding one of these, a hit costs the power-up instead of a heart.
  absorbsHit: ['egg-throw', 'flappy-wings', 'feather-armor'],
  eggSpeed: 340,
  eggArcSpeed: 160,
  eggGravity: 400,
  eggCooldownMs: 350,
  eggLifeMs: 2000,
  flapSpeed: 460,
  glideFallSpeed: 70,
  rushSpeed: 320,
  rushMs: 6000,
  crowRingRadius: 380,
  crowRingMs: 500,
};

export type PowerUpKind = keyof typeof POWERUPS.colors;

// Tuning values for how the chicken moves. Speeds are pixels per second.
export const CHICKEN = {
  gravity: 1200,
  maxFallSpeed: 620,
  runSpeed: 200,
  groundAcceleration: 1400,
  groundDrag: 1800,
  airAcceleration: 900,
  jumpSpeed: 560,
  // Releasing jump early multiplies upward speed by this, for short hops.
  jumpCutFactor: 0.45,
  // Jump still works this long after running off a ledge.
  coyoteTimeMs: 90,
  // A jump pressed this long before landing still fires on landing.
  jumpBufferMs: 110,
  maxHearts: 3,
  // After a hit, further hits are ignored for this long.
  invulnerableMs: 1200,
};

// Tuning values for enemies, the butcher and the boss.
export const ENEMIES = {
  stompBounce: 380,
  // A falling chicken stomps when its feet are this far down the enemy, as a fraction of its height.
  stompReach: 0.6,
  stompReachMinPx: 12,
  stunMs: 4000,
  kinds: {
    worker: { color: 0x7f8fa6, width: 28, height: 40, speed: 45 },
    rat: { color: 0x6d6875, width: 28, height: 16, speed: 80 },
    dog: { color: 0xa9713f, width: 40, height: 24, speed: 50 },
    goose: { color: 0xf1f1e6, width: 28, height: 32, speed: 40 },
    fox: { color: 0xe07b39, width: 40, height: 24, speed: 60 },
    van: { color: 0xd9d9e3, width: 96, height: 48, speed: 400 },
    pigeon: { color: 0x9aa3b5, width: 28, height: 20, speed: 55 },
    cat: { color: 0x4a4a5a, width: 32, height: 24, speed: 45 },
    crab: { color: 0xe0553d, width: 32, height: 20, speed: 45 },
  },
  // Enemies notice the chicken when it is this close, sideways and up or down.
  noticeX: 180,
  noticeY: 56,
  dog: { tellMs: 350, chargeSpeed: 185, loseInterestX: 280 },
  goose: { burstSpeed: 230, burstMs: 450, restMs: 750 },
  fox: { hopSpeed: 430, hopRunSpeed: 110, hopEveryMs: 1500, hopLandingX: 80 },
  van: { noticeX: 420, noticeY: 96, warnMs: 800, pauseMs: 2800, warnColor: 0xff4136 },
  // Pigeons place their feet where the map point is, and cruise around it.
  pigeon: {
    rangeX: 90,
    waveY: 8,
    waveMs: 1400,
    // Swoops at a chicken below it that is this close sideways, and this far down.
    swoopNoticeX: 110,
    swoopMinDropY: 36,
    swoopMaxDropY: 170,
    tellMs: 350,
    swoopMs: 1200,
    swoopCooldownMs: 1800,
  },
  // Waits crouched, wiggles for tellMs, then pounces in an arc of up to maxPounceX.
  cat: { noticeX: 150, noticeY: 72, tellMs: 450, pounceSpeed: 400, minPounceX: 48, maxPounceX: 170, restMs: 1100 },
  // The butcher's van at the left edge of a moving level. Visual only.
  vanChaser: { bobPx: 2, bobMs: 140, honkNearPx: 90, honkEveryMs: 1800, puffEveryMs: 220, followYPerSecond: 5 },
  scooterBoss: {
    color: 0xc0392b,
    width: 64,
    height: 56,
    hitsToDefeat: 6,
    wakeDistanceX: 280,
    // Crate piles stand this far either side of the middle of the arena.
    pileOffsetX: 256,
    crateColor: 0xb07d48,
    // A phase lasts two hits. Every ride ends crashed into a crate pile: the opening.
    phases: [
      { speed: 130, throws: 2, flightMs: 1150, dazedMs: 3400 },
      { speed: 175, throws: 3, flightMs: 1050, dazedMs: 3000 },
      { speed: 220, throws: 4, flightMs: 950, dazedMs: 2600 },
    ],
    // No sausage is thrown at a chicken closer than this, so it can always be dodged.
    throwMinGapX: 100,
    crashBounceX: 28,
    recoverMs: 800,
    safeAfterStompMs: 1000,
    stompPushSpeed: 220,
    firstDropMs: 1500,
    dropEveryMs: 9000,
    dropOffsetX: 120,
    // On defeat he tips into the harbour this far from the middle, on the side with more room.
    harbourOffsetX: 420,
    tipOverMs: 1300,
    tipArcHeight: 150,
    sinkMs: 900,
    finishDelayMs: 1800,
    splashColor: 0x5bc0f8,
  },
  sausage: { color: 0xd2694a, size: 16, hitboxSize: 10, spinPerSecond: 540, lifeMs: 4000, fadeMs: 300 },
  butcher: {
    color: 0xc0392b,
    width: 40,
    height: 56,
    speed: 165,
    // On entering he sprints until he is this close, so the chicken sees him.
    entranceSpeed: 270,
    entranceGapX: 220,
    // He is never further behind than this, or than the screen edge plus the margin.
    leashGapX: 300,
    leashScreenMargin: 40,
    jumpSpeed: 520,
    pitLeapSpeed: 880,
    jumpCooldownMs: 700,
    stuckCheckMs: 500,
    stuckMinMovePx: 12,
    phaseMs: 500,
    phaseRiseSpeed: 150,
    firstThrowMs: 1800,
    throwEveryMs: 2300,
    throwRangeX: 460,
    throwFlightMs: 1000,
    // Cleavers aim ahead of a moving chicken by this fraction of the flight.
    throwLead: 0.5,
    resumeChaseMs: 1500,
  },
  cleaver: { color: 0xc8ccd4, size: 16, hitboxSize: 10, spinPerSecond: 720, lifeMs: 4000, fadeMs: 300 },
  boss: {
    color: 0xc0392b,
    scale: 1.5,
    hitsToDefeat: 6,
    wakeDistanceX: 300,
    throwFlightMs: 1100,
    fanSpreadX: 70,
    // A phase lasts two hits. Every volley ends with him tired out: the opening.
    phases: [
      { throws: 3, fan: 1, gapMs: 1100, tiredMs: 3400 },
      { throws: 4, fan: 2, gapMs: 950, tiredMs: 3000 },
      { throws: 5, fan: 3, gapMs: 850, tiredMs: 2600 },
    ],
    safeAfterStompMs: 1000,
    eggProofMs: 2200,
    stompPushSpeed: 200,
    firstDropMs: 1500,
    dropEveryMs: 9000,
    dropOffsetX: 110,
    penColor: 0x8a5a33,
    penWidth: 120,
    penHeight: 40,
    penOffsetX: 210,
    knockedAwayMs: 1100,
    knockedArcHeight: 170,
    finishDelayMs: 1600,
  },
};
