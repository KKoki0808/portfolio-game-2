const EFFECTS = {
  reward: 0.35,
  "premium-reward": 0.35,
  damage: 0.35,
  victory: 0.4,
  gameover: 0.4,
};

export function loadAudio(scene) {
  for (const name of Object.keys(EFFECTS)) {
    scene.load.audio(name, `assets/audio/${name}.mp3`);
  }
}

export function unlockAudio(scene) {
  const context = scene.sound.context;
  if (context && context.state === "suspended") {
    context.resume().catch(() => {});
  }
  if (scene.sound.locked) scene.sound.unlock();
}

export function playEffect(scene, name) {
  scene.sound.play(name, { volume: EFFECTS[name] });
}
