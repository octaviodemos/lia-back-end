export type ReviewModerationResult = {
  aprovado: boolean;
  motivo: string | null;
  tem_spoiler: boolean;
};

export type ReformEvaluationResult = {
  gravidade: string;
  orcamento_estimado: number;
  descricao: string;
};

export type CatalogItemForRecommendation = {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
};
