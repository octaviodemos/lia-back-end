export const GEMINI_MODEL_ID = 'gemini-2.5-flash';

export const GEMINI_MODEL_VISION_ID = 'gemini-2.5-flash';

export function parseJsonFromModelText<T extends Record<string, unknown>>(text: string): T | null {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }
  const cleaned = trimmed
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match?.[0]) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
}
