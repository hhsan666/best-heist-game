# best-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/hhsan666/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/hhsan666/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

HUSHLINE: a top-down stealth heist for the browser. Read guard vision cones and sweeping cameras, hide in shadows, pay for coins, smoke and jammers, crack the loot and escape before the alarm hits lockdown.

Three jobs in one night (Orchid Annex, Copperline Bonded Store, The Lantern Atrium), each a room with several routes to the loot. The room is dark: guards carry flashlights whose cones light the floor, cameras sweep pink beams and lock on, and laser tripwires blink on and off on a timer. Guards grow suspicious (a ? gauge) before they chase, and they are slower than you, so a chase can be shaken off round a corner or in shadow. Teal shadow pools marked SAFE hide you unless a guard is right beside you. Hold Q to case the room and see every guard beat and camera sweep. Every tool you use is paid out of the take, and each job ends with a tally and a style rank (GHOST, SHADOW, PRO, LOUD).

Controls: WASD or arrows to move, hold Shift to sneak (silent), hold E to crack the case, hold Q to case the room, 1/2/3 or the mouse wheel to pick coin, smoke or jammer, click to use it, P or Esc to pause, R to restart a job, M to mute. All art is drawn on a canvas and all sound is synthesised with Web Audio: no asset files, no network requests.

## Run it

```sh
# play: serve game/ with any static server, then open http://localhost:8080
python3 -m http.server 8080 -d game
# hand in: writes game/, screenshots/ and dossier.json to out/
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# retake the screenshots from the game's own scenes (needs Playwright)
node tools/take-screenshots.mjs screenshots
# headless autopilot playtest of every stage
node tools/playtest.mjs
# play the real page with keyboard and mouse in headless Chromium
node tools/browser-smoke.mjs out/smoke
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
