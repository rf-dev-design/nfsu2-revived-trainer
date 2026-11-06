# Changelog

## 2.2.0
- Overlay restyled against screenshots of the running game: lime-framed dialog, grey list rows with key cells, pill buttons and a Bank box modelled on the HUD's
- Toasts now use the shape of the game's "now playing" card
- Panel opens in the free space between the minimap and the gauges, at any window size
- New font: Archivo Narrow Italic (SIL OFL 1.1, licence in `fonts-OFL.txt`), embedded because the site's CSP blocks font files
- New icon in the same style, with a simpler drawing for the 16 and 32 px sizes
- Fixed: Set Bank wrote $0 when the field was empty or not a number (Firefox lets you type letters there)
- Fixed: the offline-only gate only counted connected friends, not other players in the shared world. It now also checks that the game has left that world, and the panel's always-zero "Players Around" count is gone
- Firefox is now supported, tested on Firefox 159
- No changes to hotkeys or settings

## 2.1.0
- In-game styled overlay (Underground 2 colours, angled panels, race-style notifications)
- New icon
- Builds for Chromium, Firefox (experimental) and Safari (experimental)

## 2.0.0
- Rebuilt on the memory layout from Racer_S's original NFSU2 +10 Trainer
- Boost, instant 200 mph, super brakes, jump, move forward, infinite nitrous, nitrous refill, position save/warp, speed lock
- Car cheats locked to offline play

## 1.0.1
- Bank editor with the classic 0x861E74 address
