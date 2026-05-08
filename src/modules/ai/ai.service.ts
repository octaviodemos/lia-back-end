import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

export type BookConditionEvaluation = {
  nota_conservacao: number;
  descricao_conservacao: string;
};

const PROMPT_TEXTO =
  'Você é um avaliador rigoroso de livros físicos de um sebo. Analise estas fotos (categorizadas como Capa, Contracapa, Lombada, Miolo e Avarias).\n' +
  'Retorne EXCLUSIVAMENTE um objeto JSON válido com duas chaves:\n' +
  "- 'nota_conservacao' (número inteiro de 1 a 5, onde 5 é estado de novo, e 1 é muito danificado/faltando páginas).\n" +
  "- 'descricao_conservacao' (string detalhando os defeitos encontrados, ex: 'Lombada desgastada e páginas amareladas'. Se for nota 5, retorne 'Livro em perfeito estado').\n" +
  'Não inclua markdown de formatação como ```json, retorne apenas o objeto puro.';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  async evaluateBookCondition(imagePaths: { path: string; type: string }[]): Promise<BookConditionEvaluation> {
    const fallback: BookConditionEvaluation = {
      nota_conservacao: 3,
      descricao_conservacao: 'Avaliação automática indisponível no momento.',
    };

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim()) {
      return fallback;
    }

    if (!imagePaths.length) {
      return fallback;
    }

    const parts: Part[] = [{ text: PROMPT_TEXTO }];

    for (const item of imagePaths) {
      let absolutePath = item.path;
      if (!path.isAbsolute(absolutePath)) {
        absolutePath = path.resolve(process.cwd(), item.path.replace(/^\//, ''));
      }
      if (!fs.existsSync(absolutePath)) {
        this.logger.warn(`Arquivo de imagem não encontrado: ${absolutePath}`);
        continue;
      }
      const buffer = fs.readFileSync(absolutePath);
      const mimeType = this.mimeTypeFromPath(absolutePath);
      parts.push({ text: `Categoria da foto seguinte: ${item.type}` });
      parts.push({
        inlineData: {
          mimeType,
          data: buffer.toString('base64'),
        },
      });
    }

    const imagePartCount = parts.filter((p) => 'inlineData' in p && p.inlineData).length;
    if (imagePartCount === 0) {
      return fallback;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(parts);
      const raw = result.response.text();
      return this.parseEvaluationJson(raw, fallback);
    } catch (err) {
      this.logger.warn(`Falha na avaliação Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  private mimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return map[ext] || 'image/jpeg';
  }

  private parseEvaluationJson(raw: string, fallback: BookConditionEvaluation): BookConditionEvaluation {
    try {
      const cleaned = this.stripCodeFences(raw.trim());
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const notaRaw = parsed.nota_conservacao;
      const descRaw = parsed.descricao_conservacao;
      let nota = typeof notaRaw === 'number' ? Math.round(notaRaw) : parseInt(String(notaRaw), 10);
      if (Number.isNaN(nota)) nota = fallback.nota_conservacao;
      nota = Math.min(5, Math.max(1, nota));
      const descricao =
        typeof descRaw === 'string' && descRaw.trim().length > 0
          ? descRaw.trim()
          : fallback.descricao_conservacao;
      return { nota_conservacao: nota, descricao_conservacao: descricao };
    } catch {
      return fallback;
    }
  }

  private stripCodeFences(text: string): string {
    let t = text.trim();
    if (t.startsWith('```')) {
      t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }
    return t.trim();
  }
}
