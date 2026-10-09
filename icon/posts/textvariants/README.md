# Giorgi text-hook variants: face-in-lens clip × 10

Made with `icon/tools/text_variants.py`. Each version has a unique overlay text, text style, trim/length (9.6–11.6s), zoom (1.00–1.06×), speed (1.00–1.05×, audio pitch-matched) and color grade. **Original audio kept.** Text sits mid-frame (56% down), so it's clear of his face and of the IG caption area.

| # | File | Goal | On-screen text | Caption (first line) | Pinned comment |
|---|---|---|---|---|---|
| 01 | `giorgi_txt01_comments.mp4` | Comments | WHAT'S HIS NAME? / WRONG ANSWERS ONLY | `go. Dumpling, bro. 🥟` | "best answer gets pinned" |
| 02 | `giorgi_txt02_follows.mp4` | Follows | DAY 1 OF DANCING / UNTIL SHE TEXTS BACK | `day 1. she hasn't seen it yet. Dumpling, bro. 🥟` | "follow so you see day 2" |
| 03 | `giorgi_txt03_shares.mp4` | Shares | SEND THIS TO YOUR / GROUP CHAT. NO CONTEXT. | `no context needed. Dumpling, bro. 🥟` | (none, let it breathe) |
| 04 | `giorgi_txt04_shares.mp4` | Shares | ME WALKING INTO WORK / AFTER A 3-DAY WEEKEND | `monday energy. Dumpling, bro. 🥟` | "send to your coworker" |
| 05 | `giorgi_txt05_comments.mp4` | Comments | RATE HIS MOVES 1-10 / BE HONEST | `be nice. or don't. Dumpling, bro. 🥟` | "I'm reading every score" |
| 06 | `giorgi_txt06_saves.mp4` | Saves | SAVE THIS FOR WHEN / YOU NEED SEROTONIN | `you'll need this later. Dumpling, bro. 🥟` | "save it. trust." |
| 07 | `giorgi_txt07_shares.mp4` | Shares | WHEN THE DJ PLAYS / YOUR SONG AT 2AM | `that one song. Dumpling, bro. 🥟` | "what's YOUR song?" |
| 08 | `giorgi_txt08_comments.mp4` | Comments | TAG SOMEONE WHO / DANCES EXACTLY LIKE THIS | `you know who. Dumpling, bro. 🥟` | "tag them, they won't be mad" |
| 09 | `giorgi_txt09_follows.mp4` | Follows | FOLLOW TO SEE IF HE / GETS A GIRLFRIEND | `the journey begins. Dumpling, bro. 🥟` | "updates daily" |
| 10 | `giorgi_txt10_shares.mp4` | Shares | ME AFTER ONE / ENERGY DRINK | `just one. Dumpling, bro. 🥟` | "how many cans was this" |

Every caption also ends with the required line on its own line:
`I made this with @higgsfield.ai genjutsu #higgsfieldpartner #higgsfield`

## Posting order (spread out, alternating goals)
01 → 03 → 09 → 05 → 06 → 07 → 02 → 08 → 04 → 10. Space them **at least 24h apart**. Posting near-identical footage the same day risks Instagram's reused-content down-rank, even with different text.
After 3 posts, compare **shares, saves, comments and follows per 1K views**, then move the winning goal's hook style up the queue.

## Make more
```bash
python3 icon/tools/text_variants.py SRC.mp4 OUTDIR Anton.ttf Montserrat-ExtraBold.ttf
```
Edit the `V` table in the script to change the texts. (Fonts: Anton and Montserrat ExtraBold, both OFL.)
