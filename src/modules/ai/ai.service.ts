import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, type LanguageModel } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import { GEMINI_MODEL_ID, GEMINI_MODEL_VISION_ID, parseJsonFromModelText } from './gemini.util';
import {
  JSON_ONLY_SUFFIX,
  buildBookConditionPrompt,
  buildCoverIdentificationPrompt,
  buildModerationPrompt,
  buildRecommendationsPrompt,
  buildReformPrompt,
  type BookshelfItemPrompt,
} from './ai.prompts';
import type {
  CatalogItemForRecommendation,
  CoverIdentificationResult,
  ReformEvaluationResult,
  ReviewModerationResult,
} from './ai.types';
import { IsbnLookupService, type BookMetadataLookupResult } from './isbn-lookup.service';
import { detectSpoilerHeuristic, extractSpoilerFlagFromModel } from './spoiler.util';

export type BookConditionEvaluation = {
  nota_conservacao: number;
  descricao_conservacao: string;
};

type ImageInput = { buffer: Buffer; mimeType: string; label?: string };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly isbnLookup: IsbnLookupService,
  ) {}

  async evaluateBookCondition(imagePaths: { path: string; type: string }[]): Promise<BookConditionEvaluation> {
    const fallback: BookConditionEvaluation = {
      nota_conservacao: 3,
      descricao_conservacao: 'Avaliação automática indisponível no momento.',
    };

    const images = this.loadImagesFromPaths(imagePaths);
    if (!images.length) {
      return fallback;
    }

    try {
      const raw = await this.generateWithImages(buildBookConditionPrompt() + JSON_ONLY_SUFFIX, images);
      if (!raw) {
        return fallback;
      }
      return this.parseEvaluationJson(raw, fallback);
    } catch (err) {
      this.logger.warn(`Falha na avaliação Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  async moderateReview(comentario: string, nota?: number): Promise<ReviewModerationResult> {
    const fallback: ReviewModerationResult = { aprovado: true, motivo: null, tem_spoiler: false };

    const texto = String(comentario ?? '').trim();
    const notaResolvida = this.resolverNotaModeracao(texto, nota);
    const comentarioLimpo = this.extrairComentarioModeracao(texto, notaResolvida);

    const prompt = buildModerationPrompt(comentarioLimpo, notaResolvida) + JSON_ONLY_SUFFIX;
    const heuristicaSpoiler = detectSpoilerHeuristic(comentarioLimpo);

    try {
      const raw = await this.generateText(prompt, 0.1);
      if (!raw) {
        return { ...fallback, tem_spoiler: heuristicaSpoiler };
      }
      const parsed = parseJsonFromModelText<Record<string, unknown>>(raw);
      if (!parsed) {
        return { ...fallback, tem_spoiler: heuristicaSpoiler };
      }
      const aprovado = parsed.aprovado === true;
      const motivoRaw = parsed.motivo;
      const motivo =
        motivoRaw === null || motivoRaw === undefined
          ? null
          : typeof motivoRaw === 'string'
            ? motivoRaw
            : String(motivoRaw);
      const tem_spoiler = extractSpoilerFlagFromModel(parsed) || heuristicaSpoiler;
      return { aprovado, motivo: aprovado ? null : motivo, tem_spoiler };
    } catch (err) {
      this.logger.warn(`Falha na moderação Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return { ...fallback, tem_spoiler: heuristicaSpoiler };
    }
  }

  async evaluateReform(imagePaths: { path: string; type: string }[]): Promise<ReformEvaluationResult> {
    const fallback: ReformEvaluationResult = {
      gravidade: 'Indefinida',
      orcamento_estimado: 50,
      descricao: 'Não foi possível analisar automaticamente as imagens neste momento.',
    };

    const images = this.loadImagesFromPaths(imagePaths);
    if (!images.length) {
      return fallback;
    }

    try {
      const raw = await this.generateWithImages(buildReformPrompt() + JSON_ONLY_SUFFIX, images);
      if (!raw) {
        return fallback;
      }
      const parsed = parseJsonFromModelText<Record<string, unknown>>(raw);
      if (!parsed) {
        return fallback;
      }
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

  async identifyBookFromCover(file: { buffer: Buffer; mimeType: string }): Promise<CoverIdentificationResult> {
    const fallback: CoverIdentificationResult = {
      titulo: '',
      autor: '',
      isbn: null,
      editora: '',
      ano_publicacao: null,
      sinopse: null,
      confianca: 'baixa',
    };

    if (!file.buffer?.length) {
      return fallback;
    }

    const mimeType = file.mimeType?.startsWith('image/') ? file.mimeType : 'image/jpeg';

    try {
      const raw = await this.generateWithImages(buildCoverIdentificationPrompt() + JSON_ONLY_SUFFIX, [
        { buffer: file.buffer, mimeType },
      ]);
      if (!raw) {
        return fallback;
      }
      const parsed = parseJsonFromModelText<Record<string, unknown>>(raw);
      if (!parsed) {
        return fallback;
      }
      const titulo = this.extrairCampoTextoCapa(parsed, ['titulo', 'title', 'nome', 'titulo_livro']);
      const autor = this.extrairCampoTextoCapa(parsed, ['autor', 'author', 'autores', 'autor_livro']);
      const editora = this.extrairCampoTextoCapa(parsed, ['editora', 'publisher', 'editor']);
      const ano_publicacao = this.extrairAnoCapa(parsed);
      const isbnRaw = parsed.isbn ?? parsed.ISBN;
      const isbnCapa =
        isbnRaw === null || isbnRaw === undefined
          ? null
          : this.isbnLookup.normalizeIsbn(this.extrairCampoTextoCapa({ v: isbnRaw }, ['v']));
      const confianca = this.normalizarConfiancaCapa(parsed.confianca);

      let isbn = isbnCapa;
      let autorFinal = autor;
      let editoraFinal = editora;
      let anoFinal = ano_publicacao;
      let sinopseFinal: string | null = null;

      const precisaMetadadosExternos =
        titulo &&
        (!isbn || !autorFinal.trim() || !editoraFinal.trim() || !anoFinal);

      if (precisaMetadadosExternos) {
        const meta = await this.buscarMetadadosComTimeout(titulo, autor, 5000);
        if (!isbn) {
          isbn = meta.isbn;
        }
        if (!autorFinal.trim()) {
          autorFinal = meta.autor ?? '';
        }
        if (!editoraFinal.trim()) {
          editoraFinal = meta.editora ?? '';
        }
        if (!anoFinal) {
          anoFinal = meta.ano_publicacao;
        }
        sinopseFinal = meta.sinopse;
      }

      return {
        titulo,
        autor: autorFinal,
        isbn,
        editora: editoraFinal,
        ano_publicacao: anoFinal,
        sinopse: sinopseFinal,
        confianca,
      };
    } catch (err) {
      this.logger.warn(`Falha na leitura de capa Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return fallback;
    }
  }

  async recommendBooks(bookshelf: unknown, catalog: CatalogItemForRecommendation[]): Promise<number[]> {
    const catalogIds = new Set((catalog || []).map((c) => c.id));
    if (!catalogIds.size) {
      return [];
    }

    const estante = this.normalizarEstanteSkoob(bookshelf);
    const catalogo = (catalog || []).filter((c) => c?.id != null && String(c.titulo || '').trim().length > 0);

    const prompt = buildRecommendationsPrompt(estante, catalogo) + JSON_ONLY_SUFFIX;

    try {
      const raw = await this.generateText(prompt, 0.25);
      if (!raw) {
        return [];
      }
      const parsed = parseJsonFromModelText<Record<string, unknown>>(raw);
      if (!parsed) {
        return [];
      }
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
      if (unique.length < 3) {
        this.logger.warn(
          `Recomendações incompletas (${unique.length}/3). ids=${unique.join(',')} estante=${estante.length} catálogo=${catalogo.length}`,
        );
      }
      return unique.slice(0, 3);
    } catch (err) {
      this.logger.warn(`Falha nas recomendações Gemini: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  private normalizarEstanteSkoob(bookshelf: unknown): BookshelfItemPrompt[] {
    const arr = Array.isArray(bookshelf) ? bookshelf : [];
    const itens: BookshelfItemPrompt[] = [];

    for (const item of arr.slice(0, 120)) {
      const row = item as Record<string, unknown>;
      const ed = (row?.edition ?? row?.edicao ?? row) as Record<string, unknown>;
      const titulo = String(ed?.title ?? ed?.titulo ?? row?.titulo ?? '').trim();
      if (!titulo || titulo === '—') {
        continue;
      }
      const autor = String(ed?.author ?? ed?.autor ?? row?.autor ?? 'Autor não informado').trim();
      const ratingRaw = row?.rating ?? row?.ranking ?? row?.nota;
      let nota: number | null = null;
      if (typeof ratingRaw === 'number' && Number.isFinite(ratingRaw)) {
        nota = Math.min(5, Math.max(0, Math.round(ratingRaw)));
      } else if (ratingRaw != null) {
        const p = parseInt(String(ratingRaw), 10);
        if (Number.isFinite(p)) nota = Math.min(5, Math.max(0, p));
      }
      itens.push({
        titulo,
        autor,
        genero: String(ed?.genre ?? ed?.genero ?? row?.genero ?? '—').trim() || '—',
        nota_usuario: nota,
        status_leitura: this.rotuloStatusSkoob(row?.type ?? row?.tipo),
      });
    }

    return itens;
  }

  private rotuloStatusSkoob(tipo: unknown): string {
    const n = parseInt(String(tipo ?? ''), 10);
    if (n === 1) return 'lido';
    if (n === 2) return 'lendo';
    if (n === 3) return 'quero ler';
    if (n === 4) return 'abandonei';
    if (n === 5) return 'relido';
    return 'estante';
  }

  private resolverNotaModeracao(texto: string, nota?: number): number | null {
    if (nota != null && Number.isFinite(nota)) {
      return Math.min(5, Math.max(1, Math.round(nota)));
    }
    const match = texto.match(/nota\s*(\d)/i);
    if (match?.[1]) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n)) return Math.min(5, Math.max(1, n));
    }
    return null;
  }

  private extrairComentarioModeracao(texto: string, nota: number | null): string {
    let t = texto;
    if (nota != null) {
      t = t.replace(/nota\s*\d+/gi, '').trim();
    }
    return t;
  }

  private getTextModel(): LanguageModel | null {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      return null;
    }
    const google = createGoogleGenerativeAI({ apiKey });
    return google(GEMINI_MODEL_ID);
  }

  private getVisionModel(): LanguageModel | null {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      return null;
    }
    const google = createGoogleGenerativeAI({ apiKey });
    return google(GEMINI_MODEL_VISION_ID);
  }

  private async generateText(prompt: string, temperature = 0.2): Promise<string | null> {
    const model = this.getTextModel();
    if (!model) {
      return null;
    }
    const { text } = await generateText({
      model,
      prompt,
      temperature,
    });
    return text?.trim() || null;
  }

  private async generateWithImages(prompt: string, images: ImageInput[]): Promise<string | null> {
    const model = this.getVisionModel();
    if (!model || !images.length) {
      return null;
    }

    const content: Array<
      { type: 'text'; text: string } | { type: 'image'; image: Buffer; mediaType?: string }
    > = [];

    for (const item of images) {
      if (item.label) {
        content.push({ type: 'text', text: item.label });
      }
      content.push({ type: 'image', image: item.buffer, mediaType: item.mimeType });
    }
    content.push({ type: 'text', text: prompt });

    const { text } = await generateText({
      model,
      messages: [{ role: 'user', content }],
      temperature: 0.2,
    });
    return text?.trim() || null;
  }

  private loadImagesFromPaths(imagePaths: { path: string; type: string }[]): ImageInput[] {
    const images: ImageInput[] = [];

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
      images.push({
        buffer,
        mimeType,
        label: `Foto do exemplar — ${item.type}. Analise esta imagem antes de continuar.`,
      });
    }

    return images;
  }

  private extrairCampoTextoCapa(parsed: Record<string, unknown>, chaves: string[]): string {
    for (const chave of chaves) {
      const valor = parsed[chave];
      if (valor === null || valor === undefined) {
        continue;
      }
      const texto = String(valor).trim();
      if (texto && texto.toLowerCase() !== 'null') {
        return texto;
      }
    }
    return '';
  }

  private async buscarMetadadosComTimeout(
    titulo: string,
    autor: string,
    timeoutMs: number,
  ): Promise<BookMetadataLookupResult> {
    const vazio: BookMetadataLookupResult = {
      isbn: null,
      autor: null,
      editora: null,
      ano_publicacao: null,
      sinopse: null,
    };

    try {
      return await Promise.race([
        this.isbnLookup.lookupMetadata(titulo, autor),
        new Promise<BookMetadataLookupResult>((resolve) => {
          setTimeout(() => resolve(vazio), timeoutMs);
        }),
      ]);
    } catch (err) {
      this.logger.warn(
        `Falha ao enriquecer metadados da capa: ${err instanceof Error ? err.message : String(err)}`,
      );
      return vazio;
    }
  }

  private extrairAnoCapa(parsed: Record<string, unknown>): number | null {
    const valor = parsed.ano_publicacao ?? parsed.ano ?? parsed.year ?? parsed.ano_publicacao_capa;
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const ano = Math.trunc(valor);
      return ano >= 1000 && ano <= 2100 ? ano : null;
    }
    const texto = String(valor ?? '').trim();
    if (!texto || texto.toLowerCase() === 'null') {
      return null;
    }
    const match = texto.match(/\d{4}/);
    if (!match) {
      return null;
    }
    const ano = parseInt(match[0], 10);
    return ano >= 1000 && ano <= 2100 ? ano : null;
  }

  private normalizarConfiancaCapa(valor: unknown): CoverIdentificationResult['confianca'] {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      if (valor >= 0.75) return 'alta';
      if (valor >= 0.45) return 'media';
      return 'baixa';
    }
    const t = String(valor ?? '').trim().toLowerCase();
    if (t.includes('alta') || t.includes('high')) return 'alta';
    if (t.includes('media') || t.includes('média') || t.includes('medium')) return 'media';
    return 'baixa';
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
    const parsed = parseJsonFromModelText<Record<string, unknown>>(raw);
    if (!parsed) {
      return fallback;
    }
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
  }
}
