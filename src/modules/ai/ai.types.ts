export type ReviewModerationResult = {
  aprovado: boolean;
  motivo: string;
  tem_spoiler: boolean;
};

export type ReformEvaluationMock = {
  gravidade: string;
  orcamento_estimado: number;
  descricao: string;
};
