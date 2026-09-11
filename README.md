# MotionCards

A static gallery of 30 card animation styles, live previews, larger interactive demos, and reusable React / Next.js implementation prompts. Built with HTML, CSS, and vanilla JavaScript; no backend, database, runtime dependencies, or build step.

## Visibility repair

The original `index.html` ended inside an unfinished CSS declaration. It had no closing style tag, body content, or JavaScript, leaving the site blank. The repository history did not contain a complete version.

The repair preserves the original dark styling and restores the missing gallery using the repository's `Prompt` specification. All 30 cards are present in HTML before JavaScript runs. A script failure therefore leaves readable content instead of a blank page. Search and animation controls become available after initialization.

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. Use an HTTP server rather than opening `index.html` as a file because browsers restrict ES module loading on `file:` URLs.

## Use the gallery

- Search names, descriptions, or categories; search combines with the selected category.
- Open **View Demo** for an enlarged preview, navigation, motion details, and implementation prompt.
- Hover, tap, swipe horizontally, or focus a preview and press arrow keys / Enter to interact.
- **Pause animations** stops gallery autoplay; demos have separate pause controls.
- **Copy Prompt** copies the full implementation instructions. If clipboard access is unavailable, the demo selects its prompt for manual copying.
- Press Escape or the close button to dismiss a demo. Focus returns to the initiating control.

Motion respects the system's reduced-motion setting. Autoplay pauses offscreen, in hidden browser tabs, and behind an open demo. Static cards remain readable without JavaScript. Desktop, tablet, and mobile use three, two, and one columns respectively.

## Files

- `index.html`: complete static gallery and native dialog.
- `css/styles.css`: restored original theme, layout, and component styling.
- `css/animations.css`: preview geometry, responsive refinements, and accessibility styles.
- `js/data.js`: animation metadata.
- `js/prompts.js`: 30 separate prompts with their specific motion mechanics.
- `js/previews.js`: preview rendering, motion lifecycle, and reduced-motion handling.
- `js/interactions.js`: pointer, touch, keyboard, and clipboard helpers.
- `js/modal.js`: dialog content, controls, and focus restoration.
- `js/app.js`: initialization, search, and filtering.
- `tests/`: dependency-free regression checks.
- `Prompt`: original project specification, retained as reference.

Metadata and static gallery content must be updated together when adding or renaming a style. The miniature examples illustrate the motion; copied prompts specify how to implement it around existing React components while preserving their UI.

## Validation

Requires Node.js 18 or newer; no `npm install` is necessary:

```sh
npm test
```

Tests cover complete static HTML, local asset references, 30 unique prompts, finite preview transforms under reduced motion, and observer / frame cleanup. Browser checks performed during this repair covered search, empty results, category filtering, clipboard success, demo navigation, Escape / focus restoration, all 30 demo openings, and 375px / 1024px responsive layouts. No JavaScript errors were reported.

## Hosting

Serve `index.html`, `css/`, and `js/` together from the repository root on a static host such as the existing GitHub Pages site. Asset URLs are relative, so a project subpath is supported. No secrets, authentication, external scripts, analytics, or API calls are needed. Git history provides rollback; restore a known-good revision if a later change fails.

This repair is local until the changes are committed and pushed to the branch configured for Pages. No production deployment was performed.
