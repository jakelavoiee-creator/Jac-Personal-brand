/**
 * Design assistant — Claude, called with the user's own Anthropic key
 * (PAID, billed by Anthropic). It sees the page as structured data plus a
 * rendered image, and answers with advice and concrete edits that the editor
 * applies as normal, undoable changes.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export const ASSISTANT_MODEL_DEFAULT = 'claude-opus-5-5';

function read(k: string) {
  try {
    return localStorage.getItem(`aura.key.${k}`) || '';
  } catch {
    return '';
  }
}
export const hasAnthropic = () => !!read('anthropic');
export const assistantModel = () => read('anthropicModel') || ASSISTANT_MODEL_DEFAULT;

function client() {
  const apiKey = read('anthropic');
  if (!apiKey) throw new Error('Add your Anthropic API key in Settings to use the design assistant (billed by Anthropic).');
  // The key stays in this browser and is sent only to api.anthropic.com.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/* ---------------- edit actions ---------------- */

const Action = z.object({
  type: z.enum(['set_text', 'set_style', 'move', 'set_background', 'add_text', 'delete']),
  /** layer id from the page description (null for set_background / add_text) */
  id: z.string().nullable(),
  /** short human summary shown to the user, e.g. "Headline → Playfair Display 96" */
  label: z.string(),
  text: z.string().nullable(),
  fill: z.string().nullable(),
  fontFamily: z.string().nullable(),
  fontWeight: z.number().nullable(),
  fontSize: z.number().nullable(),
  charSpacing: z.number().nullable(),
  lineHeight: z.number().nullable(),
  textAlign: z.enum(['left', 'center', 'right']).nullable(),
  opacity: z.number().nullable(),
  /** centre of the layer in page pixels */
  x: z.number().nullable(),
  y: z.number().nullable(),
  /** text box width in page pixels */
  width: z.number().nullable(),
  color: z.string().nullable(),
});
export type AssistantAction = z.infer<typeof Action>;

const Reply = z.object({
  reply: z.string(),
  actions: z.array(Action),
});
export type AssistantReply = z.infer<typeof Reply>;

const SYSTEM = `You are the design assistant inside Aura Studio, a professional graphic design editor. You act like a senior creative director: you give specific, confident direction and you make the edits yourself.

You receive the current page as JSON (layers with ids, types, text, fonts, colours, centre positions and sizes in page pixels) and a rendered image of it. The user may have layers selected; prefer acting on those.

How to answer:
- "reply": short and concrete, in plain sentences (no markdown headings). Name fonts, hex colours, sizes and ratios. Explain the why in one line where useful.
- "actions": the edits that implement your advice, or [] when the user only asked a question or the design should stay as it is. Each action needs a short "label". Set fields you are not changing to null.
  - set_text: replace a text layer's words (id, text).
  - set_style: change fill, fontFamily, fontWeight, fontSize, charSpacing (1/1000 em, e.g. 100 = +0.1em), lineHeight, textAlign or opacity of a layer (id + only the fields to change).
  - move: reposition a layer by its centre (id, x, y; width for text boxes).
  - set_background: page background colour (color).
  - add_text: new text layer (text, fontFamily, fontSize, fontWeight, fill, x, y, width, textAlign).
  - delete: remove a layer (id) — only when the user asks to remove something.
- Only use layer ids that exist in the page JSON. Keep everything inside the page bounds.
- Fonts: use Google Fonts families (e.g. Inter, Playfair Display, DM Serif Display, Space Grotesk, Cormorant Garamond, Syne, Fraunces, Manrope, Archivo, Bebas Neue) or fonts already used in the design or the brand kit.
- Respect the brand kit (colours and fonts) when one is provided, unless the user asks otherwise.
- Never invent facts about the user's business in copy; when copy needs specifics you don't have, write clearly marked placeholders.`;

export interface DesignContext {
  page: unknown;
  /** PNG data URL of the rendered page */
  image?: string;
  brand?: unknown;
}

export type ChatTurn = { role: 'user' | 'assistant'; text: string };

export async function askAssistant(history: ChatTurn[], ctx: DesignContext, signal?: AbortSignal): Promise<AssistantReply> {
  const c = client();
  const last = history[history.length - 1];
  const earlier: Anthropic.Beta.BetaMessageParam[] = history.slice(0, -1).map((t) => ({ role: t.role, content: t.text }));
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (ctx.image) {
    const [, mediaType, data] = /^data:(image\/(?:png|jpeg|webp));base64,(.*)$/.exec(ctx.image) ?? [];
    if (data) content.push({ type: 'image', source: { type: 'base64', media_type: mediaType as 'image/png', data } });
  }
  content.push({ type: 'text', text: `Current page:\n${JSON.stringify(ctx.page)}${ctx.brand ? `\n\nBrand kit:\n${JSON.stringify(ctx.brand)}` : ''}\n\nRequest: ${last.text}` });

  const res = await c.beta.messages.parse(
    {
      model: assistantModel(),
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(Reply) },
      system: SYSTEM,
      messages: [...earlier, { role: 'user', content }],
    },
    { signal },
  );
  if (res.stop_reason === 'refusal') throw new Error('The assistant declined this request.');
  if (res.stop_reason === 'max_tokens') throw new Error('The answer was cut off — try a narrower request.');
  if (!res.parsed_output) throw new Error('The assistant returned an unreadable answer — please try again.');
  return res.parsed_output;
}

/** Turn a short idea into a detailed image-generation prompt. */
export async function enhancePrompt(prompt: string, style: string): Promise<string> {
  const c = client();
  const res = await c.beta.messages.create({
    model: assistantModel(),
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system:
      'You write prompts for an image-generation model. Expand the user idea into one vivid paragraph (60–110 words): subject, setting, composition and framing, lighting, colour palette, materials and texture, mood. Keep the user intent and any named product exactly. No lists, no quotes, no preamble — output only the prompt.',
    messages: [{ role: 'user', content: `Idea: ${prompt}${style && style !== 'No style' ? `\nStyle direction: ${style}` : ''}` }],
  });
  if (res.stop_reason === 'refusal') throw new Error('The assistant declined this prompt.');
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  if (!text) throw new Error('No prompt came back — try again.');
  return text;
}
