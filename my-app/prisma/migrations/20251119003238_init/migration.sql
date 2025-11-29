/*
  Warnings:

  - A unique constraint covering the columns `[userId,topic]` on the table `Visual` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Visual_userId_topic_key` ON `Visual`(`userId`, `topic`);
