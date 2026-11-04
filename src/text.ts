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
    'level-4': 'The Market',
    'level-5': 'Runaway Cart',
    'level-6': 'The Harbour',
    'boss-2': 'The Scooter Butcher',
  } as Record<string, string>,
  worldNames: {
    'world-1': 'Escape',
    'world-2': 'The Butcher Strikes Back',
  } as Record<string, string>,
  levelComplete: 'You escaped!',
  corn: 'Corn',
  goldenEggs: 'Golden eggs',
  continueGame: 'Continue',
  paused: 'Paused',
  resume: 'Resume',
  quit: 'Quit to menu',
  endings: {
    'world-1': {
      title: 'Free at last!',
      body: 'The butcher is in the pig pen, and the chicken runs free.',
      backdrop: 'bg-road',
    },
    'world-2': {
      title: 'Splash!',
      body: 'The scooter is in the harbour. The butcher has learned to swim.',
      backdrop: 'bg-harbour',
    },
  } as Record<string, { title: string; body: string; backdrop: string }>,
  backToMenu: 'Back to menu',
};
