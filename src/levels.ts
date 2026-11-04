// Worlds and their levels in play order. Each level is a map file at public/levels/<name>.json.
export const WORLDS = [
  { id: 'world-1', levels: ['level-1', 'level-2', 'level-3', 'boss'] },
  { id: 'world-2', levels: ['level-4', 'level-5', 'level-6', 'boss-2'] },
];

// Every level in order. A level unlocks when the one before it here is finished.
export const LEVELS = WORLDS.flatMap((world) => world.levels);

export function worldOf(level: string) {
  return WORLDS.find((world) => world.levels.includes(level)) ?? WORLDS[0];
}

// The next level in the same world, or undefined after a world's last level.
export function nextLevelInWorld(level: string): string | undefined {
  const { levels } = worldOf(level);
  return levels[levels.indexOf(level) + 1];
}

export function isBossLevel(level: string) {
  return level.startsWith('boss');
}
