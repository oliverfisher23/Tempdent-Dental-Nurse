---
name: Dial thermometer round
description: Why the fridge round uses an analogue dial the learner must read, and the rules that keep it honest.
---
The fridge round shows a hanging dial thermometer (ETI style, -30 to +30 °C, 1 °C ticks) instead of a digital probe readout. The learner clicks "Take the temperature", the mist clears, the needle settles with a small overshoot, and they type what they read.

**Why:** the owner asked for the temperature UI to work like the real dial in the photo so students have to take the reading themselves. Any digital reveal (settled feedback, Terence's spoken number, the notebook jotting the hidden value) defeats that, so none exist.

**How to apply:**
- Never print the unit's actual temperature in the round UI. The notebook records the learner's typed reading. The dial's accessible name gives the nearest half degree for screen-reader users only.
- Reading tolerance for the round is 0.7 °C (whole or half-degree readings pass, a full degree out fails). The 0.3 °C tolerance still applies to delivery and chill checks.
- Colour zones on the dial end at the unit's own limit (fish fridge green stops at 2 °C, freezer green up to -18) so the dial never shows a reading as safe that the board rejects.
- Panel layouts in the round are keyed to the panel width with container queries, not the viewport, because the media column eats up to 46% of the stage in landscape.
- The e2e fridge round script still waits for a button named "Take the temperature", a `probe-display` testid after the click, and the exact reading error text mentioning "the probe".
