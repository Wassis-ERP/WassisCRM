-- =============================================================================
-- Migracao 007 — Fase 2.5
-- Torna `oportunidade_id` NULLABLE em `public.financeiro_cobrancas`
-- para permitir cobrancas avulsas/inadimplencia pura nao vinculadas a apolice.
-- =============================================================================
-- Contexto:
--   Na Fase 1.1 a coluna `oportunidade_id` foi criada como NOT NULL, assumindo
--   que toda cobranca derivaria de uma oportunidade ganha. Na Fase 2.5 ficou
--   claro que o modulo Financeiro tambem precisa lidar com inadimplencia avulsa
--   (ex.: taxas administrativas, cobrancas de clientes sem vinculo direto
--   com uma oportunidade no CRM).
--
-- LGPD/Seguranca:
--   - Operacao IDEMPOTENTE via DO blocks.
--   - RLS existente (`tenant_id = get_user_tenant_id()`) permanece inalterada.
--   - Sem truncate/drop de dados — apenas afrouxa o NOT NULL.
--
-- Aplicacao:
--   Executar no Supabase Dashboard → SQL Editor do projeto,
--   ou via CLI: supabase db execute < planos/migrations/007_fase2_5_cobranca_oportunidade_nullable.sql
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'financeiro_cobrancas'
      AND column_name = 'oportunidade_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.financeiro_cobrancas
      ALTER COLUMN oportunidade_id DROP NOT NULL;
    RAISE NOTICE 'financeiro_cobrancas.oportunidade_id agora e NULLABLE';
  ELSE
    RAISE NOTICE 'financeiro_cobrancas.oportunidade_id ja e NULLABLE — nada a fazer';
  END IF;
END
$$;

-- =============================================================================
-- Apos aplicar, regenerar os tipos TypeScript:
--   npx supabase gen types typescript --project-id <PROJECT_ID> > nexus-crm/src/types/database.ts
-- =============================================================================
