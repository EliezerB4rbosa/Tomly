# TomLy

TomLy is a mobile-first songbook for bands. It organizes chord sheets, instrument versions, scales, and weekly set lists in separate band workspaces.

## Project structure

- `web/` contains the responsive interface, authentication screens, image OCR, and print controls.
- `worker/runtime.js` serves the app and its API on the Site Worker.
- `drizzle/` contains the D1 database migration for accounts, bands, and isolated band data.
- `scripts/` embeds web assets into the Worker and builds the deployable artifact.

## Build

Requires Node.js and Bash (Git Bash on Windows works).

```sh
node scripts/embed-assets.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

The build writes the Worker bundle to `dist/server/index.js`.

## Hosting

TomLy is hosted as a Cloudflare Worker through OpenAI Sites and uses a D1 binding named `DB`. Configure `ADMIN_SETUP_TOKEN` and `SESSION_SECRET` as secret runtime environment variables in the Site settings. Never store those values in this repository.
