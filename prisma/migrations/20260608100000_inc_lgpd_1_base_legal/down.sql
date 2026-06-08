-- Reverte INC-LGPD-1.
ALTER TABLE "consentimento" DROP COLUMN "base_legal";
DROP TYPE "BaseLegal";
