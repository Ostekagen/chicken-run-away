export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 32;

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
};
