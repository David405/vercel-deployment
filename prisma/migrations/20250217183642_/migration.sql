/*
  Warnings:

  - The values [EVM,SOLANA] on the enum `Chain` will be removed. If these variants are still used in the database, this will fail.
  - The values [TWITTER,GITHUB,DISCORD] on the enum `SocialPlatform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Chain_new" AS ENUM ('ethereum', 'solana');
ALTER TABLE "Web3Account" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TABLE "OnchainActivity" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TYPE "Chain" RENAME TO "Chain_old";
ALTER TYPE "Chain_new" RENAME TO "Chain";
DROP TYPE "Chain_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SocialPlatform_new" AS ENUM ('twitter', 'github', 'discord');
ALTER TABLE "SocialAccount" ALTER COLUMN "platform" TYPE "SocialPlatform_new" USING ("platform"::text::"SocialPlatform_new");
ALTER TYPE "SocialPlatform" RENAME TO "SocialPlatform_old";
ALTER TYPE "SocialPlatform_new" RENAME TO "SocialPlatform";
DROP TYPE "SocialPlatform_old";
COMMIT;
