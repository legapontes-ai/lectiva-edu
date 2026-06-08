-- INC-LGPD-1 — Base legal do consentimento (LGPD Art. 7º). Aditivo/reversível.
CREATE TYPE "BaseLegal" AS ENUM (
  'Consentimento', 'ExecucaoContrato', 'ObrigacaoLegal',
  'LegitimoInteresse', 'ProtecaoVida', 'TutelaSaude', 'ExercicioDireitos'
);

ALTER TABLE "consentimento"
  ADD COLUMN "base_legal" "BaseLegal" NOT NULL DEFAULT 'Consentimento';
