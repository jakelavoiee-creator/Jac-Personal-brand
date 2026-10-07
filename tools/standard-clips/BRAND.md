# AURA miami: content identity

## North star
**Too creative for nine to five.**
One famous moment, one truth, about 12–25 seconds. Faces everyone recognises say what you need to hear to build something of your own. The format is modelled on @hustlersrevivalofficial. Every reel ends on our mantra.

## Content rules
- **Huge, recognisable names only.** Streamers, YouTubers, podcasters, founders, athletes, and award-show speeches.
- **Recent.** Recorded in 2018 or later.
- **Highest-quality source.** Use the official channel's upload, 4K when it exists. Never use reuploads or compilations.
- **One truth per reel.** Cut on word boundaries and open on the line that hooks.
- **Positive frame.** Faith, discipline, belief and building are on-brand. Beefs, politics and dunking on people are not.
- **Music is added in Instagram**, using its licensed audio library.

## Roster
| Lane | Faces | Sources |
|---|---|---|
| Streamers | Kai Cenat, Marlon, Lacy, IShowSpeed, Druski | Streamer Awards, Streamys, official podcast appearances |
| Podcast voices | Joe Rogan, Patrick Bet-David, Alex Hormozi, David Goggins | JRE / JRE Clips, Valuetainment, official channels |
| Award speeches | Streamer Awards, Streamys, Grammys/BET/ESPYs acceptances | official award-show channels |
| Founders and athletes | billionaires, NFL/NBA/NHL players | official interviews, press conferences, documentaries |

**On hold: Andrew and Tristan Tate.** They face criminal charges, and Instagram and TikTok have banned Andrew Tate before. A reel featuring them can get the account restricted, and it ties AURA's name to the controversy. They stay off the roster unless the owner says otherwise.

## The locked template (`render_hr.py`)
| Zone | Spec |
|---|---|
| Canvas | 2160×3840 (4K) black 9:16. The 16:9 clip runs full-width across the middle, untouched and in its original colour |
| Open | Fades up from black (0.35s) |
| Captions | Inter Display, small, white, sentence case as spoken, 1–3 words at a time |
| Punchline | The key line as big stacked condensed caps, right-aligned, with one blackletter accent letter, on for about 2s on its cue word |
| Mark | Small AURA logo at 70% opacity, bottom-centre of the footage |
| End card | TOO CREATIVE™ / FOR NINE TO FIVE, centred, with the AURA mark (2.2s) |
| Audio | Original speech, dead air removed, loudness-normalised to −14 LUFS |

## Making a reel
1. Add the moment to `moments.json`: the YouTube id, start and end in seconds, `punch_from` (the cue word), `punchline` (lines split by `/`, with the accent letter in `[ ]`), and `caption` (the post caption).
2. On your own computer, run `python fetch.py moments.json` and then `python render_hr.py moments.json` (or `python render_hr.py moments.json m08-kai-clothing-brand` to render one). YouTube blocks downloads from cloud servers.
3. Post it, then add a trending sound in Instagram.
