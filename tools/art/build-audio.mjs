// Writes every sound effect and music loop into public/assets/audio. All of it is original and
// synthesised here, so re-running gives identical files. Run with: node tools/art/build-audio.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seededRandom, writeOutput } from './lib.mjs';
import { SAMPLE_RATE, addNoise, addTone, encodeWav, noteFrequency, normalise } from './synth.mjs';

const AUDIO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'audio');

function effect(seconds, draw) {
  const buffer = new Float32Array(Math.ceil(seconds * SAMPLE_RATE));
  draw(buffer);
  // Short fades at both ends stop clicks.
  const fade = 110;
  for (let i = 0; i < fade; i++) {
    buffer[i] *= i / fade;
    buffer[buffer.length - 1 - i] *= i / fade;
  }
  return normalise(buffer, 0.7);
}

// Plays notes one after another. Entries are [note, seconds].
function melody(buffer, notes, options) {
  let start = 0;
  for (const [note, length] of notes) {
    addTone(buffer, start, length * 1.6, noteFrequency(note), options);
    start += Math.floor(length * SAMPLE_RATE);
  }
}

const noise = seededRandom(77);

const EFFECTS = {
  jump: effect(0.2, (b) => addTone(b, 0, 0.2, 300, { duty: 0.25, slide: 7, decay: 2.5 })),
  hit: effect(0.3, (b) => {
    addTone(b, 0, 0.3, 320, { duty: 0.5, slide: -7, decay: 3 });
    addNoise(b, 0, 0.14, { volume: 0.25, hold: 5, random: noise });
  }),
  stomp: effect(0.16, (b) => {
    addTone(b, 0, 0.16, 180, { type: 'triangle', slide: -8, decay: 3, volume: 0.6 });
    addNoise(b, 0, 0.07, { volume: 0.3, hold: 8, random: noise });
  }),
  corn: effect(0.16, (b) => melody(b, [['B5', 0.05], ['E6', 0.09]], { duty: 0.25, decay: 2.5 })),
  egg: effect(0.5, (b) => melody(b, [['C5', 0.06], ['E5', 0.06], ['G5', 0.06], ['C6', 0.06], ['E6', 0.2]], { duty: 0.5, decay: 2 })),
  powerup: effect(0.6, (b) => melody(b, [['G4', 0.07], ['C5', 0.07], ['E5', 0.07], ['G5', 0.07], ['E5', 0.07], ['G5', 0.07], ['C6', 0.2]], { duty: 0.25, decay: 2 })),
  checkpoint: effect(0.5, (b) => melody(b, [['E5', 0.1], ['A5', 0.1], ['C#6', 0.25]], { duty: 0.5, decay: 2 })),
  // A cartoon cock-a-doodle-doo: four pitch-swooping squawks, with a rasp under them.
  crow: effect(1, (b) => {
    const squawks = [[0, 0.12, 520, 3], [0.13, 0.12, 640, 2], [0.26, 0.14, 760, 1.5], [0.42, 0.5, 900, -1.6]];
    for (const [at, length, frequency, slide] of squawks) {
      const start = Math.floor(at * SAMPLE_RATE);
      addTone(b, start, length, frequency, { duty: 0.3, slide, vibrato: 0.03, decay: 1 });
      addTone(b, start, length, frequency * 1.5, { duty: 0.15, slide, vibrato: 0.03, decay: 1, volume: 0.12 });
      addNoise(b, start, length, { volume: 0.05, hold: 3, decay: 1, random: noise });
    }
  }),
  // Update 1. A cash-register "ka-ching": a drawer clack, then two bright bell pings.
  buy: effect(0.55, (b) => {
    addNoise(b, 0, 0.05, { volume: 0.35, hold: 2, decay: 4, random: noise });
    addTone(b, Math.floor(0.05 * SAMPLE_RATE), 0.08, noteFrequency('E6'), { duty: 0.5, decay: 2, volume: 0.3 });
    addTone(b, Math.floor(0.12 * SAMPLE_RATE), 0.4, noteFrequency('B6'), { type: 'triangle', decay: 3, volume: 0.3, vibrato: 0.004 });
    addTone(b, Math.floor(0.12 * SAMPLE_RATE), 0.4, noteFrequency('E6'), { type: 'triangle', decay: 3, volume: 0.35 });
  }),
  // A springy "boing" off the awning.
  bounce: effect(0.42, (b) => {
    addTone(b, 0, 0.42, 150, { type: 'triangle', slide: 3, vibrato: 0.12, decay: 1.6, volume: 0.7 });
    addTone(b, 0, 0.3, 300, { duty: 0.25, slide: 3, vibrato: 0.12, decay: 2, volume: 0.12 });
  }),
  // Falling in the harbour: a wash of noise that softens as it settles, with a couple of bloops.
  splash: effect(0.7, (b) => {
    addNoise(b, 0, 0.65, { volume: 0.6, hold: 2, decay: 4, holdSlide: 6, random: noise });
    for (const [at, frequency] of [[0.16, 520], [0.27, 680], [0.36, 600]]) {
      addTone(b, Math.floor(at * SAMPLE_RATE), 0.07, frequency, { type: 'triangle', slide: 5, decay: 2, volume: 0.3 });
    }
  }),
};

for (const [name, buffer] of Object.entries(EFFECTS)) {
  writeOutput(join(AUDIO, `sfx-${name}.wav`), encodeWav(buffer));
}

// ------------------------------------------------------------------------ music
// A track is a list of even steps, here eighth notes. Patterns are space-separated tokens: a note name, '-' to
// hold the previous note, or '.' for silence. Drums: k kick, s snare, h hat, '.' rest.
function renderTrack({ bpm, stepsPerBeat, lead, harmony, bass, drums, leadVoice, harmonyVoice }) {
  const stepSeconds = 60 / bpm / stepsPerBeat;
  const steps = lead.length;
  for (const [name, part] of Object.entries({ harmony, bass, drums })) {
    if (part.length !== steps) throw new Error(`${name} has ${part.length} steps, lead has ${steps}`);
  }
  const buffer = new Float32Array(Math.round(steps * stepSeconds * SAMPLE_RATE));
  const startOf = (step) => Math.round(step * stepSeconds * SAMPLE_RATE);
  const random = seededRandom(steps + bpm);

  const voice = (part, options) => {
    part.forEach((token, step) => {
      if (token === '.' || token === '-') return;
      let held = 1;
      while (part[(step + held) % steps] === '-' && held < steps) held++;
      addTone(buffer, startOf(step), held * stepSeconds * 0.95, noteFrequency(token), { ...options, wrap: true });
    });
  };

  voice(lead, { duty: 0.25, volume: 0.26, decay: 1.6, vibrato: 0.006, ...leadVoice });
  voice(harmony, { duty: 0.5, volume: 0.1, decay: 2.5, ...harmonyVoice });
  voice(bass, { type: 'triangle', volume: 0.5, decay: 0.8 });

  drums.forEach((hit, step) => {
    const at = startOf(step);
    if (hit === 'k') addTone(buffer, at, 0.12, 130, { type: 'triangle', slide: -9, decay: 2, volume: 0.65, wrap: true });
    if (hit === 's') addNoise(buffer, at, 0.13, { volume: 0.26, hold: 3, decay: 5, random, wrap: true });
    if (hit === 'h') addNoise(buffer, at, 0.04, { volume: 0.09, hold: 1, decay: 6, random, wrap: true });
  });

  // A short echo on the mix adds depth. It wraps too, so the loop point stays seamless.
  const delay = startOf(3);
  const dry = buffer.slice();
  for (let i = 0; i < buffer.length; i++) buffer[(i + delay) % buffer.length] += dry[i] * 0.16;
  return normalise(buffer, 0.8);
}

const tokens = (text) => text.trim().split(/\s+/);
const bars = (...parts) => parts.flatMap(tokens);
const repeat = (text, times) => Array(times).fill(text).join(' ');

// Arpeggio across a chord, filling one bar of `steps` steps.
function arp(notes, steps = 8) {
  return Array.from({ length: steps }, (_, i) => notes[i % notes.length]).join(' ');
}

// Bouncing root-and-fifth bass, one bar of eight steps.
function pump(root, fifth) {
  return `${root} . ${root} ${fifth} . ${root} ${fifth} .`;
}

// Slaughterhouse: A minor, a sneaky tiptoe that keeps slipping into a grin.
const SLAUGHTERHOUSE = {
  bpm: 128,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.125 },
  lead: bars(
    'A4 . C5 . E5 . D5 C5', 'B4 . D5 . - . . .', 'A4 . C5 . E5 . G5 E5', 'D5 - - . C5 B4 A4 .',
    'F5 . E5 . D5 . C5 D5', 'E5 . C5 . A4 . . .', 'F5 . E5 . D5 C5 B4 C5', 'A4 - - - . . E4 G#4',
    'A4 . A4 C5 . . A4 .', 'G4 . G4 B4 . . G4 .', 'F4 . F4 A4 . C5 . F5', 'E5 - D5 - C5 - B4 .',
    'A4 . A4 C5 . . E5 .', 'G5 . E5 . C5 . D5 .', 'F5 E5 D5 C5 B4 A4 G#4 B4', 'A4 - - . . . E4 .',
  ),
  harmony: bars(
    arp(['A3', 'C4', 'E4', 'C4']), arp(['G3', 'B3', 'D4', 'B3']), arp(['A3', 'C4', 'E4', 'C4']), arp(['F3', 'A3', 'C4', 'A3']),
    arp(['F3', 'A3', 'C4', 'A3']), arp(['A3', 'C4', 'E4', 'C4']), arp(['D4', 'F4', 'A4', 'F4']), arp(['E3', 'G#3', 'B3', 'G#3']),
    arp(['A3', 'C4', 'E4', 'C4']), arp(['G3', 'B3', 'D4', 'B3']), arp(['F3', 'A3', 'C4', 'A3']), arp(['E3', 'G#3', 'B3', 'G#3']),
    arp(['A3', 'C4', 'E4', 'C4']), arp(['C4', 'E4', 'G4', 'E4']), arp(['D4', 'F4', 'A4', 'F4']), arp(['E3', 'G#3', 'B3', 'G#3']),
  ),
  bass: bars(
    pump('A2', 'E2'), pump('G2', 'D2'), pump('A2', 'E2'), pump('F2', 'C3'),
    pump('F2', 'C3'), pump('A2', 'E2'), pump('D2', 'A2'), pump('E2', 'B2'),
    pump('A2', 'E2'), pump('G2', 'D2'), pump('F2', 'C3'), pump('E2', 'B2'),
    pump('A2', 'E2'), pump('C3', 'G2'), pump('D2', 'A2'), pump('E2', 'B2'),
  ),
  drums: bars(repeat('k . h . s . h h', 16)),
};

// Farm: C major, bright and bouncy.
const FARM = {
  bpm: 150,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.25 },
  lead: bars(
    'E5 . G5 . C6 - G5 .', 'A5 G5 E5 . G5 - - .', 'F5 . A5 . D6 - A5 .', 'G5 F5 D5 . E5 - - .',
    'E5 . G5 . C6 - E6 .', 'D6 C6 A5 . C6 - - .', 'B5 A5 G5 F5 E5 D5 C5 D5', 'E5 - - . D5 - - .',
    'C6 . B5 . A5 . G5 .', 'A5 . G5 . E5 - - .', 'F5 . E5 . D5 . C5 .', 'D5 E5 F5 G5 A5 - - .',
    'C6 . B5 . A5 . G5 .', 'A5 . C6 . E6 - D6 .', 'C6 A5 G5 E5 D5 E5 G5 B5', 'C6 - - - . . . .',
  ),
  harmony: bars(
    arp(['C4', 'E4', 'G4', 'E4']), arp(['A3', 'C4', 'E4', 'C4']), arp(['D4', 'F4', 'A4', 'F4']), arp(['G3', 'B3', 'D4', 'B3']),
    arp(['C4', 'E4', 'G4', 'E4']), arp(['F3', 'A3', 'C4', 'A3']), arp(['G3', 'B3', 'D4', 'B3']), arp(['G3', 'B3', 'D4', 'F4']),
    arp(['F3', 'A3', 'C4', 'A3']), arp(['C4', 'E4', 'G4', 'E4']), arp(['D4', 'F4', 'A4', 'F4']), arp(['G3', 'B3', 'D4', 'B3']),
    arp(['F3', 'A3', 'C4', 'A3']), arp(['C4', 'E4', 'G4', 'E4']), arp(['G3', 'B3', 'D4', 'F4']), arp(['C4', 'E4', 'G4', 'E4']),
  ),
  bass: bars(
    pump('C3', 'G2'), pump('A2', 'E2'), pump('D3', 'A2'), pump('G2', 'D2'),
    pump('C3', 'G2'), pump('F2', 'C3'), pump('G2', 'D2'), pump('G2', 'D2'),
    pump('F2', 'C3'), pump('C3', 'G2'), pump('D3', 'A2'), pump('G2', 'D2'),
    pump('F2', 'C3'), pump('C3', 'G2'), pump('G2', 'D2'), pump('C3', 'G2'),
  ),
  drums: bars(repeat('k . h h s . h .', 16)),
};

// Road: D major, fast and running with a driving drum pattern.
const ROAD = {
  bpm: 168,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.5, volume: 0.2 },
  lead: bars(
    'D5 - F#5 - A5 - - .', 'G5 - F#5 - E5 - D5 -', 'B4 - D5 - F#5 - - .', 'E5 - D5 - C#5 - A4 -',
    'D5 - F#5 - A5 - D6 -', 'C#6 - A5 - F#5 - A5 -', 'B5 A5 G5 F#5 E5 D5 C#5 D5', 'E5 - - - A4 - - .',
    'F#5 . F#5 G5 A5 - F#5 .', 'B5 . B5 A5 G5 - E5 .', 'A5 . A5 G5 F#5 - D5 .', 'E5 F#5 G5 E5 C#5 - A4 .',
    'F#5 . F#5 G5 A5 - D6 .', 'D6 . C#6 B5 A5 - G5 .', 'F#5 G5 A5 F#5 E5 F#5 G5 E5', 'D5 - - - D6 - - .',
  ),
  harmony: bars(
    arp(['D4', 'F#4', 'A4', 'D5']), arp(['G3', 'B3', 'D4', 'G4']), arp(['B3', 'D4', 'F#4', 'B4']), arp(['A3', 'C#4', 'E4', 'A4']),
    arp(['D4', 'F#4', 'A4', 'D5']), arp(['A3', 'C#4', 'E4', 'A4']), arp(['G3', 'B3', 'D4', 'G4']), arp(['A3', 'C#4', 'E4', 'G4']),
    arp(['D4', 'F#4', 'A4', 'D5']), arp(['G3', 'B3', 'D4', 'G4']), arp(['D4', 'F#4', 'A4', 'D5']), arp(['A3', 'C#4', 'E4', 'A4']),
    arp(['D4', 'F#4', 'A4', 'D5']), arp(['G3', 'B3', 'D4', 'G4']), arp(['A3', 'C#4', 'E4', 'G4']), arp(['D4', 'F#4', 'A4', 'D5']),
  ),
  bass: bars(
    pump('D3', 'A2'), pump('G2', 'D3'), pump('B2', 'F#2'), pump('A2', 'E2'),
    pump('D3', 'A2'), pump('A2', 'E2'), pump('G2', 'D3'), pump('A2', 'E2'),
    pump('D3', 'A2'), pump('G2', 'D3'), pump('D3', 'A2'), pump('A2', 'E2'),
    pump('D3', 'A2'), pump('G2', 'D3'), pump('A2', 'E2'), pump('D3', 'A2'),
  ),
  drums: bars(repeat('k h s h k k s h', 16)),
};

// Boss: E minor, urgent, with a stomping low riff under a two-part lead.
const BOSS = {
  bpm: 176,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.25, volume: 0.24 },
  harmonyVoice: { duty: 0.25, volume: 0.12 },
  lead: bars(
    'E5 . E5 . G5 . E5 .', 'A5 - G5 - F#5 - E5 -', 'E5 . E5 . G5 . B5 .', 'A5 - G5 - F#5 - D5 -',
    'C6 . C6 . B5 . A5 .', 'B5 - A5 - G5 - F#5 -', 'G5 . A5 . B5 . D6 .', 'B5 - - - D#5 - F#5 -',
    'B5 A5 G5 F#5 E5 F#5 G5 A5', 'B5 - E5 - . . E5 .', 'C6 B5 A5 G5 F#5 G5 A5 B5', 'C6 - F#5 - . . F#5 .',
    'B5 A5 G5 F#5 E5 F#5 G5 A5', 'B5 - D6 - E6 - D6 -', 'C6 B5 A5 G5 A5 G5 F#5 D#5', 'E5 - - - B4 - D#5 -',
  ),
  harmony: bars(
    arp(['E4', 'G4', 'B4']), arp(['C4', 'E4', 'A4']), arp(['E4', 'G4', 'B4']), arp(['D4', 'F#4', 'A4']),
    arp(['A3', 'C4', 'E4']), arp(['E4', 'G4', 'B4']), arp(['G3', 'B3', 'D4']), arp(['B3', 'D#4', 'F#4']),
    arp(['E4', 'G4', 'B4']), arp(['E4', 'G4', 'B4']), arp(['A3', 'C4', 'E4']), arp(['D4', 'F#4', 'A4']),
    arp(['E4', 'G4', 'B4']), arp(['G3', 'B3', 'D4']), arp(['A3', 'C4', 'E4']), arp(['B3', 'D#4', 'F#4']),
  ),
  bass: bars(
    'E2 E2 E3 E2 E2 E3 E2 D3', 'C3 C3 C2 C3 D3 D3 D2 D3', 'E2 E2 E3 E2 E2 E3 E2 D3', 'D3 D3 D2 D3 D3 D2 F#2 A2',
    'A2 A2 A3 A2 A2 A3 A2 G2', 'E2 E2 E3 E2 E2 E3 E2 D3', 'G2 G2 G3 G2 G2 G3 A2 B2', 'B2 B2 B3 B2 A2 G2 F#2 D#2',
    'E2 E2 E3 E2 E2 E3 E2 D3', 'E2 E2 E3 E2 E2 E3 E2 D3', 'A2 A2 A3 A2 A2 A3 A2 G2', 'D3 D3 D2 D3 D3 D2 D3 D2',
    'E2 E2 E3 E2 E2 E3 E2 D3', 'G2 G2 G3 G2 G2 G3 G2 F#2', 'A2 A2 A3 A2 G2 G3 F#2 F#3', 'B2 B2 B3 B2 B2 B3 B2 D#2',
  ),
  drums: bars(repeat('k h s h k k s s', 15), 'k s s s s s s s'),
};

// ===================================================== Update 1: World 2 music

// Driving octave bass for the faster tracks, one bar of eight steps.
function drive(low, high, pickup = low) {
  return `${low} ${low} ${high} ${low} ${low} ${high} ${low} ${pickup}`;
}

// Market: G major, a sunny stroll between the stalls with a soft, accordion-like square lead.
const MARKET = {
  bpm: 132,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.5, volume: 0.19, vibrato: 0.01 },
  harmonyVoice: { duty: 0.25, volume: 0.08 },
  lead: bars(
    'D5 . B4 . G4 . B4 D5', 'F#5 - E5 . D5 . A4 .', 'G5 . E5 . B4 . E5 G5', 'E5 - D5 . C5 - . .',
    'B4 . D5 . G5 . F#5 G5', 'A5 . G5 . E5 . C5 .', 'D5 . F#5 . A5 . F#5 D5', 'G5 - - . D5 - - .',
    'E5 . G5 . C6 . G5 .', 'D5 . G5 . B5 . G5 .', 'C5 . E5 . A5 . G5 E5', 'F#5 - E5 - D5 - . .',
    'B5 . A5 . G5 . D5 .', 'E5 . G5 . B5 . A5 G5', 'E5 . C5 . D5 . F#5 A5', 'G5 - - - . . D5 .',
  ),
  harmony: bars(
    arp(['G3', 'B3', 'D4', 'B3']), arp(['D4', 'F#4', 'A4', 'F#4']), arp(['E4', 'G4', 'B4', 'G4']), arp(['C4', 'E4', 'G4', 'E4']),
    arp(['G3', 'B3', 'D4', 'B3']), arp(['C4', 'E4', 'G4', 'E4']), arp(['D4', 'F#4', 'A4', 'F#4']), arp(['G3', 'B3', 'D4', 'B3']),
    arp(['C4', 'E4', 'G4', 'E4']), arp(['G3', 'B3', 'D4', 'B3']), arp(['A3', 'C4', 'E4', 'C4']), arp(['D4', 'F#4', 'A4', 'F#4']),
    arp(['G3', 'B3', 'D4', 'B3']), arp(['E4', 'G4', 'B4', 'G4']), arp(['C4', 'E4', 'D4', 'F#4']), arp(['G3', 'B3', 'D4', 'B3']),
  ),
  bass: bars(
    pump('G2', 'D3'), pump('D3', 'A2'), pump('E2', 'B2'), pump('C3', 'G2'),
    pump('G2', 'D3'), pump('C3', 'G2'), pump('D3', 'A2'), pump('G2', 'D3'),
    pump('C3', 'G2'), pump('G2', 'D3'), pump('A2', 'E2'), pump('D3', 'A2'),
    pump('G2', 'D3'), pump('E2', 'B2'), 'C3 . C3 G2 D3 . D3 A2', pump('G2', 'D3'),
  ),
  drums: bars(repeat('k . h h s . h .', 7), 'k . h h s . s s', repeat('k . h h s . h .', 7), 'k . h h s s s .'),
};

// Rooftops: B minor and fast, for the level where the screen keeps moving. The urgency comes from the
// tempo and the driving bass; the lead stays mid-range and soft-edged so it is easy to hear for minutes.
const ROOFTOPS = {
  bpm: 172,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.25, volume: 0.2, vibrato: 0.006 },
  harmonyVoice: { duty: 0.5, volume: 0.08 },
  lead: bars(
    'B4 . D5 . F#5 . D5 .', 'G5 - F#5 - E5 - D5 -', 'F#5 . A5 . F#5 . D5 .', 'E5 - C#5 - A4 - C#5 -',
    'B4 . D5 . F#5 . B5 .', 'A5 - G5 - F#5 - E5 -', 'G5 . F#5 . E5 . D5 .', 'C#5 - - - A#4 - C#5 -',
    'D5 D5 . D5 E5 . F#5 .', 'E5 E5 . E5 F#5 . G5 .', 'F#5 - D5 - B4 - D5 -', 'C#5 - E5 - F#5 - A#4 -',
    'B5 . A5 . G5 . F#5 .', 'A5 . G5 . F#5 . E5 .', 'G5 . F#5 . E5 . C#5 .', 'B4 - - - F#4 - A#4 -',
  ),
  harmony: bars(
    arp(['B3', 'D4', 'F#4', 'D4']), arp(['G3', 'B3', 'D4', 'B3']), arp(['D4', 'F#4', 'A4', 'F#4']), arp(['A3', 'C#4', 'E4', 'C#4']),
    arp(['B3', 'D4', 'F#4', 'D4']), arp(['G3', 'B3', 'D4', 'B3']), arp(['E4', 'G4', 'B4', 'G4']), arp(['F#3', 'A#3', 'C#4', 'A#3']),
    arp(['G3', 'B3', 'D4', 'B3']), arp(['A3', 'C#4', 'E4', 'C#4']), arp(['B3', 'D4', 'F#4', 'D4']), arp(['F#3', 'A#3', 'C#4', 'A#3']),
    arp(['G3', 'B3', 'D4', 'B3']), arp(['A3', 'C#4', 'E4', 'C#4']), arp(['E4', 'G4', 'C#4', 'A#3']), arp(['B3', 'D4', 'F#4', 'D4']),
  ),
  bass: bars(
    drive('B2', 'B3'), drive('G2', 'G3'), drive('D3', 'D2'), drive('A2', 'A3'),
    drive('B2', 'B3'), drive('G2', 'G3'), drive('E2', 'E3'), drive('F#2', 'F#3', 'C#3'),
    drive('G2', 'G3'), drive('A2', 'A3'), drive('B2', 'B3'), drive('F#2', 'F#3', 'C#3'),
    drive('G2', 'G3'), drive('A2', 'A3'), 'E2 E2 E3 E2 F#2 F#2 F#3 F#2', drive('B2', 'B3', 'F#2'),
  ),
  drums: bars(repeat('k h s h k k s h', 7), 'k h s h k s s s', repeat('k h s h k k s h', 7), 'k s k s s s s s'),
};

// Harbour: a jaunty sea shanty in 6/8, D major. Six steps per bar, three per beat.
function arp6(notes) {
  return arp(notes, 6);
}

function oompah(root, fifth) {
  return `${root} . . ${fifth} . .`;
}

const HARBOUR = {
  bpm: 112,
  stepsPerBeat: 3,
  leadVoice: { duty: 0.25, volume: 0.22, vibrato: 0.012 },
  harmonyVoice: { duty: 0.5, volume: 0.08 },
  lead: bars(
    'A4 . D5 D5 . E5', 'F#5 . E5 D5 . .', 'B4 . D5 G5 . F#5', 'E5 - - - . A4',
    'A4 . D5 D5 . E5', 'F#5 . A5 F#5 . D5', 'E5 . C#5 A4 . C#5', 'D5 - - - . A4',
    'B4 . B4 D5 . B4', 'A4 . D5 F#5 . D5', 'G5 . F#5 E5 . D5', 'C#5 . E5 A5 . G5',
    'F#5 . A5 F#5 . D5', 'G5 . B5 G5 . E5', 'E5 . F#5 G5 . E5', 'D5 - - - . A4',
    // B section: the answer, sung back across the water.
    'D5 . F#5 A5 . F#5', 'G5 . F#5 E5 . D5', 'C#5 . E5 A5 . E5', 'F#5 - - - . D5',
    'B4 . D5 G5 . B5', 'A5 . F#5 D5 . F#5', 'E5 . D5 C#5 . E5', 'D5 - - - . A4',
  ),
  harmony: bars(
    arp6(['D4', 'F#4', 'A4']), arp6(['D4', 'F#4', 'A4']), arp6(['G3', 'B3', 'D4']), arp6(['A3', 'C#4', 'E4']),
    arp6(['D4', 'F#4', 'A4']), arp6(['D4', 'F#4', 'A4']), arp6(['A3', 'C#4', 'E4']), arp6(['D4', 'F#4', 'A4']),
    arp6(['G3', 'B3', 'D4']), arp6(['D4', 'F#4', 'A4']), arp6(['E4', 'G4', 'B4']), arp6(['A3', 'C#4', 'E4']),
    arp6(['D4', 'F#4', 'A4']), arp6(['G3', 'B3', 'D4']), arp6(['A3', 'C#4', 'E4']), arp6(['D4', 'F#4', 'A4']),
    arp6(['D4', 'F#4', 'A4']), arp6(['G3', 'B3', 'D4']), arp6(['A3', 'C#4', 'E4']), arp6(['D4', 'F#4', 'A4']),
    arp6(['G3', 'B3', 'D4']), arp6(['D4', 'F#4', 'A4']), arp6(['A3', 'C#4', 'E4']), arp6(['D4', 'F#4', 'A4']),
  ),
  bass: bars(
    oompah('D3', 'A2'), oompah('D3', 'A2'), oompah('G2', 'D3'), oompah('A2', 'E2'),
    oompah('D3', 'A2'), oompah('D3', 'A2'), oompah('A2', 'E2'), oompah('D3', 'A2'),
    oompah('G2', 'D3'), oompah('D3', 'A2'), oompah('E2', 'B2'), oompah('A2', 'E2'),
    oompah('D3', 'A2'), oompah('G2', 'D3'), oompah('A2', 'E2'), oompah('D3', 'A2'),
    oompah('D3', 'A2'), oompah('G2', 'D3'), oompah('A2', 'E2'), oompah('D3', 'A2'),
    oompah('G2', 'D3'), oompah('D3', 'A2'), oompah('A2', 'E2'), oompah('D3', 'A2'),
  ),
  drums: bars(repeat('k . h s . h', 15), 'k . h s s s', repeat('k . h s . h', 7), 'k . h s s s'),
};

// Boss 2: A minor and fast, the scooter buzzing round the arena.
const BOSS_2 = {
  bpm: 180,
  stepsPerBeat: 2,
  leadVoice: { duty: 0.25, volume: 0.22 },
  harmonyVoice: { duty: 0.25, volume: 0.1 },
  lead: bars(
    'A4 . C5 . E5 . A5 .', 'G5 - F5 - E5 - C5 -', 'D5 . G5 . B5 . G5 .', 'G#5 - - - E5 - B4 -',
    'A5 . A5 . G5 . E5 .', 'F5 . F5 . E5 . C5 .', 'D5 . E5 . F5 . G5 .', 'G#5 - E5 - B5 - G#5 -',
    'F5 E5 D5 E5 F5 . A5 .', 'E5 D5 C5 D5 E5 . A5 .', 'G#5 F#5 E5 F#5 G#5 . B5 .', 'C6 - B5 - A5 - E5 -',
    'A5 G5 F5 G5 A5 . C6 .', 'B5 A5 G5 A5 B5 . D6 .', 'E6 - D6 - B5 - G#5 -', 'E5 - - - B4 - G#4 -',
  ),
  harmony: bars(
    arp(['A3', 'C4', 'E4']), arp(['F3', 'A3', 'C4']), arp(['G3', 'B3', 'D4']), arp(['E3', 'G#3', 'B3']),
    arp(['A3', 'C4', 'E4']), arp(['F3', 'A3', 'C4']), arp(['G3', 'B3', 'D4']), arp(['E3', 'G#3', 'B3']),
    arp(['D4', 'F4', 'A4']), arp(['A3', 'C4', 'E4']), arp(['E3', 'G#3', 'B3']), arp(['A3', 'C4', 'E4']),
    arp(['F3', 'A3', 'C4']), arp(['G3', 'B3', 'D4']), arp(['E3', 'G#3', 'B3']), arp(['E3', 'G#3', 'B3']),
  ),
  bass: bars(
    drive('A2', 'A3', 'G2'), drive('F2', 'F3'), drive('G2', 'G3'), drive('E2', 'E3', 'G#2'),
    drive('A2', 'A3', 'G2'), drive('F2', 'F3'), drive('G2', 'G3'), drive('E2', 'E3', 'G#2'),
    drive('D2', 'D3'), drive('A2', 'A3'), drive('E2', 'E3'), drive('A2', 'A3', 'G2'),
    drive('F2', 'F3'), drive('G2', 'G3'), drive('E2', 'E3'), 'E2 E2 E3 E2 E2 E3 D3 B2',
  ),
  drums: bars(repeat('k h s h k k s h', 15), 'k s k s s s s s'),
};

const MUSIC = {
  slaughterhouse: SLAUGHTERHOUSE, farm: FARM, road: ROAD, boss: BOSS,
  market: MARKET, rooftops: ROOFTOPS, harbour: HARBOUR, 'boss-2': BOSS_2,
};

for (const [name, track] of Object.entries(MUSIC)) {
  writeOutput(join(AUDIO, `music-${name}.wav`), encodeWav(renderTrack(track)));
}
