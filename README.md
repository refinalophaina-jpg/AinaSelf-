# AinaSelf-

**Communication Mastery Blueprint** — a 5-module commute-driven learning engine.

## Usage

```bash
python comm_engine.py [morning | evening | off | scripts | complete]
```

| Command | Description |
|---------|-------------|
| `morning` | Show today's commute tracks + nightly reading (work day) |
| `evening` | Same as morning — use either on any work day |
| `off` | Show deep reading block + the 3 concrete Daily Exports for off days |
| `scripts` | Print the 5 structured conversation scripts (quick reference) |
| `complete` | Mark current step done and advance to the next module |

## Program Structure

5 sequential modules built around a 23-minute commute target:

1. Mapping the 3 Nested Conversations
2. Dismantling the Identity Quake
3. Establishing Conversational Safety
4. Mastering Internal Narratives
5. Overcoming the Loner Baseline

Each module assigns:
- **To-work audio** — podcast or video for the morning commute
- **From-work audio** — decompression/analysis content for the ride home
- **Nightly reading** — book chapter assignment before sleep

## Files

- `BLUEPRINT.md` — the master reference document (theory, scripts, 48-hour challenge)
- `syllabus.json` — full program content, daily exports, and quick-reference scripts
- `progress.json` — tracks current step and completed steps (auto-created)
- `comm_engine.py` — CLI engine

Keep `BLUEPRINT.md` open side-by-side with the CLI: the daily commands surface *what*
to do each day, while the blueprint carries the full *why* and the verbatim scripts.

## Web App

The repo also ships a full **Progressive Web App (PWA)** — a dark-theme, offline-capable learning hub that replaces the CLI for everyday use.

### What it does

- Tracks your current module (1–5) and marks steps complete
- Surfaces the day's commute audio, nightly reading assignment, and daily practice exports
- Provides a full reading library with expandable book and chapter summaries, key quotes, and key concepts
- Organises the full 5-episode audio queues (To Work + From Work) in a single scrollable Listen view
- Embeds YouTube segments directly (Watch view) and falls back gracefully to a podcast link when the episode is audio-only
- Stores all conversation scripts in a collapsible reference card with one-tap copy-to-clipboard
- Works fully offline after the first load (service worker caches all assets)

### Five navigation tabs

| Tab | Content |
|-----|---------|
| **Today** | Active module banner, commute audio cards, tonight's reading, daily practice exports, Mark Complete button |
| **Read** | Collapsible book library — three books, chapters auto-open to today's assignment |
| **Listen** | Full To Work + From Work audio queues; current episode highlighted |
| **Watch** | Live YouTube embed for video episodes; all video segments listed below |
| **More** | Conversation scripts (copy-ready), all 5 module cards, progress reset |

### Hosting on GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Source**, choose **Deploy from branch**.
3. Select the branch (`main` or the feature branch) and the root folder (`/`), then click **Save**.
4. GitHub will publish the app at `https://<your-username>.github.io/<repo-name>/`.

### Using on Tesla

Navigate to the hosted GitHub Pages URL in the Tesla browser. The layout is tuned for 15–17 inch landscape touchscreens with large tap targets and extra padding.

### Using on Phone

Open the hosted URL in Safari (iOS) or Chrome (Android), tap **Share → Add to Home Screen** for a full-screen, app-like experience with offline support.

### Using on Laptop

Visit the hosted URL in any modern browser. The layout adapts to the viewport width automatically — no installation needed.
