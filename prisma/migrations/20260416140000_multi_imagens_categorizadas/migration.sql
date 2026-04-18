CREATE TYPE "TipoImagem" AS ENUM ('Capa', 'Contracapa', 'Lombada', 'Miolo/Páginas', 'Detalhes/Avarias');

CREATE TABLE "imagem_livro" (
    "id_imagem_livro" SERIAL NOT NULL,
    "id_livro" INTEGER NOT NULL,
    "url_imagem" VARCHAR(255) NOT NULL,
    "tipo_imagem" "TipoImagem" NOT NULL,

    CONSTRAINT "imagem_livro_pkey" PRIMARY KEY ("id_imagem_livro")
);

CREATE TABLE "imagem_oferta_venda" (
    "id_imagem_oferta_venda" SERIAL NOT NULL,
    "id_oferta_venda" INTEGER NOT NULL,
    "url_imagem" VARCHAR(255) NOT NULL,
    "tipo_imagem" "TipoImagem" NOT NULL,

    CONSTRAINT "imagem_oferta_venda_pkey" PRIMARY KEY ("id_imagem_oferta_venda")
);

ALTER TABLE "fotos_solicitacao_reforma" ADD COLUMN "tipo_imagem" "TipoImagem" NOT NULL DEFAULT 'Capa';

INSERT INTO "imagem_livro" ("id_livro", "url_imagem", "tipo_imagem")
SELECT "id_livro", "capa_url", 'Capa'::"TipoImagem"
FROM "livros"
WHERE "capa_url" IS NOT NULL AND TRIM("capa_url") <> '';

ALTER TABLE "livros" DROP COLUMN "capa_url";

ALTER TABLE "imagem_livro" ADD CONSTRAINT "imagem_livro_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "imagem_oferta_venda" ADD CONSTRAINT "imagem_oferta_venda_id_oferta_venda_fkey" FOREIGN KEY ("id_oferta_venda") REFERENCES "ofertas_venda"("id_oferta_venda") ON DELETE CASCADE ON UPDATE CASCADE;
