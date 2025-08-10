-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "firstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "refreshTokenHash" TEXT;
