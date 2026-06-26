import type { CatalogItemForRecommendation } from './ai.types';

export const JSON_ONLY_SUFFIX =
  '\n\nIMPORTANTE: Responda APENAS com um único objeto JSON válido em português do Brasil. Sem markdown, sem ```json, sem texto antes ou depois.';

export type BookshelfItemPrompt = {
  titulo: string;
  autor: string;
  genero: string;
  nota_usuario: number | null;
  status_leitura: string;
};

export function buildBookConditionPrompt(): string {
  return (
    'Você é um bibliógrafo e avaliador de exemplares físicos usados em um sebo online brasileiro (LIA).\n' +
    'Sua tarefa é inspecionar TODAS as fotos enviadas (cada uma está rotulada: Capa, Contracapa, Lombada, Miolo ou Avarias) e atribuir uma nota de conservação honesta para compradores.\n\n' +
    'ESCALA OBRIGATÓRIA (use a nota inteira mais adequada; seja conservador — na dúvida, nota menor):\n' +
    '5 = Como novo: capa e lombada firmes, sem dobras relevantes, miolo limpo, sem amarelecimento visível, sem grifos/rasuras.\n' +
    '4 = Muito bom: sinais leves de uso (cantos levemente batidos, micro-riscos), amarelecimento mínimo aceitável.\n' +
    '3 = Bom com marcas: desgaste visível na capa ou lombada, amarelecimento moderado, pequenas manchas ou grifos isolados.\n' +
    '2 = Regular: capa/lombada com dobras, rasgos ou descolamento incipiente; páginas com manchas, dobras ou desgaste de leitura evidente.\n' +
    '1 = Ruim: capa muito danificada, páginas soltas/faltando, mofo, umidade, rasuras graves ou exemplar incompleto.\n\n' +
    'REGRAS DE AVALIAÇÃO:\n' +
    '- Examine cada foto antes de decidir; uma avaria grave em qualquer ângulo impede nota 5.\n' +
    '- Capa e lombada pesam mais para notas 4–5; miolo pesa mais para notas 1–3.\n' +
    '- Não invente defeitos que não estejam visíveis; descreva apenas o que você vê.\n' +
    '- Se faltar foto de miolo, não assuma perfeição — considere incerteza e evite nota 5.\n' +
    '- A descrição deve citar achados por região (ex.: "Capa: cantos batidos. Lombada: marcas de dobra. Miolo: páginas amareladas.").\n' +
    '- Se nota = 5, use exatamente: "Livro em perfeito estado".\n\n' +
    'Retorne EXCLUSIVAMENTE JSON com:\n' +
    '- "nota_conservacao": inteiro de 1 a 5\n' +
    '- "descricao_conservacao": string objetiva em português'
  );
}

export function buildModerationPrompt(comentario: string, nota: number | null): string {
  const notaTxt = nota != null && Number.isFinite(nota) ? String(nota) : 'não informada';
  return (
    'Você é moderador de resenhas de livros em uma loja brasileira. Analise o conteúdo abaixo e decida se pode ser publicado.\n\n' +
    `NOTA numérica dada pelo usuário (1–5): ${notaTxt}\n` +
    `TEXTO da resenha:\n"""\n${comentario}\n"""\n\n` +
    'REPROVAR (aprovado = false) quando houver qualquer um destes casos:\n' +
    '- Xingamentos, ódio, discriminação, assédio ou ameaças.\n' +
    '- Spam, propaganda, links, pedidos de venda, dados pessoais (telefone, e-mail, endereço).\n' +
    '- Texto sem sentido, gibberish, repetição absurda de caracteres (ex.: "testetestetest"), teclado esmagado, só emojis sem opinião.\n' +
    '- Comentário vazio ou com menos de 8 caracteres úteis sem opinião sobre o livro.\n' +
    '- Conteúdo totalmente fora do tema (não menciona leitura, livro, autor, história ou nota de forma minimamente compreensível).\n' +
    '- Conteúdo sexual explícito ou ilegal sem relação com resenha literária.\n\n' +
    'APROVAR (aprovado = true) quando:\n' +
    '- For crítica honesta, elogio, opinião resumida ou comentário curto mas compreensível sobre a obra.\n' +
    '- Tom negativo ou positivo é permitido se respeitoso.\n' +
    '- Resenha COM spoiler ainda pode ser aprovada; spoiler só altera tem_spoiler, não aprovação.\n\n' +
    'DETECÇÃO DE SPOILER (campo tem_spoiler — independente de aprovar ou reprovar):\n' +
    'Marque tem_spoiler = true se o texto revelar fatos que estragam a leitura para quem não terminou a obra:\n' +
    '- Desfecho, final, último capítulo, cena final ou "no final acontece X".\n' +
    '- Morte, assassinato, traição ou reviravolta concreta de personagem (nome ou papel explícito).\n' +
    '- Identidade do vilão, do culpado, do pai verdadeiro, do mistério central ou twist revelado.\n' +
    '- Relação inesperada entre personagens quando isso é segredo da trama (ex.: "X era irmão de Y").\n' +
    '- Citação explícita de evento do clímax ou pós-créditos da história.\n' +
    '- Palavras como "spoiler", "alerta de spoiler" seguidas de revelação.\n\n' +
    'tem_spoiler = false quando:\n' +
    '- Opinião genérica ("amei", "final fraco", "plot previsível") sem dizer O QUE acontece.\n' +
    '- Mencionar personagens ou temas sem revelar segredos ou desfecho.\n' +
    '- Crítica vaga ao final sem narrar eventos ("decepcionou", "não gostei do fim").\n\n' +
    'Exemplos tem_spoiler=true:\n' +
    '- "No final o protagonista morre e a vilã era a irmã dele."\n' +
    '- "Spoiler: o detetive é o assassino."\n' +
    '- "Descobre no último capítulo que tudo era um sonho."\n\n' +
    'Exemplos tem_spoiler=false:\n' +
    '- "Final decepcionante, não esperava esse rumo."\n' +
    '- "Personagens bem escritos, trama envolvente."\n\n' +
    'Se reprovar, "motivo" deve ser uma frase clara em português para o usuário (ex.: "Resenha sem conteúdo legível sobre o livro.").\n' +
    'Se aprovar, "motivo" deve ser null.\n\n' +
    'Retorne EXCLUSIVAMENTE JSON com:\n' +
    '- "aprovado": boolean\n' +
    '- "motivo": string ou null\n' +
    '- "tem_spoiler": boolean'
  );
}

export function buildReformPrompt(): string {
  return (
    'Você é restaurador profissional de livros antigos e exemplares danificados no Brasil.\n' +
    'Analise todas as fotos (rotuladas: Capa, Contracapa, Lombada, Miolo ou Avarias) e produza um laudo técnico para orçamento de reforma.\n\n' +
    'CLASSIFICAÇÃO DE GRAVIDADE:\n' +
    '- Leve: desgaste superficial (cantos, pequenas dobras, sujeira) sem comprometer estrutura.\n' +
    '- Média: lombada/capa com danos moderados, páginas soltas pontuais, manchas tratáveis.\n' +
    '- Grave: capa/lombada muito comprometidas, várias páginas soltas, umidade/mofo localizado.\n' +
    '- Irreparável: perda estrutural, páginas em massa deterioradas, mofo generalizado, exemplar incompleto.\n\n' +
    'ORÇAMENTO (reais, inteiro): estimativa justa de mão de obra + materiais básicos no Brasil.\n' +
    '- Leve: 15–35\n' +
    '- Média: 35–60\n' +
    '- Grave: 60–90\n' +
    '- Irreparável: 90–100 (máximo)\n' +
    'Ajuste dentro de 10–100 conforme extensão real dos danos visíveis.\n\n' +
    'A descrição deve listar danos observados e serviços necessários (ex.: reforço de lombada, limpeza, colagem de folhas).\n\n' +
    'Retorne EXCLUSIVAMENTE JSON com:\n' +
    '- "gravidade": "Leve" | "Média" | "Grave" | "Irreparável"\n' +
    '- "orcamento_estimado": number\n' +
    '- "descricao": string'
  );
}

export function buildCoverIdentificationPrompt(): string {
  return (
    'Você lê capas de livros físicos em português ou traduções vendidas no Brasil.\n' +
    'Extraia apenas o que estiver legível na imagem; não invente dados.\n\n' +
    'Retorne EXCLUSIVAMENTE JSON com:\n' +
    '- "titulo": string (vazio se ilegível)\n' +
    '- "autor": string (vazio se ilegível; vários autores separados por vírgula)\n' +
    '- "editora": string (vazio se ilegível)\n' +
    '- "ano_publicacao": number ou null (ano de publicação visível na capa/lombada)\n' +
    '- "isbn": string só se ISBN estiver visível, senão null\n' +
    '- "confianca": "alta" | "media" | "baixa"'
  );
}

export function buildRecommendationsPrompt(
  estante: BookshelfItemPrompt[],
  catalog: CatalogItemForRecommendation[],
): string {
  const estanteBloco = formatBookshelfBlock(estante);
  const catalogoBloco = formatCatalogBlock(catalog);

  return (
    'Você é um livreiro brasileiro especializado em recomendar compras com base no histórico real de leitura do cliente no Skoob.\n\n' +
    'OBJETIVO: Escolher exatamente 3 livros do CATÁLOGO DA LOJA abaixo que o cliente teria maior chance de comprar e gostar.\n\n' +
    'REGRAS OBRIGATÓRIAS:\n' +
    '1. Use SOMENTE ids listados no catálogo — nunca invente id, título ou autor.\n' +
    '2. Não recomende livros que o cliente já leu (mesmo título ou mesma obra evidente na estante).\n' +
    '3. Priorize afinidade por: mesmo autor (se gosta), gênero recorrente, temas/autores similares, autores brasileiros vs estrangeiros conforme padrão da estante.\n' +
    '4. Use as notas do Skoob (quando existirem) para inferir gosto — autores/gêneros com notas altas pesam mais.\n' +
    '5. Diversifique: 3 obras distintas; evite três livros idênticos em série salvo padrão muito claro na estante.\n' +
    '6. Se o catálogo tiver pouca afinidade, escolha os 3 MELHORES disponíveis, mas ainda assim só ids do catálogo.\n' +
    '7. Ignore itens da estante sem título utilizável.\n\n' +
    'PROCESSO (mental, não escreva no JSON):\n' +
    'a) Resuma padrões da estante (autores, gêneros, temas).\n' +
    'b) Filtre o catálogo por proximidade literária.\n' +
    'c) Escolha os 3 id_livro finais.\n\n' +
    'ESTANTE DO CLIENTE (Skoob — livros lidos ou avaliados):\n' +
    estanteBloco +
    '\n\nCATÁLOGO DA LOJA (candidatos — campo "id" é o id_livro que você DEVE retornar):\n' +
    catalogoBloco +
    '\n\nRetorne EXCLUSIVAMENTE JSON:\n' +
    '{ "recomendacoes": [ id_livro_1, id_livro_2, id_livro_3 ] }\n' +
    'Três números inteiros distintos existentes no catálogo.'
  );
}

function formatBookshelfBlock(items: BookshelfItemPrompt[]): string {
  if (!items.length) {
    return '(Estante vazia ou indisponível — recomende os três títulos mais universais e variados do catálogo.)\n';
  }
  return items
    .map((item, i) => {
      const nota =
        item.nota_usuario != null && Number.isFinite(item.nota_usuario)
          ? `nota Skoob: ${item.nota_usuario}/5`
          : 'nota Skoob: —';
      return `${i + 1}. "${item.titulo}" | ${item.autor} | ${item.genero} | ${item.status_leitura} | ${nota}`;
    })
    .join('\n');
}

function formatCatalogBlock(catalog: CatalogItemForRecommendation[]): string {
  if (!catalog.length) {
    return '(Catálogo vazio)\n';
  }
  return catalog
    .map((c) => `- id=${c.id} | "${c.titulo}" | ${c.autor} | gênero: ${c.genero}`)
    .join('\n');
}
