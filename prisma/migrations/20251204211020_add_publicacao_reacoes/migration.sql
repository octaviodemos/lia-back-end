/*
  Warnings:

  - Added the required column `tipo` to the `publicacao_curtidas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable
ALTER TABLE "publicacao_curtidas" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tipo" "ReactionType" NOT NULL;
