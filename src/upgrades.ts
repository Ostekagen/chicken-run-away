import { ENEMIES, POWERUPS } from './config';
import { owns } from './save';

// Everything the shop sells. Upgrades are always on once bought; one hat is worn at a time.
export const SHOP_ITEMS = [
  { id: 'extra-heart', kind: 'upgrade', price: 600 },
  { id: 'corn-magnet', kind: 'upgrade', price: 350 },
  { id: 'longer-powerups', kind: 'upgrade', price: 300 },
  { id: 'egg-basket', kind: 'upgrade', price: 300 },
  { id: 'feather-start', kind: 'upgrade', price: 500 },
  { id: 'hat-straw', kind: 'hat', price: 100 },
  { id: 'hat-pirate', kind: 'hat', price: 200 },
  { id: 'hat-crown', kind: 'hat', price: 400 },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]['id'];

export const UPGRADE_EFFECTS = {
  extraHearts: 1,
  longerRushMs: 9000,
  longerStunFactor: 1.5,
  basketEggCooldownMs: 175,
  magnetRadius: 96,
  magnetSpeed: 380,
};

export function hasUpgrade(id: ShopItemId) {
  return owns(id);
}

export function rushMs() {
  return hasUpgrade('longer-powerups') ? UPGRADE_EFFECTS.longerRushMs : POWERUPS.rushMs;
}

// How long the crow stuns enemies and the butcher.
export function crowStunMs() {
  return ENEMIES.stunMs * (hasUpgrade('longer-powerups') ? UPGRADE_EFFECTS.longerStunFactor : 1);
}

export function eggCooldownMs() {
  return hasUpgrade('egg-basket') ? UPGRADE_EFFECTS.basketEggCooldownMs : POWERUPS.eggCooldownMs;
}
