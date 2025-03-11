/*
  Warnings:

  - Changed the type of `chain` on the `Web3Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Web3Account" DROP COLUMN "chain",
ADD COLUMN     "chain" "Chain" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Web3Account_address_chain_key" ON "Web3Account"("address", "chain");
