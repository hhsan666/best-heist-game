# best-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/hhsan666/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/hhsan666/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

HUSHLINE: a top-down stealth heist for the browser. Read guard vision cones and sweeping cameras, sneak through shadows, spend coins, smoke and jammers from your take, crack the loot case and reach the hatch before the alarm meter hits lockdown.

Three jobs in one night (Orchid Annex, Copperline Bonded Store, The Lantern Atrium), each a room with several routes to the loot. Guards walk their beats and grow suspicious before they chase; cameras sweep and fill the alarm; teal shadow pools hide you unless a guard is right beside you. Every tool you use is paid out of the take, so the best heist is the one you planned.

Controls: WASD or arrows to move, hold Shift to sneak (silent), hold E to crack the case, 1/2/3 or the mouse wheel to pick coin, smoke or jammer, click to use it, P or Esc to pause, M to mute. All art is drawn on a canvas and all sound is synthesised with Web Audio: no asset files, no network requests.

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
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
