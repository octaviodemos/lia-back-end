ALTER TABLE "estoque" ADD COLUMN "disponivel" BOOLEAN NOT NULL DEFAULT true;

UPDATE "estoque" SET "disponivel" = ("quantidade" > 0);

ALTER TABLE "estoque" DROP COLUMN "quantidade";

ALTER TABLE "carrinho_itens" DROP COLUMN "quantidade";

ALTER TABLE "itens_pedido" DROP COLUMN "quantidade";
