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
