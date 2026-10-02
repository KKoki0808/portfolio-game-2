import { loadAudio, unlockAudio } from "../audio.js";

export default class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  preload() {
    loadAudio(this);
    this.load.audio("start-voice", "assets/audio/start-voice.mp3");
    this.load.image("menu-plaques", "assets/menu-plaques.png");
    this.load.image("start-background", "assets/start-background.png");
  }

  create() {
    this.setupStartVoice();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#100e0b");
    const background = this.add.image(width / 2, height / 2, "start-background").setDepth(-1);
    background.setScale(Math.max(width / background.width, height / background.height));
    this.add.image(width / 2, 292, "menu-plaques").setDisplaySize(780, 312);

    this.add
      .text(width / 2, 72, "Sushi Catch", {
        fontFamily: 'Mistral, "Brush Script MT", cursive',
        fontSize: "76px",
        fontStyle: "bold",
        color: "#fff0d4",
      })
      .setOrigin(0.5);

    const buttonWidth = 220;
    const buttonHeight = 56;
    const buttonX = width / 2;
    const buttonY = height - 82;

    const button = this.add
      .rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0xe85d4c)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(buttonX, buttonY, "Start Game", {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    button.on("pointerover", () => {
      button.setFillStyle(0xff7a6b);
    });

    button.on("pointerout", () => {
      button.setFillStyle(0xe85d4c);
    });

    button.on("pointerdown", () => {
      unlockAudio(this);
      this.scene.start("GameScene");
    });
  }

  setupStartVoice() {
    const voice = this.sound.add("start-voice", { volume: 0.55, loop: false });
    const context = this.sound.context;
    let played = false;
    let active = true;
    const playOnce = () => {
      if (!active || played || this.sound.locked) return;
      if (context && context.state !== "running") return;
      played = voice.play();
    };
    const onInteraction = () => {
      unlockAudio(this);
      playOnce();
    };
    this.sound.on("unlocked", playOnce);
    context?.addEventListener("statechange", playOnce);
    this.input.on("pointerdown", onInteraction);
    this.events.once("shutdown", () => {
      active = false;
      this.sound.off("unlocked", playOnce);
      context?.removeEventListener("statechange", playOnce);
      this.input.off("pointerdown", onInteraction);
      voice.destroy();
    });
    playOnce();
  }
}
