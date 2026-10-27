CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  institution_id uuid REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  audience text NOT NULL,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject text NOT NULL,
  body text NOT NULL,
  send_email boolean NOT NULL DEFAULT false,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  recipient_patient_id uuid,
  institution_id uuid,
  recipient_replied boolean NOT NULL DEFAULT false,
  recipient_read_at timestamptz,
  sender_read_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, recipient_id)
);
CREATE INDEX idx_message_threads_recipient ON public.message_threads(recipient_id, last_activity_at DESC);
CREATE INDEX idx_message_threads_sender ON public.message_threads(sender_id, last_activity_at DESC);
GRANT SELECT ON public.message_threads TO authenticated;
GRANT UPDATE (recipient_read_at, sender_read_at) ON public.message_threads TO authenticated;
GRANT ALL ON public.message_threads TO service_role;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_replies_thread ON public.message_replies(thread_id, created_at);
GRANT SELECT, INSERT ON public.message_replies TO authenticated;
GRANT ALL ON public.message_replies TO service_role;
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_message_thread_participant(_thread_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.message_threads t
    WHERE t.id = _thread_id AND auth.uid() IN (t.sender_id, t.recipient_id))
$$;

CREATE POLICY "Participants view threads" ON public.message_threads FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Participants mark threads read" ON public.message_threads FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Sender or recipients view messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.message_threads t WHERE t.message_id = messages.id AND t.recipient_id = auth.uid()));

CREATE POLICY "Participants view replies" ON public.message_replies FOR SELECT TO authenticated
  USING (public.is_message_thread_participant(thread_id));
CREATE POLICY "Participants reply" ON public.message_replies FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_message_thread_participant(thread_id));

CREATE OR REPLACE FUNCTION public.on_message_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.message_threads t SET
    last_activity_at = NEW.created_at,
    recipient_replied = t.recipient_replied OR NEW.author_id = t.recipient_id,
    recipient_read_at = CASE WHEN NEW.author_id = t.recipient_id THEN NEW.created_at ELSE NULL END,
    sender_read_at = CASE WHEN NEW.author_id = t.sender_id THEN NEW.created_at ELSE NULL END
  WHERE t.id = NEW.thread_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_message_reply AFTER INSERT ON public.message_replies
  FOR EACH ROW EXECUTE FUNCTION public.on_message_reply();

-- Inbox listing with context-aware names: institutions see the real student name only after the student replied.
CREATE OR REPLACE FUNCTION public.list_my_message_threads()
RETURNS TABLE (
  thread_id uuid, message_id uuid, subject text, preview text, is_sender boolean,
  counterpart_name text, institution_name text, unread boolean, last_activity_at timestamptz, recipient_count integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, m.id, m.subject,
    left(coalesce((SELECT r.body FROM public.message_replies r WHERE r.thread_id = t.id ORDER BY r.created_at DESC LIMIT 1), m.body), 160),
    t.sender_id = auth.uid(),
    CASE
      WHEN t.sender_id = auth.uid() THEN
        CASE WHEN t.institution_id IS NULL OR t.recipient_replied
          THEN coalesce((SELECT p.nome FROM public.profiles p WHERE p.user_id = t.recipient_id LIMIT 1), 'Usuário')
          ELSE 'Aluno' END
      ELSE coalesce(ei.name, CASE WHEN t.institution_id IS NULL THEN 'Rede Bem-Estar' END,
             (SELECT p.nome FROM public.profiles p WHERE p.user_id = t.sender_id LIMIT 1))
    END,
    ei.name,
    CASE WHEN t.sender_id = auth.uid() THEN t.sender_read_at IS NULL AND t.recipient_replied
         ELSE t.recipient_read_at IS NULL END,
    t.last_activity_at, m.recipient_count
  FROM public.message_threads t
  JOIN public.messages m ON m.id = t.message_id
  LEFT JOIN public.educational_institutions ei ON ei.id = t.institution_id
  WHERE auth.uid() IN (t.sender_id, t.recipient_id)
  ORDER BY t.last_activity_at DESC
  LIMIT 500
$$;
GRANT EXECUTE ON FUNCTION public.list_my_message_threads() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_message_thread_participant(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_replies;