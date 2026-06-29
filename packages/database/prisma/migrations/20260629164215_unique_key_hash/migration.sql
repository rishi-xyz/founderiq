/*
  Warnings:

  - A unique constraint covering the columns `[key_hash]` on the table `apikey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "apikey_key_hash_key" ON "apikey"("key_hash");
