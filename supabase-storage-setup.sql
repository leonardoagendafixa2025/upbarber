-- =============================================================
-- Script de setup do Supabase Storage para o Connect Barber
-- Execute no SQL Editor do Supabase após criar o projeto
-- =============================================================

-- 1. Criar bucket público "media"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,  -- acesso público para leitura (GET sem autenticação)
  5242880,  -- 5 MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de leitura pública (qualquer um pode ver as imagens)
CREATE POLICY "Leitura pública de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 3. Política de upload: apenas service_role (a API faz upload com a service key)
-- A inserção é feita server-side pelo backend com SUPABASE_SERVICE_ROLE_KEY
-- Não é necessária policy adicional para INSERT quando usando service_role

-- 4. Política de delete: apenas service_role
-- Idem acima — service_role ignora RLS por padrão

-- =============================================================
-- NOTAS:
-- - O backend usa SUPABASE_SERVICE_ROLE_KEY que tem bypass de RLS
-- - As políticas acima são para segurança extra caso você use anon key
-- - Após executar, verifique em Storage > Policies no painel Supabase
-- =============================================================
