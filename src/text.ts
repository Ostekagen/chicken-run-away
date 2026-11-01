// All player-facing text lives here, so the game can be translated in one place.
export const TEXT = {
  title: 'Chicken Run Away',
  tagline: 'The butcher is right behind you!',
  start: 'Press Space or choose a level',
  controlsKeys: 'Move: Arrows or A/D    Jump: Space    Throw egg: X    Crow: C    Pause: P',
  controlsTouch: 'Use the on-screen buttons. Tap the star to throw eggs or crow.',
  levelNames: {
    'level-1': 'The Slaughterhouse',
    'level-2': 'The Farm',
    'level-3': 'The Road to Freedom',
    boss: 'The Butcher',
  } as Record<string, string>,
  levelComplete: 'You escaped!',
  corn: 'Corn',
  goldenEggs: 'Golden eggs',
  continueGame: 'Continue',
  paused: 'Paused',
  resume: 'Resume',
  quit: 'Quit to menu',
  victoryTitle: 'Free at last!',
  victoryBody: 'The butcher is in the pig pen, and the chicken runs free.',
  backToMenu: 'Back to menu',
};
