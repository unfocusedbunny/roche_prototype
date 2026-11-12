# Sangui: the page

The Sangui web page: React, with the 3D package from the 3D chat inside it.

## Run it

```bash
npm install
npm run dev        # opens a local address to look at while editing
npm run build      # writes the finished site to dist/
```

`npx vite build -c vite.single.config.js` writes one self-contained file to `dist-single/index.html`. That is only for previews that can host a single page.

## How it gets online

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the page and publishes it with GitHub Pages.

## Where things are

| File | What it is |
| --- | --- |
| `src/content.js` | Every word on the page. Change text here. `SHOW_GAPS` at the top shows or hides the "to come" notes. |
| `src/App.jsx` | The page: scroll, title page, step text, results column, controls. |
| `src/app.css` | Layout, colours, type sizes. |
| `src/sangui/` | The 3D package, copied from the 3D chat. Change it there, then copy it in again. |
| `scripts/check.mjs` | Drives the page in headless Chrome and saves screenshots. Needs `npm run dev` running. |

## The 3D package

`src/sangui/sangui-scene.js` is the 12 Nov package plus the cap fix from the same evening (the slit on top of the caps). When the 3D chat changes a file, replace the copy here.

three.js is pinned to 0.187.0. Don't let it float: the scene's colours depend on that version's settings.
