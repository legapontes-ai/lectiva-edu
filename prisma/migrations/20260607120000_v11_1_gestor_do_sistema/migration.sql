-- Incremento v1.1.1 — Perfil "Gestor do Sistema"
-- Aditivo e não-destrutivo: adiciona o vínculo "Gestor" ao enum de papéis.
-- O perfil em si e suas permissões são dados (seed/perfil + perfil_permissao).
ALTER TYPE "Vinculo" ADD VALUE IF NOT EXISTS 'Gestor';
