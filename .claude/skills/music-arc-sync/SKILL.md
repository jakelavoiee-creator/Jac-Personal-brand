---
name: music-arc-sync
description: Analyze a cinematic music track the user supplies, find its emotional build and drop, and align a reel's talk, b-roll and felt line to it. Use when a video should ride a music buildup.
---

# Music Arc Sync

Jacob wants cinematic music with an emotional buildup under his videos (for example emotional instrumental artists he picks). This skill works only from audio files he puts in `assets/music/`. Never download or rip music from Spotify or anywhere else. Personal audio mode: licensing is his responsibility. Note that Instagram can mute or flag baked-in copyrighted music; attaching the same track through Instagram's own audio picker at publish time is the safest route when it is available there, and the reel then exports with voice and SFX only.

## Analyze (one track at a time)
1. Decode to mono wav (`ffmpeg -i track -ac 1 -ar 22050`). Compute the RMS envelope in 0.1 s windows, onsets and tempo (pip install librosa, else scipy peak picking on spectral flux).
2. Find the build: a sustained rise of at least 6 dB over 6 s or more ending in a peak (the drop or release).
3. Choose the 15 to 30 s window that starts 3 to 8 s before the build and ends 1.5 to 3 s after the peak.
4. Write `music_map.json`: bpm, beat times, build start, drop time, quiet sections, chosen window, and a score for build quality. If several tracks are supplied, rank them and say why.

## Align the edit
- Talk section: music low under the voice (starting value 20 to 24 dB below the voice), with sidechain ducking while he speaks (`sidechaincompress` threshold 0.05, ratio 8, attack 20 ms, release 300 ms).
- B-roll section: the music rises with the build. Snap cuts to beats within 80 ms. Spike at least every 2.0 s.
- The felt line lands on the drop or the first beat after it. Leave a breath of silence or a dip right before it.
- Ending: hold 1.0 to 1.5 s, then a 1.0 s fade, or end on the downbeat for a loop-friendly finish.
- If the build is shorter than the video, trim the track and crossfade 0.5 s. If it is longer, start later in the track.
- Mix: voice about -17 LUFS final, SFX under the voice, never clipping.

## Output
`music_map.json`, the aligned `music_cut.wav`, and cue times written into `plan.json` for `reel-director`.
