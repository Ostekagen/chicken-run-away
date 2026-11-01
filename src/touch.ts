// Held state of the on-screen buttons. HudScene writes it and GameScene reads it.
export const touch = { left: false, right: false, jump: false };

export function clearTouch() {
  touch.left = false;
  touch.right = false;
  touch.jump = false;
}
