# X's lab folder

X reads and writes here. It is the only place on disk X may write without write mode.

| Folder | What goes in it |
|---|---|
| `inbox/` | Photos from your phone. Save or drop the photo here, then say "Hey X, check the photo". Photos are not uploaded to GitHub. |
| `tests/` | One test file per category. `heaters.md` is the first real one; the others are drafts X expands with research and you approve. |
| `products/` | One file per product: what it is, the claimed specs, and where each number came from. |
| `results/` | `results.csv` is the archive (one row per measured claim). One report per test session. |
| `innovation/` | Improved-version briefs and supplier spec sheets. |

**Google Sheets:** X writes `results.csv`. To see it in Google Sheets, import it (File → Import), or later connect a Google Sheets MCP server to Claude Code so X can write to the sheet directly.

**Rule:** every number in `results/` is a real measurement you read out. Every number in `products/` has a source, or says "not found".
