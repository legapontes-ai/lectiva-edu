-- INC-SEG-1 — Hardening RLS/LGPD: deny-by-default no schema public.
-- A aplicação acessa o banco via Prisma (role owner, que ignora RLS); os fluxos
-- públicos (matrícula/autocadastro) passam por server actions (Prisma). Nenhum
-- acesso a tabelas/Storage usa a chave anon no cliente (apenas auth/mfa/storage
-- via service_role). Logo, bloquear anon/authenticated não afeta a aplicação.

-- 1) Revoga privilégios diretos de anon/authenticated.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2) Impede auto-grant em objetos FUTUROS (default privileges do owner).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 3) Habilita RLS (deny-all, sem políticas) em TODAS as tabelas do public.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
