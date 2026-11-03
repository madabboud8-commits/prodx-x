# X: the PRODX testing-lab assistant

X is a voice assistant for the PRODX testing room. You talk to it while you test, in Lebanese and English. It:

- identifies a product from a photo you send from your phone,
- finds the datasheet (brand site, then Alibaba, then Amazon and other shops),
- gives you the full test plan from the category's test file, then follows your lead,
- records your readings and saves them to the results archive,
- compares products, researches products you don't have yet, and drafts improved versions from evidence.

**X never interrupts you.** It answers only after you pause for 5 seconds, or right away when you finish with **"done"** or **"خلص"**. You can cut it off any time by talking.

X runs on your own computer. Its brain is Claude Code (your existing Claude login, no API key). Its voice is your ElevenLabs voice.

---

## Set up on Windows (one time)

You already have Node.js and Claude Code. Check both in **PowerShell**:

```powershell
node --version     # must be v20 or newer
claude --version   # Claude Code must be installed and logged in
```

If `claude` asks you to log in, do it once, then close it.

1. **Get the code**
   ```powershell
   cd $HOME\Documents
   git clone https://github.com/madabboud8-commits/prodx-x.git
   cd prodx-x
   npm install
   ```
   No git? Download the ZIP from the GitHub page (green **Code** button → Download ZIP), unzip, and open PowerShell in that folder.

2. **Add your ElevenLabs key** (never paste it in a chat)
   ```powershell
   copy .env.example .env
   notepad .env
   ```
   Paste your key after `ELEVENLABS_API_KEY=` and save. Get the key at elevenlabs.io → your profile → API keys.

3. **Start X**
   ```powershell
   npm start
   ```
   When it says the dev server is ready, open **http://localhost:5173** in **Chrome or Edge** (a normal window). Click **INITIALISE**, allow the microphone and camera, and say **"Hey X"**.

To stop X, press `Ctrl + C` in PowerShell.

---

## Using X in the testing room

| You say | X does |
|---|---|
| "Hey X" | Wakes up. After each answer it keeps listening for 2 minutes, no need to say "Hey X" again. |
| "Today we're testing a diesel heater … done" | Reads `lab/tests/heaters.md` and shows the full plan, then follows you step by step. |
| "Check the photo" | Looks at the newest photo in `lab/inbox` and identifies the product (top 3 matches if unsure). |
| "Find the datasheet" | Searches the specs and saves them to `lab/products/`. |
| "The power draw is 1,950 watts" | Repeats it back with the unit, then records it. |
| "Save the results" | Appends to `lab/results/results.csv` and writes a session report. |
| "Compare it with the last heater" | Shows a comparison table from the archive. |
| "How would you improve this?" | Writes a one-page brief and a supplier spec sheet from evidence, to `lab/innovation/`. |
| Talk while X is talking | X stops and listens. |

**Sending a photo from your phone:** save it into the `lab\inbox` folder on the computer (WhatsApp Web, Google Drive desktop, Phone Link, or USB). Then say "Hey X, check the photo".

**Keys:** `Space` talk without the wake word · `Esc` stand down · `D` diagnostics · `T` audio test.

---

## Settings (`.env`)

| Setting | Default | What it does |
|---|---|---|
| `ELEVENLABS_API_KEY` | none | Your voice and Lebanese + English understanding. |
| `X_VOICE_ID` | `oJQlz7pz2yWd7MRmDUXm` | X's voice. |
| `X_TTS_MODEL` | `eleven_flash_v2_5` | Try `eleven_multilingual_v2` if the Arabic sounds off (slower). |
| `VITE_END_PAUSE_MS` | `5000` | Pause before X answers. |
| `VITE_FOLLOW_UP_MS` | `120000` | How long X keeps listening after answering. |
| `X_EFFORT` | `high` | `low` answers faster on camera, `high` thinks more. |
| `X_LAB_DIR` | `lab` | Where test files, results and photos live. |

---

## What X may and may not do

- It may **read** anything it needs and **search the web**.
- It may **write only inside `lab/`** (test files, product files, results, briefs).
- Anything else that changes something (sending, posting, deleting, writing outside `lab/`) is blocked. `npm start -- --writes` unlocks it; you shouldn't need that for testing.

## Results in Google Sheets

X saves results to `lab/results/results.csv`. To view them in Google Sheets, use File → Import in Sheets. Writing straight into a Google Sheet needs a Google Sheets MCP server added to Claude Code on this computer (X can only use tools set up in Claude Code on the machine, not the ones connected on claude.ai).

## Before X appears in a video

- Label the video as AI-assisted / AI voice where the platform asks.
- If X's boot music is audible, credit it (see `public/audio/CREDITS.md`) or replace it.
- Disclose when PRODX sells the product being tested.

---

Built on [Jarvis](https://github.com/AzarPascale/jarvis) by Aditya Dewaskar, MIT License. See `NOTICE.md`. The original README is in `docs/UPSTREAM_README.md`.
