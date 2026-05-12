import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a professional cocktail menu copywriter. Given raw cocktail spec sheets, you write polished, evocative menu descriptions for each drink.

Guidelines:
- Keep each description to 2–3 sentences max
- Lead with the dominant flavor experience or mood, not the ingredients list
- Use sensory, evocative language appropriate for an upscale casual bar
- Preserve the drink's name exactly as given
- Group drinks under their original section headings (e.g. cocktails, slushies, non-alcoholic)
- For non-alcoholic drinks, do not use the word "mocktail" — describe them on their own terms
- Output clean text suitable for a printed or digital menu, no markdown symbols like ** or ##
- Do not add prices or extra commentary`;

export async function POST(req: Request) {
  const { specs } = await req.json();

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here are the cocktail specs:\n\n${specs}`,
      },
    ],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
