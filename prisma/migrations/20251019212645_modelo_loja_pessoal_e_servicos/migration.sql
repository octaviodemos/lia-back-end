/*
  Warnings:

  - You are about to drop the column `id_livro_sebo` on the `carrinho_itens` table. All the data in the column will be lost.
  - You are about to drop the column `id_livro_sebo` on the `itens_pedido` table. All the data in the column will be lost.
  - You are about to drop the `livro_sebo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sebo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_estoque` to the `carrinho_itens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_estoque` to the `itens_pedido` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."carrinho_itens" DROP CONSTRAINT "carrinho_itens_id_livro_sebo_fkey";

-- DropForeignKey
ALTER TABLE "public"."itens_pedido" DROP CONSTRAINT "itens_pedido_id_livro_sebo_fkey";

-- DropForeignKey
ALTER TABLE "public"."livro_sebo" DROP CONSTRAINT "livro_sebo_id_livro_fkey";

-- DropForeignKey
ALTER TABLE "public"."livro_sebo" DROP CONSTRAINT "livro_sebo_id_sebo_fkey";

-- DropForeignKey
ALTER TABLE "public"."sebo" DROP CONSTRAINT "sebo_id_usuario_fkey";

-- AlterTable
ALTER TABLE "carrinho" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "carrinho_itens" DROP COLUMN "id_livro_sebo",
ADD COLUMN     "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_estoque" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "itens_pedido" DROP COLUMN "id_livro_sebo",
ADD COLUMN     "id_estoque" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "data_pagamento" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "telefone" VARCHAR(20);

-- DropTable
DROP TABLE "public"."livro_sebo";

-- DropTable
DROP TABLE "public"."sebo";

-- CreateTable
CREATE TABLE "estoque" (
    "id_estoque" SERIAL NOT NULL,
    "id_livro" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco" DECIMAL(10,2) NOT NULL,
    "condicao" VARCHAR(100),

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("id_estoque")
);

-- CreateTable
CREATE TABLE "ofertas_venda" (
    "id_oferta_venda" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo_livro" VARCHAR(255) NOT NULL,
    "autor_livro" VARCHAR(255),
    "isbn" VARCHAR(20),
    "condicao_livro" TEXT NOT NULL,
    "preco_sugerido" DECIMAL(10,2) NOT NULL,
    "status_oferta" VARCHAR(50) NOT NULL DEFAULT 'pendente',
    "data_oferta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resposta_admin" TEXT,

    CONSTRAINT "ofertas_venda_pkey" PRIMARY KEY ("id_oferta_venda")
);

-- CreateTable
CREATE TABLE "solicitacoes_reforma" (
    "id_solicitacao" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "descricao_problema" TEXT NOT NULL,
    "status_solicitacao" VARCHAR(50) NOT NULL DEFAULT 'pendente',
    "data_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_reforma_pkey" PRIMARY KEY ("id_solicitacao")
);

-- CreateTable
CREATE TABLE "fotos_solicitacao_reforma" (
    "id_foto" SERIAL NOT NULL,
    "id_solicitacao" INTEGER NOT NULL,
    "url_foto" VARCHAR(255) NOT NULL,

    CONSTRAINT "fotos_solicitacao_reforma_pkey" PRIMARY KEY ("id_foto")
);

-- AddForeignKey
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho_itens" ADD CONSTRAINT "carrinho_itens_id_estoque_fkey" FOREIGN KEY ("id_estoque") REFERENCES "estoque"("id_estoque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_estoque_fkey" FOREIGN KEY ("id_estoque") REFERENCES "estoque"("id_estoque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_venda" ADD CONSTRAINT "ofertas_venda_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_reforma" ADD CONSTRAINT "solicitacoes_reforma_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_solicitacao_reforma" ADD CONSTRAINT "fotos_solicitacao_reforma_id_solicitacao_fkey" FOREIGN KEY ("id_solicitacao") REFERENCES "solicitacoes_reforma"("id_solicitacao") ON DELETE RESTRICT ON UPDATE CASCADE;
