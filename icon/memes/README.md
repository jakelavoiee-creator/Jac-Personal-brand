# Giorgi meme series: famous memes, Giorgi's face (batch 1)

Made with Higgsfield GPT Image 2.5 (high, 2k), with the v1 Giorgi sheet (`3bc4d307…`) as the identity reference. Prompts describe each meme's pose, expression, framing and lighting in words. The original meme photos were never uploaded, so no real person's likeness carries over.

| # | Meme (expression) | Job | Full-res |
|---|---|---|---|
| 1 | "Time out" T-hands, unimpressed | `e7c7184c-3a09-4d7d-a4d8-b1de1216926a` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195054_e7c7184c-3a09-4d7d-a4d8-b1de1216926a.png) |
| 2 | Furious clenched-teeth close-up (pinstripe suit) | `2a053ba8-ada7-4152-81a2-b65c5aefdb29` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195223_2a053ba8-ada7-4152-81a2-b65c5aefdb29.png) |
| 3 | Smug side-eye smirk | `00d3f3ce-fe1e-4fdc-9317-bc3068d3c887` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195054_00d3f3ce-fe1e-4fdc-9317-bc3068d3c887.png) |
| 4 | Hide-the-pain smile with coffee mug | `cfbe7929-1e69-487d-bc48-618c0a8fd4e3` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195055_cfbe7929-1e69-487d-bc48-618c0a8fd4e3.png) |
| 5 | Suspicious eyebrow raise selfie | `6286ac00-62eb-42a7-af9d-60cb5627e482` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195055_6286ac00-62eb-42a7-af9d-60cb5627e482.png) |
| 6 | Hands-on-head total shock | `7d8682f9-f00d-47d8-9558-59fbe2f10cdd` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195055_7d8682f9-f00d-47d8-9558-59fbe2f10cdd.png) |
| 7 | Temple-tap "big brain" smirk | `b38d7aff-1e2c-4feb-8ee9-04ff26374d6a` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195056_b38d7aff-1e2c-4feb-8ee9-04ff26374d6a.png) |
| 8 | Crying-in-the-car, hands on cheeks | `e48bc177-822c-45e7-86cc-e8a612d60fd4` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195054_e48bc177-822c-45e7-86cc-e8a612d60fd4.png) |
| 9 | Squished front-camera smirk in a tech store | `4e3a9e00-9c9f-4314-8c74-ec7899ec0594` | [png](https://d8j0ntlcm91z4.cloudfront.net/user_38WgIqfb8aRSLfJPTHATd2uH66Y/hf_20261009_195054_4e3a9e00-9c9f-4314-8c74-ec7899ec0594.png) |

QC (checked visually): the same Giorgi in all 9 (bowl cut, braids, warts, freckles, round glasses, braces). Expressions match the originals. #9's face squish is softer than the original.
Cost: ~12.4 credits (9 × high/2k).

## How to use them
- **Meme templates:** post each one as a blank template with "use this, tag @itsgiorgi". Other meme pages reusing it is the growth engine (the "movement" angle).
- **Reaction posts:** Giorgi meme + a relatable caption line on top (classic meme format). Shares go up.
- **Carousel:** "Giorgi replaced every meme" (all 9 in one post). Saves and shares go up.

## Classic meme posts (local, no Higgsfield)
`icon/tools/meme_post.py` builds a 1080×1350 post: white top bar, one black Montserrat ExtraBold line, image cover-fit below, `@itsgiorgi` watermark bottom-right.
Captions for the 9 images: `captions.json`. Once the 9 images are saved as `1.png` … `9.png` in a folder:
```bash
python3 icon/tools/meme_post.py --batch icon/memes/captions.json IN_DIR icon/memes/posts
```

## Classic viral memes (batch 1, final)
`icon/memes/classic/01…09.jpg`: Impact-style (Anton) white text with black outline, top and bottom, on the image itself. Original aspect ratio at 1080 wide, small `@itsgiorgi` watermark.
Built locally with `icon/tools/meme_classic.py --batch icon/memes/classic.json icon/memes/src icon/memes/classic`. Lines auto-size and balance across lines.

| # | Meme | Top | Bottom |
|---|---|---|---|
| 01 | Time out | HOLD UP | YOU GUYS ARE GETTING PAID? |
| 02 | Furious | ME WHEN SOMEONE | SPOILS THE SHOW I'M WATCHING |
| 03 | Side-eye smirk | WHEN YOU HEAR YOUR NAME | IN SOMEONE ELSE'S CONVERSATION |
| 04 | Hide the pain | "HOW ARE YOU DOING?" | "I'M FINE" |
| 05 | Eyebrow raise | WHEN SOMEONE SAYS | THEY DON'T LIKE PIZZA |
| 06 | Shock | WHEN YOU REALIZE | TOMORROW IS MONDAY |
| 07 | Temple tap | CAN'T GET FIRED | IF YOU NEVER GO TO WORK |
| 08 | Crying in car | WHEN THE GROUP CHAT | MAKES PLANS WITHOUT YOU |
| 09 | Squished face | POV: | YOU'RE MY FRONT CAMERA |
