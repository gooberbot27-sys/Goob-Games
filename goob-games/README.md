# Goob Games

Static site (HTML/CSS/JS) + Scramjet v2 proxy. Deploys to Vercel straight from GitHub.

## Adding games (easiest way)
1. Make a folder: `public/assets/games/<game-name>/`
2. Put the game's files inside, with an `index.html` at the top.
3. (Optional) add `thumb.png` (or .jpg/.webp) for the cover image.
4. (Optional) add `meta.json`:  `{ "title": "Cool Game", "category": "Arcade" }`
5. Commit + push. The list builds itself on deploy.

Games hosted elsewhere? Add them by hand in `public/data/games.json`:
```json
[
  { "title": "My Game", "url": "https://example.com/game/", "image": "/assets/covers/mygame.png", "category": "Puzzle" }
]
```

## Adding movies
Option A — drop files in `public/assets/movies/`:
`the-first-flight.mp4`, optional `the-first-flight.jpg` (poster), optional `the-first-flight.json`:
`{ "title": "The First Flight", "year": 1903, "category": "Early Aviation", "description": "..." }`

Option B — list them in `public/data/movies.json` (best for big files hosted elsewhere or embeds):
```json
[
  { "title": "My Film", "year": 1925, "category": "Silent Era", "description": "…",
    "poster": "/assets/posters/film.jpg",
    "src": "https://archive.org/embed/YOUR_ITEM_ID" }
]
```
`src` can be an .mp4/.webm file (plays in a video player) or any embeddable page (YouTube /embed/, archive.org /embed/…).

## Site config
`public/js/config.js` — site name, wisp servers, search engines.

## Wisp server
`/wisp-server` is a tiny Node server. Vercel can't host it. Deploy it on Render/Railway/Fly/a VPS, then put its `wss://…/wisp/` URL in `config.js` → `wispServers.goob.url`.

## Local dev
```
npm install
npm run dev     # builds, then serves http://localhost:3000
```
