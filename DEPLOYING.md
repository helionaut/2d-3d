# Deploying 2D/3D Graphing Calculator

Production URL: https://helionaut.github.io/2d-3d/

## Deploy path

Production deploys run through
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml).

- Pull requests and issue branches publish a downloadable `static-preview-dist`
  artifact from [`pr-validation.yml`](.github/workflows/pr-validation.yml).
- Pushes to `main` rebuild the app, publish `dist/` to GitHub Pages, verify the
  live site against the freshly built artifact, and send the production URL to
  the configured Telegram topic.

## One-time repository setup

1. Enable GitHub Pages for the repository with `GitHub Actions` as the source.
2. Set the `TELEGRAM_BOT_TOKEN` GitHub Actions secret so successful production
   deploys can post the live URL back to Telegram.

## Preview validation

Run the standard validation gate before publishing a preview artifact:

```bash
npm run check
```

To preview the GitHub Pages-shaped artifact locally, run:

```bash
npm run preview:pages
```

Then open `http://127.0.0.1:4173/2d-3d/`.

## Production validation

After the `Deploy GitHub Pages` workflow finishes on `main`, confirm the live
artifact still matches the committed source with:

```bash
npm run build:pages
npm run verify:pages -- https://helionaut.github.io/2d-3d/
```
