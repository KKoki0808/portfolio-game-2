import { playEffect, unlockAudio } from "../audio.js";

const GAME_SCALE = 1.25;
const SALES_GOAL = 10000;

const MENU = [
  { name: "Tuna", price: 380, ids: ["fish"] },
  { name: "Egg", price: 120, ids: ["tamago"] },
  { name: "Shrimp", price: 330, ids: ["shrimp"] },
  { name: "Fatty Salmon", price: 520, ids: ["salmon"] },
  { name: "Simmered Conger Eel", price: 660, ids: ["anago"] },
  { name: "Sea Urchin", price: 1200, ids: ["uni"] },
  { name: "Chutoro", price: 820, ids: ["chutoro"] },
];
const PRICES = Object.fromEntries(
  MENU.flatMap(({ price, ids }) => ids.map((id) => [id, price]))
);

const EXTRA_TOPPINGS = {
  uni: { topping: [35, 90, 1000, 560], nigiri: [1340, 30, 720, 655] },
  salmon: { topping: [0, 292, 880, 328], nigiri: [920, 290, 854, 330] },
  shrimp: { topping: [35, 214, 975, 375], nigiri: [1140, 210, 963, 380] },
  anago: { topping: [18, 302, 872, 320], nigiri: [900, 300, 865, 340] },
  tamago: { topping: [20, 172, 1050, 398], nigiri: [1155, 172, 1017, 408] },
};

// Percentages among toppings; rice is scheduled separately.
const TOPPING_WEIGHTS = [
  ["fish", 33],
  ["chutoro", 10],
  ["tamago", 21],
  ["shrimp", 15],
  ["salmon", 10],
  ["anago", 8],
  ["uni", 3],
];

const INGREDIENT_TYPES = {
  rice: {
    id: "rice",
    width: 54 * GAME_SCALE,
    height: 36 * GAME_SCALE,
  },
  fish: {
    id: "fish",
    texture: "sushi-art",
    completedFrame: "nigiri",
    width: 78 * GAME_SCALE,
    height: 22 * GAME_SCALE,
  },
  chutoro: {
    id: "chutoro",
    texture: "chutoro-art",
    completedFrame: "nigiri",
    width: 78 * GAME_SCALE,
    height: 22 * GAME_SCALE,
  },
  ...Object.fromEntries(Object.keys(EXTRA_TOPPINGS).map((id) => [id, {
    id,
    texture: `${id}-art`,
    completedFrame: "nigiri",
    width: 78 * GAME_SCALE,
    height: 22 * GAME_SCALE,
  }])),
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("game-background", "assets/start-background.png");
    this.load.image("wasabi", "assets/wasabi.png");
    this.load.image("sushi-art", "assets/sushi-atlas.png");
    this.load.image("chutoro-art", "assets/chutoro-atlas.png");
    for (const id of Object.keys(EXTRA_TOPPINGS)) {
      this.load.image(`${id}-art`, `assets/${id}-atlas.png`);
    }
  }

  create() {
    const { width, height } = this.scale;
    this.gameOver = false;
    this.endState = null;
    this.lives = 3;
    this.cameras.main.resetFX();
    this.sound.stopAll();

    const background = this.add.image(width / 2, height / 2, "game-background").setDepth(-3);
    background.setScale(Math.max(width / background.width, height / background.height));
    // Soften the busy photo without washing out the falling food sprites.
    this.add.rectangle(width / 2, height / 2, width, height, 0x7ec8e3, 0.76).setDepth(-2);
    this.add.rectangle(width / 2, 43, width, 86, 0xf5f4e9, 0.94).setDepth(1);
    this.createFoodTextures();

    const plateWidth = 140 * GAME_SCALE;
    const plateHeight = 28 * GAME_SCALE;
    const plateY = height - 48;

    this.plate = this.add.image(width / 2, plateY, "sushi-art", "plate")
      .setDisplaySize(plateWidth, 36 * GAME_SCALE);
    this.plateHeight = plateHeight;
    // Seat the rice and completed nigiri on the plate's inner surface.
    this.sushi = this.add.container(width / 2, plateY - 15 * GAME_SCALE).setScale(GAME_SCALE);
    this.plateRice = null;
    this.completingSushi = false;

    this.totalYen = 0;
    this.totalText = this.add.text(16, 18, `Sales: ¥0 / ¥${SALES_GOAL.toLocaleString("en-US")}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "28px",
      color: "#1a1a2e",
    }).setDepth(1);

    this.createPriceDisplay();
    const muteButton = this.add.text(width - 16, 52,
      this.sound.mute ? "Unmute" : "Mute", {
        fontFamily: "Arial, sans-serif", fontSize: "16px", color: "#24343b",
        backgroundColor: "#ffffff", padding: { x: 8, y: 5 },
      }).setOrigin(1, 0).setDepth(30).setInteractive({ useHandCursor: true });
    muteButton.on("pointerdown", () => {
      unlockAudio(this);
      this.sound.setMute(!this.sound.mute);
      muteButton.setText(this.sound.mute ? "Unmute" : "Mute");
    });
    this.heartsText = this.add.text(16, 48, "❤️❤️❤️", {
      fontFamily: '"Segoe UI Emoji", Arial, sans-serif', fontSize: "26px",
      color: "#d82035",
    }).setDepth(3);

    this.plateSpeed = 420;
    this.plateHalfWidth = plateWidth / 2;
    this.cursors = this.input.keyboard.createCursorKeys();

    this.fallSpeed = 180;
    this.ingredients = this.add.group();
    this.hazards = this.add.group();
    this.nextIngredientIsRice = true;
    this.scheduleNextIngredient();
    this.scheduleNextHazard();
  }

  update(_time, delta) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    let velocityX = 0;

    if (this.cursors.left.isDown) {
      velocityX -= this.plateSpeed;
    }

    if (this.cursors.right.isDown) {
      velocityX += this.plateSpeed;
    }

    this.plate.x += velocityX * dt;

    const minX = this.plateHalfWidth;
    const maxX = this.scale.width - this.plateHalfWidth;
    this.plate.x = Phaser.Math.Clamp(this.plate.x, minX, maxX);

    this.sushi.x = this.plate.x;

    this.updateHazards(dt);
    if (!this.gameOver) this.updateIngredients(dt);
  }

  scheduleNextIngredient() {
    if (this.gameOver) return;
    const delay = Phaser.Math.Between(700, 1300) / 1.3;
    this.time.delayedCall(delay, () => {
      this.spawnIngredient();
      this.scheduleNextIngredient();
    });
  }

  spawnIngredient() {
    if (this.gameOver) return;
    let type = INGREDIENT_TYPES.rice;
    if (!this.nextIngredientIsRice) {
      let roll = Phaser.Math.Between(1, 100);
      for (const [id, weight] of TOPPING_WEIGHTS) {
        roll -= weight;
        if (roll <= 0) {
          type = INGREDIENT_TYPES[id];
          break;
        }
      }
    }
    this.nextIngredientIsRice = !this.nextIngredientIsRice;
    const halfWidth = type.width / 2;
    const x = Phaser.Math.Between(halfWidth, this.scale.width - halfWidth);
    const y = -type.height / 2;

    const item = this.add.image(x, y, type.texture || "sushi-art", type.id);
    item.setScale(type.width / item.width);
    item.ingredientId = type.id;
    item.fallSpeed = this.fallSpeed;
    this.ingredients.add(item);
  }

  // Separate scheduling keeps the regular rice/topping cadence intact.
  scheduleNextHazard() {
    if (this.gameOver) return;
    this.time.delayedCall(Phaser.Math.Between(3500, 5500) / 2.25, () => {
      if (this.gameOver) return;
      const item = this.add.image(
        Phaser.Math.Between(50, this.scale.width - 50), -34, "wasabi"
      ).setDisplaySize(67, 67);
      this.hazards.add(item);
      this.scheduleNextHazard();
    });
  }

  updateHazards(dt) {
    const plateBounds = new Phaser.Geom.Rectangle(
      this.plate.x - this.plateHalfWidth, this.plate.y - this.plateHeight / 2,
      this.plateHalfWidth * 2, this.plateHeight
    );
    for (const item of [...this.hazards.getChildren()]) {
      item.y += this.fallSpeed * dt;
      // Inset the hazard hitbox by 10% on each edge for a forgiving catch.
      const hitWidth = item.displayWidth * 0.8;
      const hitHeight = item.displayHeight * 0.8;
      const hitBounds = new Phaser.Geom.Rectangle(
        item.x - hitWidth / 2, item.y - hitHeight / 2, hitWidth, hitHeight
      );
      if (Phaser.Geom.Intersects.RectangleToRectangle(plateBounds, hitBounds)) {
        item.destroy();
        this.takeDamage();
        if (this.gameOver) return;
      } else if (item.y - item.displayHeight / 2 > this.scale.height) {
        item.destroy();
      }
    }
  }

  takeDamage() {
    if (this.gameOver) return;
    this.lives -= 1;
    playEffect(this, "damage");
    this.heartsText.setText("❤️".repeat(this.lives));
    if (this.lives === 0) this.endGame();
    this.cameras.main.shake(180, 0.006, true);
    const flash = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0xff0000, 0.3
    ).setDepth(10);
    this.tweens.add({ targets: flash, alpha: 0, duration: 220,
      onComplete: () => flash.destroy() });
  }

  endGame(result = "loss") {
    if (this.endState) return;
    this.endState = result;
    playEffect(this, result === "win" ? "victory" : "gameover");
    this.gameOver = true;
    this.time.removeAllEvents();
    this.tweens.killAll();
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setDepth(20);
    const won = result === "win";
    this.add.text(width / 2, height / 2 - 70, won ? "GOAL REACHED!" : "GAME OVER", {
      fontFamily: "Arial, sans-serif", fontSize: "52px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(0.5).setDepth(21);
    this.add.text(width / 2, height / 2 - 5,
      `Final Sales: ¥${this.totalYen.toLocaleString("en-US")}`, {
        fontFamily: "Arial, sans-serif", fontSize: "28px", color: "#fff2c5",
      }).setOrigin(0.5).setDepth(21);
    const restart = this.add.rectangle(width / 2, height / 2 + 65, 200, 56, 0xb83232)
      .setDepth(21).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height / 2 + 65, won ? "Play Again" : "Restart", {
      fontFamily: "Arial, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#ffffff",
    }).setOrigin(0.5).setDepth(22);
    restart.once("pointerdown", () => {
      this.ingredients.clear(true, true);
      this.hazards.clear(true, true);
      this.scene.restart();
    });
    if (won) {
      for (let i = 0; i < 24; i += 1) {
        const star = this.add.star(width / 2, height / 2 - 70, 4, 2, 6,
          [0xffdc73, 0xffffff, 0xff98b6][i % 3]).setDepth(23);
        const angle = (Math.PI * 2 * i) / 24;
        this.tweens.add({ targets: star,
          x: width / 2 + Math.cos(angle) * 270,
          y: height / 2 - 70 + Math.sin(angle) * 180,
          alpha: 0, angle: 180, duration: 1000, ease: "Cubic.Out",
          onComplete: () => star.destroy(),
        });
      }
    }
  }

  updateIngredients(dt) {
    if (this.gameOver) return;
    const items = this.ingredients.getChildren();
    // Match the catch area to the enlarged plate.
    const plateBounds = new Phaser.Geom.Rectangle(
      this.plate.x - this.plateHalfWidth,
      this.plate.y - this.plateHeight / 2,
      this.plateHalfWidth * 2,
      this.plateHeight
    );

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.y += item.fallSpeed * dt;

      const type = INGREDIENT_TYPES[item.ingredientId];
      const itemBounds = new Phaser.Geom.Rectangle(
        item.x - type.width / 2, item.y - type.height / 2,
        type.width, type.height
      );
      if (Phaser.Geom.Intersects.RectangleToRectangle(plateBounds, itemBounds)) {
        if (this.completingSushi && item.ingredientId !== "rice") {
          item.destroy();
          continue;
        }
        if (item.ingredientId === "rice" && !this.plateRice) {
          this.plateRice = this.add.image(0, 7, "sushi-art", "rice");
          this.plateRice.setScale(54 / this.plateRice.width);
          this.sushi.add(this.plateRice);
        } else if (type.completedFrame && this.plateRice) {
          this.completeSushi(type);
        }
        item.destroy();
        if (this.gameOver) return;
        continue;
      }

      if (item.y - type.height / 2 > this.scale.height) {
        item.destroy();
      }
    }
  }

  completeSushi(type) {
    if (this.gameOver) return;
    this.completingSushi = true;
    this.plateRice.destroy();
    this.plateRice = null;
    // Animate only the completed sushi, keeping newly caught rice independent.
    const completedSushi = this.add.container(0, 0);
    this.sushi.add(completedSushi);
    const nigiri = this.add.image(0, 3, type.texture, type.completedFrame);
    nigiri.setScale(78 / nigiri.width);
    nigiri.setOrigin(0.5, 1).setY(18);
    completedSushi.add(nigiri);
    this.totalYen += PRICES[type.id];
    playEffect(this, ["uni", "chutoro"].includes(type.id) ? "premium-reward" : "reward");
    this.totalText.setText(`Sales: ¥${this.totalYen.toLocaleString("en-US")} / ¥${SALES_GOAL.toLocaleString("en-US")}`);
    if (this.totalYen >= SALES_GOAL) {
      this.endGame("win");
      return;
    }

    this.tweens.add({
      targets: completedSushi,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 130,
      yoyo: true,
      ease: "Sine.Out",
    });

    // A handful of tiny stars stays attached to the moving plate.
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * 40;
      const y = -10 + Math.sin(angle) * 28;
      const star = this.add.star(x, y, 4, 1.5, 5, 0xfff5bc);
      completedSushi.add(star);
      this.tweens.add({
        targets: star,
        x: x * 1.35,
        y: y - 12,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: "Sine.Out",
        onComplete: () => star.destroy(),
      });
    }

    this.tweens.add({
      targets: completedSushi,
      alpha: 0,
      delay: 800,
      duration: 250,
      onComplete: () => {
        completedSushi.destroy();
        this.completingSushi = false;
      },
    });
  }

  createPriceDisplay() {
    this.totalText.setDepth(3).setFontSize(20);
    const labels = ["Tuna", "Egg", "Shrimp", "Salmon", "Sea Eel", "Sea Urchin", "Fatty Tuna"];
    MENU.forEach(({ price }, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      this.add.text(275 + column * 130, 10 + row * 19,
        `${labels[index]} ${price.toLocaleString("en-US")} Yen`, {
          fontFamily: "Arial, sans-serif", fontSize: "12px",
          color: "#24343b",
        }).setDepth(2);
    });
  }
  createFoodTextures() {
    for (const [id, frames] of Object.entries(EXTRA_TOPPINGS)) {
      const texture = this.textures.get(`${id}-art`);
      if (!texture.has(id)) {
        texture.add(id, 0, ...frames.topping);
        texture.add("nigiri", 0, ...frames.nigiri);
      }
    }
    const chutoro = this.textures.get("chutoro-art");
    if (!chutoro.has("chutoro")) {
      chutoro.add("chutoro", 0, 34, 242, 970, 320);
      chutoro.add("nigiri", 0, 1092, 226, 936, 354);
    }
    const atlas = this.textures.get("sushi-art");
    if (atlas.has("rice")) return;
    atlas.add("rice", 0, 108, 38, 616, 282);
    atlas.add("fish", 0, 764, 44, 736, 279);
    atlas.add("nigiri", 0, 410, 322, 716, 279);
    atlas.add("plate", 0, 16, 607, 1504, 383);
  }
}
