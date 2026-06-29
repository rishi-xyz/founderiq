/*
  Warnings:

  - A unique constraint covering the columns `[token_hash]` on the table `interview_session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "interview_question" (
    "id" TEXT NOT NULL,
    "category" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "score" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "interview_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_question_interview_id_idx" ON "interview_question"("interview_id");

-- CreateIndex
CREATE UNIQUE INDEX "interview_session_token_hash_key" ON "interview_session"("token_hash");

-- AddForeignKey
ALTER TABLE "interview_question" ADD CONSTRAINT "interview_question_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
