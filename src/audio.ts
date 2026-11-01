import Phaser from 'phaser';

const MUSIC_VOLUME = 0.35;

let music: Phaser.Sound.BaseSound | undefined;

export function playSound(scene: Phaser.Scene, key: string) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key);
}

// Only one track plays at a time, and a track already playing carries on.
export function playMusic(scene: Phaser.Scene, key: string) {
  if (music?.key === key && music.isPlaying) return;
  music?.destroy();
  music = undefined;
  if (!scene.cache.audio.exists(key)) return;
  music = scene.sound.add(key, { loop: true, volume: MUSIC_VOLUME });
  music.play();
}
