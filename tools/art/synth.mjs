// Tiny chiptune synthesiser: pulse, triangle and noise voices rendered to 16-bit mono WAV.
export const SAMPLE_RATE = 22050;

const NOTE_NAMES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

export function noteFrequency(name) {
  const match = /^([A-G]#?)(\d)$/.exec(name);
  if (!match) throw new Error(`Bad note "${name}"`);
  const semitone = NOTE_NAMES[match[1]] + (Number(match[2]) + 1) * 12;
  return 440 * 2 ** ((semitone - 69) / 12);
}

// Band-limiting is skipped on purpose: the slight aliasing is part of the chip sound.
export function oscillator(type, phase, duty = 0.5) {
  const t = phase % 1;
  if (type === 'pulse') return t < duty ? 0.6 : -0.6;
  if (type === 'triangle') return 4 * Math.abs(t - 0.5) - 1;
  throw new Error(`Unknown oscillator ${type}`);
}

// A note with a slight hold before release, mixed into `buffer`, wrapping when `wrap` is set
// so that a tail spilling past the end of a loop lands back at its start.
export function addTone(buffer, start, length, frequency, { type = 'pulse', duty = 0.5, volume = 0.3, decay = 3, vibrato = 0, slide = 0, wrap = false }) {
  let phase = 0;
  const count = Math.floor(length * SAMPLE_RATE);
  for (let i = 0; i < count; i++) {
    const time = i / SAMPLE_RATE;
    const wobble = vibrato ? Math.sin(time * 34) * vibrato * Math.min(1, time * 6) : 0;
    phase += (frequency * (1 + wobble) * 2 ** (slide * time)) / SAMPLE_RATE;
    const attack = Math.min(1, i / 40);
    const release = Math.min(1, (count - i) / 120);
    const envelope = attack * release * Math.exp((-decay * time) / length);
    const index = start + i;
    if (index >= buffer.length && !wrap) break;
    buffer[index % buffer.length] += oscillator(type, phase, duty) * envelope * volume;
  }
}

// Noise with a sample-and-hold rate, which is how old consoles pitched their drums.
export function addNoise(buffer, start, length, { volume = 0.3, decay = 8, hold = 1, random, wrap = false, holdSlide = 0 }) {
  const count = Math.floor(length * SAMPLE_RATE);
  let value = 0;
  let counter = 0;
  for (let i = 0; i < count; i++) {
    const time = i / SAMPLE_RATE;
    if (counter <= 0) {
      value = random() * 2 - 1;
      counter = hold * (1 + holdSlide * time);
    }
    counter--;
    const index = start + i;
    if (index >= buffer.length && !wrap) break;
    buffer[index % buffer.length] += value * Math.exp((-decay * time) / length) * Math.min(1, (count - i) / 60) * volume;
  }
}

export function normalise(buffer, peak = 0.85) {
  const loudest = buffer.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  const gain = loudest > 0 ? peak / loudest : 1;
  return buffer.map((sample) => sample * gain);
}

export function encodeWav(buffer) {
  const data = Buffer.alloc(buffer.length * 2);
  buffer.forEach((sample, index) => {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), index * 2);
  });
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
