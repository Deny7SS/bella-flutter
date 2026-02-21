
-- Tabela para salvar progresso de reprodução IPTV por usuário e conteúdo
CREATE TABLE public.iptv_progresso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_id text NOT NULL,
  content_title text,
  posicao_segundos integer NOT NULL DEFAULT 0,
  duracao_segundos integer,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

-- RLS
ALTER TABLE public.iptv_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own iptv_progresso"
  ON public.iptv_progresso FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own iptv_progresso"
  ON public.iptv_progresso FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own iptv_progresso"
  ON public.iptv_progresso FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own iptv_progresso"
  ON public.iptv_progresso FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_iptv_progresso_updated_at
  BEFORE UPDATE ON public.iptv_progresso
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
