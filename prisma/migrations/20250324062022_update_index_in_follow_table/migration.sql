-- DropIndex
DROP INDEX "Follow_followerId_idx";

-- DropIndex
DROP INDEX "Follow_followingId_idx";

-- CreateIndex
CREATE INDEX "Follow_followerId_followingId_idx" ON "Follow"("followerId", "followingId");
