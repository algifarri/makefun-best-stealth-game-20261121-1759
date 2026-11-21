# makefun-best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/algifarri/makefun-best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/algifarri/makefun-best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**EMBER HEIST — a top-down stealth game.** You are Wren, a lantern-thief
slipping through a night museum. Lift every ember shard, then reach the teal
exit — unseen. Lantern-wardens patrol with vision cones that bend around
walls, crates and bushes; lamplight gives you away, bushes hide you, and a
full suspicion bar raises the alarm. Toss pebbles with the mouse to lure a
guard off his route, sneak with Shift when a cone sweeps your way, and clear
all three levels — the Quiet Gallery, the Lantern Court and the Ember Vault —
for the ghost bonus.

Runs entirely from static files in a desktop browser: no build step, no
network, no dependencies. WASD or arrows to move, Shift to sneak, click to
throw a pebble, P to pause, M to mute, R to restart. Title screen, HUD with
shards / lives / suspicion meter, pause, level-clear and victory cards, and
WebAudio footsteps, alarm stings and jingles synthesised in code.

The source is split one job per file under `game/src/` (config, random,
level, vision, guards, player, sound, game, render, input, shots, main).
`main.ts` is the hand-in program: it copies `game/` and `screenshots/` to
the output directory and writes `dossier.json` with the vendored make.fun
library.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ajkq5baq&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
