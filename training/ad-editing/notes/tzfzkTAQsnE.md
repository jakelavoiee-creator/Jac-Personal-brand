---
url: https://www.youtube.com/watch?v=tzfzkTAQsnE
video_id: tzfzkTAQsnE
title: 3 Sound Design Secrets That Feel Like CHEATING
channel: Herman Huang
why_studied: sound design
watched_by: gemini-3.6-flash
studied_at: 2026-10-28 07:32 UTC
---

## Title & channel
* **Channel:** Herman Huang
* **Video Title:** 3 Sound Design Techniques (HH 2025)

---

## One-line thesis
High-level video editing requires treating audio as a layered 3D spatial experience—using multi-frequency sound layering, stylistic consistency, carved-out EQ pockets for voiceover, and seamless music transitions to drive emotional engagement and brand perception.

---

## Editing techniques

### 1. Multi-Frequency Audio Layering (High / Mid / Low Whooshes)
* **What it is:** Stacking distinct sound elements tuned to low, mid, and high frequencies to build a rich, impactful composite sound effect (e.g., a heavy movement or transition).
* **WHEN to use it:** Large, dramatic visual movements, fast camera swoops, product reveals, or high-energy streetwear transitions.
* **Parameters:**
  * **Duration:** 0.25s – 0.75s per layer.
  * **Low Frequency:** 10 Hz – 100 Hz (sub-bass / weight / boom).
  * **Mid Frequency:** 100 Hz – 1 kHz (body / crunch / texture).
  * **High Frequency:** 1 kHz – 40 kHz (air / whip / clarity).
  * **Audio Track Stacking:** 3 dedicated audio channels (A1: High, A2: Mid, A3: Low) aligned precisely at the impact frame.

### 2. Music Frequency Carving via DeEsser (Voiceover Pocket EQ)
* **What it is:** Misusing the Premiere Pro DeEsser plugin on a music track to notch out mid-high frequencies where human voice resides, creating an instant spectral "pocket" for dialogue without muffling the overall track.
* **WHEN to use it:** Whenever founder voiceover or UGC speech plays over music.
* **Parameters [01:41–01:50]:**
  * **Effect:** Premiere Pro `DeEsser` applied directly to Music Clip.
  * **Mode:** Multiband.
  * **Center Frequency:** `2910 Hz` – `3000 Hz`.
  * **Bandwidth:** `5418 Hz`.
  * **Gain Reduction:** `-30 dB`.
  * **Result:** Clears out the 2.5 kHz – 6 kHz range specifically for speech clarity while keeping music low-end and high-end crisp.

### 3. Reversed-Beat Riser Music In-Transition
* **What it is:** Cutting the first beat or final tail of a track, reversing its speed, and placing it before the music drop as a custom swell that matches the song's key and texture.
* **WHEN to use it:** Introducing a new song section, transitioning from talking-head to high-energy B-roll, or returning from a quiet moment.
* **Parameters [05:15–05:35]:**
  * **Clip Speed / Duration:** `-100%` (`Reverse speed` checked).
  * **Duration:** ~0.5s – 1.2s (1 to 2 beats before the downbeat).
  * **Crossfade:** Exponential fade into the main music start frame.

### 4. Nested Sequence Reverb Tail Out-Transition
* **What it is:** Cutting a song on the final beat, nesting the final beat, extending the nested container, and applying heavy studio reverb so the music rings out cleanly into silence or voiceover.
* **WHEN to use it:** Ending a video promo, hard stopping music for a punchline/hook, or transitioning out of a song segment.
* **Parameters [05:50–06:33]:**
  * **Step 1:** Cut track exactly before the next downbeat.
  * **Step 2:** Right-click clip slice -> `Nest...`.
  * **Step 3:** Open nested sequence, duplicate clip, disable duplicated clip (`V`), and drag it 2–3 seconds down the timeline to force the nest sequence boundary open.
  * **Step 4:** On main timeline, apply `Studio Reverb` to the nested clip.
  * **Preset:** `Great Hall` (or `Drum Plate (medium)`).
  * **Decay:** ~2500 ms – 4000 ms.
  * **Dry/Wet Mix:** 25% Dry / 75% Wet.
  * **Volume Automation:** S-curve exponential volume decay over 1.5s to 3.0s on the underlying dry track while reverb rings out.

---

## Hook construction (First 0–3s)
* **Visual [00:00–00:03]:** Rapid 3-shot montage:
  1. Blur cityscape / dark aesthetic [00:00].
  2. Extremely tight macro shot of hand doomscrolling smartphone on dark couch [00:01].
  3. Extreme close-up of eye glasses reflecting phone screen glow [00:02].
* **Text [00:01]:** "DOOMSCROLLING ON MUTE" (Transcribed narrative hook delivered via voiceover).
* **Sound [00:00–00:03]:** Distorted low hum, subtle click-scroll sound effects, deep sub-bass drop, immediately building suspense. Ends with a sharp TV static glitch cut [00:15].

---

## Captions & on-screen text
* **Font Style:** Clean, high-tech geometric sans-serif (e.g., *Satoshi*, *Akira Expanded*, or *Helvetica Now Display* in bold uppercase).
* **Color Palette:**
  * Primary Text: Pure White (`#FFFFFF`).
  * Accent Containers / Cards: High-visibility Red (`#FF1E27` / `#FF0000`).
  * Grid Lines: Dark Charcoal / Neon Red outlines (`#111111` / `#FF0000`).
* **Positioning:**
  * Top-Right Badge: Fixed brand tag `HH 2025` [00:17].
  * Center Screen: 3 distinct UI card widgets with bold numbering ("1 AUDIO SPECTRUM", "2 COHERENT SOUNDS", "3 MUSIC TRANSITIONS").
  * Bottom Left: Small technical indicator tag (`01 SOUND DESIGN TECHNIQUES`).
* **Words per line:** 1 to 3 words maximum per graphic callout line.
* **Animations:** Snappy 2-frame digital flicker, sliding card highlight box on section changes, red glow activation.

---

## Sound design

### SFX Types & Placement
1. **Whooshes / Swells:** Placed 4–6 frames prior to visual cut points, layered across High, Mid, and Low frequencies.
2. **Glitch / TV Static:** Placed precisely over fast whip-pans, screen transitions, and chapter title card pops [00:15, 01:23, 07:16].
3. **Card Flipping / Paper Handling:** High-frequency click/snap SFX accompanying hands-on product/card manipulation scenes [00:59–01:04].
4. **Nature Sounds Mismatch ("Emotional Realism") [04:14–04:35]:**
   * *Visual:* Pouring coffee grounds / boiling water.
   * *Audio:* Glacier ice crackling (`Gravel Swoosh`, `Gravel Slide`), deep ocean wave crashing (`Big Ocean Wave`), gravel landslide sliding.
5. **Impacts / Slams / Hits:** Layered on music drop cut-points, hard visual cuts, or high-energy streetwear moves [06:54–07:09].

### Music & Voiceover Levels
* **Voiceover Target:** `-6 dB` to `-3 dB` peak.
* **Background Music (Unprocessed):** `-18 dB` to `-24 dB`.
* **Background Music (with DeEsser Notch at 3 kHz):** Mixed at `-12 dB` to `-14 dB` without masking speech, creating a noticeably punchier, fuller background track.
* **Transition SFX:** Peaking between `-9 dB` and `-4 dB`.

---

## Pacing & structure

### Cut Rhythm & Pattern Interrupts
* **00:00–00:16 (Hook):** Ultra-fast montage (averaging 0.5s – 1.0s cuts) establishing the problem ("doomscrolling on mute").
* **00:17–00:32 (Intro Structure):** 3-card menu UI presentation; introduces the 3 core pillars + 3 cheat codes.
* **00:33–02:02 (Section 1):** Problem demo -> Single vs Layered SFX A/B test -> Solution -> Cheat Code (DeEsser EQ trick).
* **02:03–04:44 (Section 2):** Social proof / YouTube comment -> Promo A/B test (Random SFX vs Stylized Pack SFX) -> Concept of Style Consistency -> Cheat Code ("Emotional Realism").
* **04:45–07:16 (Section 3):** Music editing dilemma -> Reverse Beat Riser method -> Reverb Tail Nesting method -> Cheat Code (Swell/Impact SFX Layering).
* **07:17–07:21 (Outro):** Fast logo flicker / TV static exit cut.

### B-Roll Ratio
* **80% Motion / B-roll & Screen Demos** vs **20% A-roll Talking Head** (talking head is heavily intercut with Premiere Pro UI screen recordings, graphics, and film clips).

---

## Motion graphics / animations
* **Tech Grid Backdrop:** Dark background with thin grid overlay lines (100px square spacing).
* **UI Cards (Selection Cards):**
  * 3 vertically stacked tall rounded cards [00:17].
  * Active card highlights with red outline glow and dark red gradient fill (`#FF0000`), accompanied by a low sub-bass pulse.
* **Audio Waveform Visualizer [00:59–01:05]:** Dynamic audio spectrum analyzer widget anchored to on-screen hand movement, labeled `HIGH WHOOSH`, `MID WHOOSH`, `LOW WHOOSH`.
* **Frequency Spectrum Diagram [01:06–01:10]:** 3 color-coded rectangular boxes dividing the spectrum:
  * Low (Red): 10Hz – 100Hz.
  * Mid (Yellow): 100Hz – 1kHz.
  * High (Cyan): 1kHz – 40kHz.

---

## Workflow & tools
* **NLE Software:** Adobe Premiere Pro.
* **Key Built-in Plugins Used:**
  * `DeEsser` (Amplitude and Compression)
  * `Studio Reverb` (Reverb)
  * `Nest` Sequence functionality
  * `Clip Speed / Duration` (Speed: `-100%`)
* **Aspect Ratio & Resolution:**
  * Timeline Resolution: 1920x1080 (horizontal master), with B-roll cropped in vertical/square containers for screen-in-screen demos.
* **Frame Rate:** 23.976 fps.
* **Export Target:** H.264 / MP4, VBR 2-pass, Target Bitrate 20 Mbps, Audio AAC 320 kbps 48 kHz.

---

## Mistakes / warnings
* ❌ **Single-Layer SFX:** Using a single generic whoosh for big dramatic camera/product moves makes edits sound cheap, thin, and flat.
* ❌ **Genre-Mismatched SFX:** Using corporate dings or generic UI clicks on edgy streetwear, athletic, or cinematic footage breaks visual immersion.
* ❌ **Abrupt Music Cuts:** Hard cutting a music track without a reversed riser or a reverb tail sounds like "slamming on the brakes" and destroys viewer flow.
* ❌ **Over-relying on Auto-Remix Tools:** Automatic AI remixing frequently misses key visual sync points; manual edit control with custom risers/reverb tails produces far superior pacing.
* ❌ **Muddy Voiceovers:** Simply turning music volume down still causes frequency masking between vocal formants and music mid-range.

---

## Reproduction recipe with ffmpeg/scripts

*(Best-effort extrapolation translating the Premiere Pro audio techniques into python and ffmpeg command-line tools)*

### 1. Reverse Audio Riser Snippet (ffmpeg)
Extract a 1-second snippet from the start of a music track (`music.mp3`), reverse it, and save it as a riser (`riser.wav`):

```bash
# Extract first 1.0s of song, reverse audio, and apply exponential fade-in
ffmpeg -i music.mp3 -ss 00:00:00 -t 1.0 -filter_complex "areverse,afade=t=in:ss=0:d=1.0" riser.wav
```

### 2. Voiceover & Music Pocket EQ Carving via `equalizer` (ffmpeg)
Notch out the 3 kHz frequency band on the background music track by -25 dB with a wide bandwidth so the voiceover sits clearly in the mix:

```bash
ffmpeg -i music.mp3 -i voiceover.wav -filter_complex \
"[0:a]equalizer=f=3000:width_type=h:width=3000:g=-25[carved_music]; \
 [carved_music][1:a]amix=inputs=2:duration=first:weights=0.3 1.0[outa]" \
-map "[outa]" -c:a pcm_s16le output_mix.wav
```

### 3. Reverb Tail Out-Transition Script (Python + pydub / ffmpeg)
Create a clean reverb tail at a specific cut point using `aecho` / `freeverb` filters:

```python
import subprocess

def generate_reverb_tail(input_audio, cut_time_sec, output_audio):
    # Cuts audio at cut_time_sec, applies heavy reverb tail and decay fade
    filter_graph = (
        f"atrim=end={cut_time_sec},"
        f"aecho=0.8:0.88:1000|2000:0.5|0.3,"
        f"afade=t=out:st={cut_time_sec}:d=2.5"
    )
    cmd = [
        "ffmpeg", "-y", "-i", input_audio,
        "-af", filter_graph,
        "-t", str(cut_time_sec + 2.5),
        output_audio
    ]
    subprocess.run(cmd, check=True)

# Example usage:
# generate_reverb_tail("streetwear_track.mp3", 15.0, "streetwear_track_reverb_end.wav")
```

---

## Top 7 takeaways for editing Aura Miami founder and UGC ads

1. **3-Layer Frequency Stacking for Streetwear Reveals:** When showing an Aura Miami hoodie drop, jacket zipper close-up, or model turn, stack three SFX layers: a sub-bass rumble (10–100Hz), a gritty mid-range fabric snap (100–1kHz), and a high-frequency crisp air whip (1–40kHz).
2. **Apply the DeEsser Music Notch on All Founder Talking Heads:** Don't just lower the music volume under the founder's voice. Apply a DeEsser notch filter to the music track cut at ~3000 Hz (-30dB gain reduction) so the founder's voice cuts through effortlessly without turning the beat muddy.
3. **Use Reverse-Beat Risers for Hook-to-B-Roll Drops:** Cut the first beat of your hip-hop/trap backing track, reverse it (`-100%` speed), and place it directly before the hook ends. It creates an organic swell that pulls the viewer into the UGC product montage.
4. **Enforce Audio Style Consistency:** Match Aura Miami's dark, premium streetwear aesthetic with dark, industrial, gritty transition SFX (sub-booms, heavy metal impacts, mechanical swooshes). Avoid cheerful corporate dings, bright pop chimes, or generic vlog sounds.
5. **Leverage "Emotional Realism" Sound Mismatching:** For cinematic hoodie or apparel close-ups, try swapping literal fabric sound effects with dramatic heavy nature sounds (e.g., distant thunder, roaring flames, or heavy seismic rumbles) to make the brand feel larger-than-life and visceral.
6. **Reverb-Tail the Beat on Hard Offers / CTAs:** When the founder stops talking to deliver the final Call-To-Action ("Link below to shop the Miami drop"), slice the music beat, apply a 3-second `Studio Reverb` (`Great Hall`), and let the music echo out smoothly while the screen displays the promo code.
7. **Overlay Impact SFX on Text & Product Callouts:** Pair every on-screen text graphic pop (e.g., "LIMITED DROP", "100% HEAVYWEIGHT COTTON") with a layered heavy sub-impact and swell to anchor visual attention on direct-response messaging.
