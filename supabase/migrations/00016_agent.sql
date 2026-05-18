-- ============================================================
-- Ascend — Agente IA conversacional (FASE 4)
-- Migración: 00016_agent.sql
-- ============================================================

-- Conversaciones
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own conversations"
  ON public.agent_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mensajes
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('user','assistant','system')),
  content         text        NOT NULL,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own messages"
  ON public.agent_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notificaciones del agente
CREATE TABLE IF NOT EXISTS public.agent_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text        NOT NULL,
  payload    jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own notifications"
  ON public.agent_notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at en conversaciones
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.agent_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER message_updates_conversation
  AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_updated_at();
