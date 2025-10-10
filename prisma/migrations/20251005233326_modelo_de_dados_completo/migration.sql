-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "tipo_usuario" VARCHAR(50) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "sebo" (
    "id_sebo" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nome_fantasia" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(18),
    "endereco_completo" TEXT,
    "logo_url" VARCHAR(255),

    CONSTRAINT "sebo_pkey" PRIMARY KEY ("id_sebo")
);

-- CreateTable
CREATE TABLE "livros" (
    "id_livro" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "sinopse" TEXT,
    "editora" VARCHAR(255),
    "ano_publicacao" INTEGER,
    "isbn" VARCHAR(20),
    "capa_url" VARCHAR(255),

    CONSTRAINT "livros_pkey" PRIMARY KEY ("id_livro")
);

-- CreateTable
CREATE TABLE "autores" (
    "id_autor" SERIAL NOT NULL,
    "nome_completo" VARCHAR(255) NOT NULL,

    CONSTRAINT "autores_pkey" PRIMARY KEY ("id_autor")
);

-- CreateTable
CREATE TABLE "generos" (
    "id_genero" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id_genero")
);

-- CreateTable
CREATE TABLE "livro_sebo" (
    "id_livro_sebo" SERIAL NOT NULL,
    "id_livro" INTEGER NOT NULL,
    "id_sebo" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco_sebo" DECIMAL(10,2) NOT NULL,
    "condicao" VARCHAR(100),

    CONSTRAINT "livro_sebo_pkey" PRIMARY KEY ("id_livro_sebo")
);

-- CreateTable
CREATE TABLE "carrinho" (
    "id_carrinho" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "carrinho_pkey" PRIMARY KEY ("id_carrinho")
);

-- CreateTable
CREATE TABLE "carrinho_itens" (
    "id_carrinho_item" SERIAL NOT NULL,
    "id_carrinho" INTEGER NOT NULL,
    "id_livro_sebo" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "carrinho_itens_pkey" PRIMARY KEY ("id_carrinho_item")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id_pedido" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_pedido" VARCHAR(50) NOT NULL,
    "codigo_rastreio" VARCHAR(100),
    "data_envio" DATE,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id_item" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_livro_sebo" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "enderecos_entrega" (
    "id_endereco" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "rua" VARCHAR(255),
    "cidade" VARCHAR(100),
    "estado" VARCHAR(50),
    "cep" VARCHAR(10),
    "numero" VARCHAR(20),
    "complemento" VARCHAR(100),

    CONSTRAINT "enderecos_entrega_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id_pagamento" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "status_pagamento" VARCHAR(50) NOT NULL,
    "id_transacao_gateway" VARCHAR(255),
    "valor_pago" DECIMAL(10,2),
    "taxas_gateway" DECIMAL(10,2),
    "metodo_pagamento" VARCHAR(50),
    "parcelas" INTEGER,
    "link_boleto" TEXT,
    "qr_code_pix" TEXT,
    "data_expiracao_pix" TIMESTAMP(3),
    "payload_completo_gateway" JSONB,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id_pagamento")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id_avaliacao" SERIAL NOT NULL,
    "id_livro" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "data_avaliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id_avaliacao")
);

-- CreateTable
CREATE TABLE "publicacoes" (
    "id_publicacao" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" VARCHAR(255),
    "conteudo" TEXT NOT NULL,
    "data_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacoes_pkey" PRIMARY KEY ("id_publicacao")
);

-- CreateTable
CREATE TABLE "publicacao_comentarios" (
    "id_comentario" SERIAL NOT NULL,
    "id_publicacao" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "data_comentario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicacao_comentarios_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "publicacao_curtidas" (
    "id_publicacao" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "publicacao_curtidas_pkey" PRIMARY KEY ("id_publicacao","id_usuario")
);

-- CreateTable
CREATE TABLE "livro_autor" (
    "id_livro" INTEGER NOT NULL,
    "id_autor" INTEGER NOT NULL,

    CONSTRAINT "livro_autor_pkey" PRIMARY KEY ("id_livro","id_autor")
);

-- CreateTable
CREATE TABLE "livro_genero" (
    "id_livro" INTEGER NOT NULL,
    "id_genero" INTEGER NOT NULL,

    CONSTRAINT "livro_genero_pkey" PRIMARY KEY ("id_livro","id_genero")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sebo_id_usuario_key" ON "sebo"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "sebo_cnpj_key" ON "sebo"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "livros_isbn_key" ON "livros"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "generos_nome_key" ON "generos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "carrinho_id_usuario_key" ON "carrinho"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_id_pedido_key" ON "pagamentos"("id_pedido");

-- AddForeignKey
ALTER TABLE "sebo" ADD CONSTRAINT "sebo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_sebo" ADD CONSTRAINT "livro_sebo_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_sebo" ADD CONSTRAINT "livro_sebo_id_sebo_fkey" FOREIGN KEY ("id_sebo") REFERENCES "sebo"("id_sebo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho" ADD CONSTRAINT "carrinho_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho_itens" ADD CONSTRAINT "carrinho_itens_id_carrinho_fkey" FOREIGN KEY ("id_carrinho") REFERENCES "carrinho"("id_carrinho") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho_itens" ADD CONSTRAINT "carrinho_itens_id_livro_sebo_fkey" FOREIGN KEY ("id_livro_sebo") REFERENCES "livro_sebo"("id_livro_sebo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_id_livro_sebo_fkey" FOREIGN KEY ("id_livro_sebo") REFERENCES "livro_sebo"("id_livro_sebo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos_entrega" ADD CONSTRAINT "enderecos_entrega_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacao_comentarios" ADD CONSTRAINT "publicacao_comentarios_id_publicacao_fkey" FOREIGN KEY ("id_publicacao") REFERENCES "publicacoes"("id_publicacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacao_comentarios" ADD CONSTRAINT "publicacao_comentarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacao_curtidas" ADD CONSTRAINT "publicacao_curtidas_id_publicacao_fkey" FOREIGN KEY ("id_publicacao") REFERENCES "publicacoes"("id_publicacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacao_curtidas" ADD CONSTRAINT "publicacao_curtidas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_autor" ADD CONSTRAINT "livro_autor_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_autor" ADD CONSTRAINT "livro_autor_id_autor_fkey" FOREIGN KEY ("id_autor") REFERENCES "autores"("id_autor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_genero" ADD CONSTRAINT "livro_genero_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("id_livro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_genero" ADD CONSTRAINT "livro_genero_id_genero_fkey" FOREIGN KEY ("id_genero") REFERENCES "generos"("id_genero") ON DELETE RESTRICT ON UPDATE CASCADE;
