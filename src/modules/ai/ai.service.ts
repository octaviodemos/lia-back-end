import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import type {
  CatalogItemForRecommendation,
  ReformEvaluationResult,
  ReviewModerationResult,
} from './ai.types';

export type BookConditionEvaluation = {
  nota_conservacao: number;
  descricao_conservacao: string;
};

const MODEL_ID = 'gemini-1.5-flash';

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
      const raw = await this.geminiGenerateContent(apiKey.trim(), parts);
      return this.parseEvaluationJson(raw, fallback);
    } catch (err) {
      this.logger.warn(`Falha na avaliação Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  async moderateReview(texto: string): Promise<ReviewModerationResult> {
    const fallback: ReviewModerationResult = { aprovado: true, motivo: null, tem_spoiler: false };
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim()) {
      return fallback;
    }
    const prompt =
      'Atue como um moderador de comunidade de livros. Analise a seguinte resenha: ' +
      JSON.stringify(texto ?? '') +
      '.\n' +
      'Retorne EXCLUSIVAMENTE um JSON com as chaves:\n' +
      "- 'aprovado' (boolean - false se contiver xingamentos, ódio ou spam. true caso contrário).\n" +
      "- 'motivo' (string explicativa caso reprovado, ou null se aprovado).\n" +
      "- 'tem_spoiler' (boolean - true se revelar partes cruciais do final da história).";
    try {
      const raw = await this.geminiGenerateContent(apiKey.trim(), [{ text: prompt }]);
      const parsed = this.parseJsonFromGemini(raw) as Record<string, unknown>;
      const aprovado = parsed.aprovado === true;
      const motivoRaw = parsed.motivo;
      const motivo =
        motivoRaw === null || motivoRaw === undefined
          ? null
          : typeof motivoRaw === 'string'
            ? motivoRaw
            : String(motivoRaw);
      const tem_spoiler = parsed.tem_spoiler === true;
      return { aprovado, motivo: aprovado ? null : motivo, tem_spoiler };
    } catch (err) {
      this.logger.warn(`Falha na moderação Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  async evaluateReform(imagePaths: { path: string; type: string }[]): Promise<ReformEvaluationResult> {
    const fallback: ReformEvaluationResult = {
      gravidade: 'Indefinida',
      orcamento_estimado: 50,
      descricao: 'Não foi possível analisar automaticamente as imagens neste momento.',
    };
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim() || !imagePaths.length) {
      return fallback;
    }

    const promptText =
      'Atue como um especialista em restauração de livros antigos. Analise as fotos dos danos. Retorne EXCLUSIVAMENTE um JSON com as chaves:\n' +
      "- 'gravidade' (string: 'Leve', 'Média', 'Grave', 'Irreparável').\n" +
      "- 'orcamento_estimado' (number: valor em reais justo para o conserto, de 10 a 100).\n" +
      "- 'descricao' (string: laudo técnico resumido dos danos identificados e o que precisa ser feito).";

    const parts: Part[] = [{ text: promptText }];

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
      const raw = await this.geminiGenerateContent(apiKey.trim(), parts);
      const parsed = this.parseJsonFromGemini(raw) as Record<string, unknown>;
      const gravidadeRaw = parsed.gravidade;
      const gravidade =
        typeof gravidadeRaw === 'string' && gravidadeRaw.trim().length > 0 ? gravidadeRaw.trim() : fallback.gravidade;
      let orc = typeof parsed.orcamento_estimado === 'number' ? parsed.orcamento_estimado : parseFloat(String(parsed.orcamento_estimado));
      if (!Number.isFinite(orc)) orc = fallback.orcamento_estimado;
      orc = Math.min(100, Math.max(10, orc));
      const descricaoRaw = parsed.descricao;
      const descricao =
        typeof descricaoRaw === 'string' && descricaoRaw.trim().length > 0
          ? descricaoRaw.trim()
          : fallback.descricao;
      return { gravidade, orcamento_estimado: orc, descricao };
    } catch (err) {
      this.logger.warn(`Falha na avaliação de reforma Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  async recommendBooks(bookshelf: unknown, catalog: CatalogItemForRecommendation[]): Promise<number[]> {
    const catalogIds = new Set((catalog || []).map((c) => c.id));
    if (!catalogIds.size) {
      return [];
    }
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim()) {
      return [];
    }

    const bookshelfResumido = this.safeJsonSnippet(bookshelf, 14000);
    const catalogResumido = this.safeJsonSnippet(catalog, 14000);

    const prompt =
      'Atue como um livreiro experiente. O cliente tem a seguinte estante de livros lidos no Skoob: ' +
      bookshelfResumido +
      '.\n' +
      'Nossa loja possui os seguintes livros disponíveis: ' +
      catalogResumido +
      '.\n' +
      'Analise o gosto do cliente e escolha os 3 livros do nosso catálogo que ele mais gostaria de comprar.\n' +
      "Retorne EXCLUSIVAMENTE um JSON no formato: { 'recomendacoes': [id_1, id_2, id_3] }.";

    try {
      const raw = await this.geminiGenerateContent(apiKey.trim(), [{ text: prompt }]);
      const parsed = this.parseJsonFromGemini(raw) as Record<string, unknown>;
      const rec = parsed.recomendacoes;
      if (!Array.isArray(rec)) {
        return [];
      }
      const ids: number[] = [];
      for (const item of rec) {
        const n = typeof item === 'number' ? item : parseInt(String(item), 10);
        if (Number.isFinite(n) && catalogIds.has(n)) {
          ids.push(n);
        }
      }
      const unique = [...new Set(ids)];
      return unique.slice(0, 3);
    } catch (err) {
      this.logger.warn(`Falha nas recomendações Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  private safeJsonSnippet(value: unknown, maxLen: number): string {
    try {
      const s = JSON.stringify(value);
      if (s.length <= maxLen) return s;
      return s.slice(0, maxLen) + '…';
    } catch {
      return String(value).slice(0, maxLen);
    }
  }

  private async geminiGenerateContent(apiKey: string, parts: Part[]): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent(parts);
    return result.response.text();
  }

  private parseJsonFromGemini(raw: string): unknown {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const t = this.extractJsonObject(cleaned);
    return JSON.parse(t);
  }

  private extractJsonObject(text: string): string {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return text.slice(start, end + 1);
    }
    return text;
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
      const parsed = this.parseJsonFromGemini(raw) as Record<string, unknown>;
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
}
