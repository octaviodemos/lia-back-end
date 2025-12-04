-- CreateTable
CREATE TABLE "avaliacao_reacoes" (
    "id_avaliacao" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" "ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_reacoes_pkey" PRIMARY KEY ("id_avaliacao","id_usuario")
);

-- CreateIndex
CREATE INDEX "avaliacao_reacoes_id_avaliacao_idx" ON "avaliacao_reacoes"("id_avaliacao");

-- AddForeignKey
ALTER TABLE "avaliacao_reacoes" ADD CONSTRAINT "avaliacao_reacoes_id_avaliacao_fkey" FOREIGN KEY ("id_avaliacao") REFERENCES "avaliacoes"("id_avaliacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_reacoes" ADD CONSTRAINT "avaliacao_reacoes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
