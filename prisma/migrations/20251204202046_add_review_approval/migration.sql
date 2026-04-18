-- AlterTable
ALTER TABLE "avaliacoes" ADD COLUMN     "aprovado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "publicacao_comentarios" ADD COLUMN     "aprovado" BOOLEAN NOT NULL DEFAULT false;
