# portfolio-game-2
AME 294 Portfolio Game 2

**Course:** AME 294: Games and AI — Creating Games with Artificial Intelligence
**Assignment:** Portfolio Game 2 — Vibe-Coded Browser Game
**Student Name:** Koki Kamijima
**Project Title:** Catch Sushi
**Repository URL:** https://kkoki0808.github.io/portfolio-game-2/
**Itch.io URL (Optional Bonus):** 
Presentation URL:https://docs.google.com/presentation/d/1jBcWFmnUZN9gZdVm0UtxAPEMH4fFFZ50/edit?usp=sharing

# Sushi Catch 🍣

**Sushi Catch** is a 2D browser game created for **AME 294: Games and AI — Portfolio Game 2**.

The player controls a plate and catches falling ingredients to make sushi. The goal is to earn **¥10,000 in total sales** while avoiding large wasabi hazards.

The game was developed through an AI-assisted workflow using tools including Cursor, OpenAI Codex, ChatGPT, and ElevenLabs.

---

## How to Play

1. Move the plate left and right.
2. Catch **rice (shari)** first.
3. Catch a **topping (neta)** while rice is on the plate.
4. A completed sushi adds its price to your total sales.
5. Continue making sushi until your sales reach **¥10,000**.
6. Avoid the large wasabi hazards. Catching wasabi removes one life.
7. Lose all three lives and the game ends.

---

## Controls

- **Left Arrow:** Move left
- **Right Arrow:** Move right
- **Mute / Unmute Button:** Turn game audio on or off

---

## Reward — Damage — End

### Reward

Successfully completing sushi increases the player's total sales.

Different toppings have different values:

| Sushi | Price |
|---|---:|
| Egg | 120 Yen |
| Shrimp | 330 Yen |
| Tuna | 380 Yen |
| Salmon (Toro) | 520 Yen |
| Anago (Sea Eel) | 660 Yen |
| Chutoro (Medium Fatty Tuna) | 820 Yen |
| Uni (Sea Urchin) | 1,200 Yen |

Chutoro and Uni also use more luxurious reward sounds to communicate their higher value.

### Damage

The player starts with **3 lives**.

Catching a large wasabi hazard removes one life. Damage is communicated through the heart display, visual feedback, and a Damage sound effect.

### End

There are two end states:

- **Victory:** Reach or exceed **¥10,000 in total sales**.
- **Game Over:** Lose all 3 lives.

The player can restart the game after either end state.

---

## Audio Design

The game uses custom AI-generated audio to provide feedback for important gameplay events.

- Standard Sushi → Reward SFX
- Chutoro → Premium Reward SFX
- Uni → Jackpot Reward SFX
- Wasabi → Damage SFX
- ¥10,000 Sales Goal → Victory SFX
- 0 Lives → Game Over SFX
- Game Start → Japanese “いらっしゃいませ!” welcome voice

A Mute / Unmute control is also available during gameplay.

---

## AI Tools Used

### Cursor Agent
Used to scaffold the initial Phaser 3 browser-game structure and basic gameplay.

### OpenAI Codex
Used to implement and refine gameplay mechanics, game states, UI behavior, visual feedback, and audio integration.

### ChatGPT
Used for game design planning, prompt development, visual direction, debugging support, and workflow organization.

### ChatGPT Image Generation
Used to generate and refine visual assets including sushi ingredients, wasabi, and environmental artwork.

### ElevenLabs
Used to generate custom Reward, Damage, Victory, Game Over, premium reward, and Japanese welcome audio.

---

## Human-in-the-Loop Development

AI tools were used to help implement the game, but gameplay and design decisions were continuously reviewed through human testing.

Important human-directed decisions included:

- Requiring the player to catch rice before a topping
- Giving each sushi topping a different sales value
- Setting the final sales goal to **¥10,000**
- Using three lives
- Replacing the original rotten-sushi hazard with a large wasabi hazard
- Improving the position and appearance of completed sushi
- Allowing the player to prepare the next sushi during the completion animation
- Giving expensive sushi unique audio feedback
- Refining the Japanese sushi-restaurant visual style

---

## Project Documentation

The repository includes the project's AI development documentation:

- `PROMPT_LOG.md` — AI prompts, development workflow, debugging incidents, reflection, and asset attribution
- `README.md` — Project overview and gameplay documentation

---

## Technology

- HTML5
- JavaScript
- Phaser 3
- Browser-based gameplay
- AI-generated visual and audio assets

---

## Course

**Arizona State University**  
**AME 294: Games and AI — Creating Games with Artificial Intelligence**  
**Portfolio Game 2: Vibe-Coded Browser Game**

---

## Author

**Koki Kamijima**
