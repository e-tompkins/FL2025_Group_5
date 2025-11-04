-- DropForeignKey
ALTER TABLE `Visual` DROP FOREIGN KEY `Visual_userId_fkey`;

-- DropIndex
DROP INDEX `Visual_userId_topic_key` ON `Visual`;

-- AddForeignKey
ALTER TABLE `Visual` ADD CONSTRAINT `Visual_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
