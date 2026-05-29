const SPOILER_HEURISTIC_PATTERNS: RegExp[] = [
  /\bspoiler\b/i,
  /\balerta\s+de\s+spoiler\b/i,
  /\bno\s+final\b.+\b(morre|morreu|é|era|descobre|revela|acontece|vil[aã]o|assassino)\b/is,
  /\bdesfecho\b/i,
  /\bplot\s*twist\b/i,
  /\b(reviravolta|twist)\b/i,
  /\b(morre|morreu|matou|assassinou)\b.+\b(personagem|protagonista|her[oó]i|vil[aã]o)\b/i,
  /\b(morre|morreu)\b/i,
  /\brevela(r|ção)?\s+que\b/i,
  /\bdescobre(u|m)?\s+que\b/i,
  /\bna\s+verdade\s+(ele|ela|é|era)\b/i,
  /\b(último|ultimo)\s+cap[ií]tulo\b/i,
  /\bfinal\s+do\s+livro\b/i,
  /\bera\s+o\s+vil[aã]o\b/i,
  /\b(quem\s+(é|era)\s+o\s+(vil[aã]o|assassino|culpado))\b/i,
  /\b(é|era)\s+o\s+(assassino|vil[aã]o|culpado)\b/i,
];

export function detectSpoilerHeuristic(texto: string): boolean {
  const t = String(texto ?? '').trim();
  if (t.length < 12) {
    return false;
  }
  return SPOILER_HEURISTIC_PATTERNS.some((pattern) => pattern.test(t));
}

export function extractSpoilerFlagFromModel(parsed: Record<string, unknown>): boolean {
  const candidatos = [parsed.tem_spoiler, parsed.spoiler, parsed.has_spoiler, parsed.contem_spoiler];
  for (const valor of candidatos) {
    if (valor === true) {
      return true;
    }
    if (typeof valor === 'string') {
      const s = valor.trim().toLowerCase();
      if (s === 'true' || s === 'sim' || s === 'yes') {
        return true;
      }
    }
  }
  return false;
}
