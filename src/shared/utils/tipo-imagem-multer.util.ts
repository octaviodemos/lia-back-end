import { TipoImagem } from '@prisma/client';

const PREFIX = 'imagem_';

const SUFFIX_TO_ENUM: Record<string, TipoImagem> = {
  Capa: TipoImagem.Capa,
  Contracapa: TipoImagem.Contracapa,
  Lombada: TipoImagem.Lombada,
  MioloPaginas: TipoImagem.MioloPaginas,
  DetalhesAvarias: TipoImagem.DetalhesAvarias,
};

export function tipoImagemFromMulterFieldname(fieldname: string): TipoImagem | null {
  if (!fieldname || typeof fieldname !== 'string') return null;
  if (!fieldname.startsWith(PREFIX)) return null;
  const suffix = fieldname.slice(PREFIX.length);
  return SUFFIX_TO_ENUM[suffix] ?? null;
}

export function tipoImagemForRepairUpload(fieldname: string): TipoImagem {
  const parsed = tipoImagemFromMulterFieldname(fieldname);
  if (parsed) return parsed;
  if (fieldname === 'fotos') return TipoImagem.Capa;
  return TipoImagem.Capa;
}
