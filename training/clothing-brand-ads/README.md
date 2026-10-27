# Training Week: Clothing Brand Meta Ads

Claude's study log for running Jac's Meta ads.

- `queue.txt`: every video assigned or picked (url | title | channel | why)
- `notes/<video_id>.md`: structured study notes per video, with [mm:ss] timestamps
- `PLAYBOOK-DRAFT.md`: running synthesis across all sources
- Final output: `.claude/skills/clothing-brand-meta-ads/SKILL.md`

Method: Gemini watches each YouTube video natively (direct download is blocked from the cloud
server). The `watched_by` field in each note shows which model watched it. Notes from a `lite` model are lower confidence.

## Account baseline (2026-10-27)
- Meta ad account 1447739777174385 ("Jacob Lavoie"), connected via Adspirer
- 0 campaigns, 0 pixels → pixel + Conversions API setup comes before any Sales campaign
- Adspirer free tier: 15 tool calls/month (2 used). Not enough to manage live ads day to day.
