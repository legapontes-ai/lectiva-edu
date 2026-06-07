-- ROLLBACK do Incremento v1.1.1 (manual; Postgres não remove valor de enum diretamente).
-- Pré-condição: nenhum registro usando o valor 'Gestor'.
--   update "usuario" set "vinculo"='Admin' where "vinculo"='Gestor';
--   delete from "perfil_permissao" where "id_perfil" in (select id from "perfil" where nome='Gestor do Sistema');
--   delete from "perfil" where nome='Gestor do Sistema';
-- Recriar o enum sem 'Gestor':
ALTER TYPE "Vinculo" RENAME TO "Vinculo_old";
CREATE TYPE "Vinculo" AS ENUM ('Aluno', 'Professor', 'Coordenacao', 'Secretaria', 'Admin');
ALTER TABLE "usuario" ALTER COLUMN "vinculo" TYPE "Vinculo" USING ("vinculo"::text::"Vinculo");
DROP TYPE "Vinculo_old";
