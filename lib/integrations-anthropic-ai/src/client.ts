import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY must be set. Get your key from https://console.anthropic.com/account/keys",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string, unknown>)[prop as string];
  },
});
