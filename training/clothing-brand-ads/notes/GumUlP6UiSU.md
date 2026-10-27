---
url: https://www.youtube.com/watch?v=GumUlP6UiSU
video_id: GumUlP6UiSU
title: I Made a $2,000 Studio Shoot for $0 (AI Workflow)
channel: Madebyizan
why_studied: AI fashion shoot direction
watched_by: gemini-3-flash-preview
studied_at: 2026-10-27 08:25 UTC
---

## Title & channel
* **Title:** Create your own AI Photoshoot in 5 minutes (Streetwear AI)
* **Channel:** madebyizan

## One-line thesis
Use the AI canvas tool Wivvy to build a multi-node workflow that generates consistent, high-fidelity studio e-commerce imagery (8 different poses/angles) for a clothing brand without physical samples, models, or photographers.

## Method (ordered, step by step)
1.  **Initialize Workflow in Wivvy:** Log into the Wivvy software (a node-based AI canvas tool) [00:43].
2.  **Create Base Image/Model:** Generate a "base" image of a model wearing simple clothing (e.g., a white T-shirt) to establish the model's appearance, ethnicity, and lighting [01:21].
3.  **Define the Garment:** Upload a high-quality mockup or design file of your product (e.g., a hoodie) into an image node. This becomes "Image 2" for reference [03:06].
4.  **Define Accessories (Optional):** Upload secondary reference images for details like specific zipper pullers or shoes into an image node. This becomes "Image 3" [03:08, 08:20].
5.  **Configure System Prompt:** Use a "System Prompt" node to enforce consistency. This node defines "Subject Lock" (model features) and "Wardrobe Lock" (garment details) [04:55].
6.  **Automate Prompt Generation:** Use a "Prompt Creator" node to generate 8 distinct prompts based on the system prompt and pose types (Relaxed, Dynamic, Seated, Profile, etc.) [04:59].
7.  **Map Nodes:** Connect the reference images (Garment, Accessories) and the generated text prompts to 8 separate "Nano Banana Pro" image generation nodes via a "Router" to ensure every generation references the same source files [07:37, 08:41].
8.  **Execute Generation:** Run the workflow to produce 8 separate images in 4K resolution [10:00].
9.  **Scale to Content:** Use the resulting images for website product pages, Meta ads, or social media content [00:35].

## Meta ads specifics
*   **None shown:** The video focuses entirely on creative production. The creator mentions the images are for "Ads" [00:38] but does not show campaign settings or the Ads Manager.

## Creative specifics
*   **Formats:** Static studio imagery intended for 4K resolution [00:33].
*   **Angles/Poses:** The workflow specifically mandates 8 distinct angles/poses to simulate a full professional photoshoot [04:59]:
    1.  Relaxed (Casual)
    2.  Relaxed (Loose shoulders)
    3.  Dynamic (Mid-movement)
    4.  Seated (On stool/floor)
    5.  Profile (90-degree side angle)
    6.  Hands-focused (Interacting with garment)
    7.  Cropped (Waist-up)
    8.  Editorial (Unconventional)
*   **Style:** Clean, high-key studio commercial look with minimal shadows [01:37].

## Claude / AI workflow
*   **Tools:** Wivvy (Canvas/Workflow), Nano Banana Pro (Image Model), ChatGPT (Prompt Engineering) [00:50, 01:21, 01:51].
*   **Custom GPT:** "Fashion Assistant Chat GPT" used for prompt engineering [01:51].
*   **Base Image Prompt [01:21]:** "Full-body studio fashion portrait of a tall Black male model standing casually against a seamless white background. He wears an oversized white short-sleeved T-shirt with a relaxed fit, clean silhouettes. Paired with very wide-leg, light blue denim jeans with heavy whiskering and vertical wear marks down the thighs, low-slung shape and stacked hem. Lighting soft even studio lighting with minimal shadows, high-key setup, clean commercial look. Looking directly at Camera."
*   **System Prompt [04:55]:** "reference while maintaining perfect consistency in subject, wardrobe, lighting, and environment. **SUBJECT LOCK (Embed in EVERY prompt)**: Male model with short dark hair, dark skin. Wearing the garment in image 2; vintage washed baggy denim jeans with heavy whiskering; black leather boots. - Environment: Light grey seamless studio backdrop. - Lighting: Soft diffused studio lighting; even illumination."
*   **Output Format Logic [05:28]:** "Each prompt starts with '^'. Every prompt MUST include: 'wearing the garment in image 2 that has the zipper in image 3'. Self-contained, copy-paste ready. No headers, no commentary, no explanations. Output 8 prompts only."
*   **Final Generated Prompt Example [10:12]:** "^Male model with short dark hair, dark skin, wearing the jacket in image 2 that has the zipper in image 3, standing in a relaxed casual stance with weight shifted to one leg, vintage washed baggy denim jeans with heavy whiskering visible below, black leather boots, light grey seamless studio backdrop, soft diffused studio lighting, even illumination, photorealistic 8k."

## Offer, product, landing page & Shopify CRO
*   **None shown:** Mentions images are for the "Website" [00:35] but no Shopify or CRO specific settings are displayed.

## Metrics & benchmarks quoted (with numbers)
*   **Cost:** $0 (excluding software subscriptions) [00:03].
*   **Resolution:** 4K [00:34] and 8K mentioned in prompts [10:12].
*   **Volume:** 8 poses per run [04:59].

## Mistakes / warnings called out
*   **Detail Consistency:** Warning that AI often fails to replicate specific small details (like a custom zipper puller) unless those details are provided as a separate reference image ("Image 3") [04:25].
*   **Credits:** Software (Wivvy) is paid; the user ran out of credits during the demonstration and could not run all 8 images simultaneously [10:03].

## Claims vs. evidence
*   **Claim:** Create a studio photoshoot with $0, no camera, and no models [00:03].
*   **Evidence:** The creator demonstrates a functional Wivvy workflow that takes a mockup of a blue/black hoodie and generates a photorealistic image of a model wearing that specific garment in a studio setting [11:58].

## Top 5 takeaways for a clothing brand media buyer
1.  **Eliminate Sample Wait Times:** You can generate high-converting "studio" ad creative before a single physical garment is sewn.
2.  **Enforce Multi-Node Consistency:** Use "Subject Lock" and "Wardrobe Lock" prompts combined with image-to-image reference nodes to ensure the model and product don't change between different ad variations.
3.  **Detail Injection:** If a product has a unique selling point (like a branded zipper or specific shoe), upload it as a separate reference image node to force the AI to include it accurately.
4.  **Instant Cataloging:** Use the 8-pose automated workflow to generate a full product page's worth of content in minutes, allowing for rapid testing of different "Editorial" vs. "Relaxed" hooks in ads.
5.  **Hybrid Realism:** The workflow allows "AI to Reality" transitions—generating a design that is so photorealistic it can be sent to a manufacturer as a tech-pack reference [12:47].
