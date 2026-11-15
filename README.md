# Sangui: the page

The Sangui web page: React, with the 3D package from the 3D chat inside it.

## Run it

```bash
npm install
npm run dev        # opens a local address to look at while editing
npm run build      # writes the finished site to dist/
```

## Check it

```bash
npm run check      # everything below, then a build: what GitHub runs before the page goes online
npm run lint       # ESLint: common JavaScript mistakes and React's rules for hooks
npm run format     # Prettier: lays the code out the same way everywhere
npm test           # the chart's sums, the survey data's shape, and that the words fit the data and the 3D
```

`npx vite build -c vite.single.config.js` writes one self-contained file to `dist-single/index.html`. That is only for previews that can host a single page.

## How it gets online

Every push to `main` runs `.github/workflows/deploy.yml`, which checks the code (lint, format, tests), builds the page and publishes it with GitHub Pages. If a check fails, nothing is published.

## Where things are

| File | What it is |
| --- | --- |
| `src/content.js` | Every word on the page, including the words on the 3D (`LABELS`). Change text here. `SHOW_GAPS` at the top shows or hides the "to come" notes. |
| `src/App.jsx` | The page: scroll, title page, step text, results column, controls. |
| `src/app.css` | Layout, colours, type sizes. |
| `src/tokens.css` | Colours and fonts, shared by both pages. |
| `how-it-was-made/index.html`, `src/about/` | The second page, "How Sangui was made". Its words are in `src/about/content.js`; `[MIMI: …]` notes show in yellow until they are replaced. |
| `src/links.js` | The Figma address and the CV's file name, used by both pages. |
| `public/` | Files served as they are: the CV, and screenshots in `public/how-it-was-made/`. |
| `src/crowd/` | The crowd chart ("the hill": try a number, try a crowd) and the sums behind it. Each value's starting number, its chart settings and every label are in `src/content.js`. |
| `src/data/crowds.json` | The survey data the chart draws: CDC NHANES 2015–2016, six groups for six values. |
| `src/sangui/` | The 3D package: the scene, the labels on top of it, and the title page's blobs. This folder is the only copy; edit it here. |
| `src/**/*.test.js` | The tests (`npm test`). |
| `eslint.config.js`, `.prettierrc.json` | What the linter checks, and how the code is laid out. |
| `scripts/check.mjs` | Drives the page in headless Chrome and saves screenshots. Needs `npm run dev` running. |

## The 3D package

The 3D started as a separate package and was copied in on 12 Nov 2026. Since then `src/sangui/` is the only copy that is kept up to date: it has the cap fix (the slit on top of the caps), takes its words from `src/content.js`, and uses the page's handwriting font. Edit it here; don't copy older files over it.

three.js is pinned to 0.187.0. Don't let it float: the scene's colours depend on that version's settings.
