CREATE TABLE "recomendacoes_skoob_cache" (
    "id_usuario" INTEGER NOT NULL,
    "skoob_user_id" VARCHAR(128) NOT NULL,
    "livro_ids" INTEGER[] NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recomendacoes_skoob_cache_pkey" PRIMARY KEY ("id_usuario")
);

ALTER TABLE "recomendacoes_skoob_cache" ADD CONSTRAINT "recomendacoes_skoob_cache_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
