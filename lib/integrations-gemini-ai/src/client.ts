import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY must be set. Get your key from https://aistudio.google.com/app/apikey",
    );
  }
  _client = new GoogleGenerativeAI(apiKey);
  return _client;
}

export const GEMINI_MODEL = "gemini-2.5-flash";

export type GeminiMessage = { role: "user" | "model"; parts: Part[] };

/** Single-turn text generation. */
export async function generateText(
  prompt: string,
  opts?: { system?: string; maxTokens?: number },
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: opts?.system,
    generationConfig: { maxOutputTokens: opts?.maxTokens ?? 3000 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** Single-turn generation with mixed content parts (text + inline file). */
export async function generateWithParts(
  parts: Part[],
  opts?: { system?: string; maxTokens?: number },
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: opts?.system,
    generationConfig: { maxOutputTokens: opts?.maxTokens ?? 3000 },
  });
  const result = await model.generateContent(parts);
  return result.response.text();
}

/**
 * Multi-turn streaming chat.
 * `history` is all previous turns (role "user" | "model").
 * `lastParts` is the new user turn, may include inline file data.
 * `onChunk` is called with each text chunk as it arrives.
 * Returns the full assembled response.
 */
export async function streamChat(
  opts: {
    system?: string;
    history: GeminiMessage[];
    lastParts: Part[];
    maxTokens?: number;
  },
  onChunk: (text: string) => void,
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: opts.system,
    generationConfig: { maxOutputTokens: opts.maxTokens ?? 8192 },
  });
  const chat = model.startChat({ history: opts.history });
  const result = await chat.sendMessageStream(opts.lastParts);
  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  return full;
}

export const gemini = {
  generateText,
  generateWithParts,
  streamChat,
  MODEL: GEMINI_MODEL,
};
