# Digital Dartboard

A full-screen 3D dartboard in the browser. On load it asks for a target: type
text and press Enter, or pick an image. Then throw.

## Run locally

Requires Node.js 22.12+ or a current supported Node.js release.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally
`http://localhost:5173/digital-dartboard/`. The path comes from the `base`
setting in `vite.config.ts`, which GitHub Pages needs because the site is served
from a repository subpath.

## Play

- **Start prompt.** Type up to 120 characters and press Enter to pin it to the
  board. Press Enter on an empty field (or Escape) to play the plain board.
- **Images.** Use the area under the text box: paste an image from the
  clipboard, drop a file onto it, or click to browse. JPG, PNG, WebP, and GIF up
  to 10 MB. The image is pinned immediately and cropped to a square. Pasting
  works anywhere in the prompt, so Ctrl+V on load is enough.
- **Throwing.** Click or tap where you want the dart to land; there is no random
  accuracy penalty. With the board focused, arrow keys aim and Space or Enter
  throws.
- **Scoring.** Each hit flashes its value over the board. The thin outer ring is
  a double, the thin middle ring is a triple, the outer bull scores 25, and the
  bullseye scores 50. Scoring works under the paper too.
- **Controls.** _New target_ reopens the prompt and starts a new session,
  _Clear_ removes the darts, and the speaker button mutes sound. Reduced-motion
  preferences are respected.

The app runs entirely in the browser. Text and images are kept in memory, never
uploaded, and cleared when the page reloads. Fonts are bundled locally. No API
keys or backend are needed.

## Build and verify

```sh
npm run build
npm run preview
npm test
npm run test:e2e
```

The browser suite uses a local Chrome installation and covers the start prompt,
scoring, click and keyboard throws, image upload, paste, validation, resets,
sound, and full-screen layout at three viewport widths. It saves screenshots in
`test-results/`.

## Implementation

React, TypeScript, Vite, and Three.js. The wood, sisal board, paper, and metal
darts are generated in code. Audio uses the Web Audio API. The 3D scene requires
a browser with WebGL 2 support.

## Deployment

`.github/workflows/deploy.yml` builds the site on every push to `main` and
publishes `dist/` to GitHub Pages. The repository’s **Settings → Pages →
Source** must be set to **GitHub Actions**; the default "Deploy from a branch"
serves the unbuilt source and renders a blank page.

If you fork or rename the repository, update `base` in `vite.config.ts` to match
the new path, or the built asset URLs will 404.

The production output is `dist/` and can be hosted on any static web host. For a
host that serves from the domain root, set `base` back to `"/"`.
