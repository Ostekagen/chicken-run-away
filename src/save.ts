// The player's corn wallet, purchases and hat, saved in the browser.
// Kept in memory too, so the game still works when storage is blocked.
const SAVE_KEY = 'chicken-run-away:save';

interface SaveData {
  corn: number;
  owned: string[];
  hat: string | null;
}

const data: SaveData = read();

function read(): SaveData {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<SaveData> | null;
    return { corn: saved?.corn ?? 0, owned: saved?.owned ?? [], hat: saved?.hat ?? null };
  } catch {
    return { corn: 0, owned: [], hat: null };
  }
}

function write() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage is blocked. Progress lasts until the page closes.
  }
}

export function getCorn() {
  return data.corn;
}

export function addCorn(amount: number) {
  data.corn += amount;
  write();
}

export function owns(id: string) {
  return data.owned.includes(id);
}

// Returns false, changing nothing, if it is already owned or the wallet is short.
export function buy(id: string, price: number) {
  if (owns(id) || data.corn < price) return false;
  data.corn -= price;
  data.owned.push(id);
  write();
  return true;
}

export function getHat() {
  return data.hat;
}

// Null takes the hat off. Only an owned hat can be worn.
export function setHat(id: string | null) {
  if (id !== null && !owns(id)) return;
  data.hat = id;
  write();
}
