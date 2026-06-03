# AinaSelf-

**Communication Mastery Blueprint** — a 5-module commute-driven learning engine.

## Usage

```bash
python comm_engine.py [morning | evening | off | complete]
```

| Command | Description |
|---------|-------------|
| `morning` | Show today's commute tracks + nightly reading (work day) |
| `evening` | Same as morning — use either on any work day |
| `off` | Show deep reading block + behavioral protocol for off days |
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

- `syllabus.json` — full program content and metadata
- `progress.json` — tracks current step and completed steps (auto-created)
- `comm_engine.py` — CLI engine
