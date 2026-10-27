ALTER TABLE public.message_replies ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT true;
ALTER TABLE public.message_threads ADD COLUMN IF NOT EXISTS recipient_identified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.on_message_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.message_threads t SET
    last_activity_at = NEW.created_at,
    recipient_replied = t.recipient_replied OR NEW.author_id = t.recipient_id,
    recipient_identified = t.recipient_identified OR (NEW.author_id = t.recipient_id AND NOT NEW.is_anonymous),
    recipient_read_at = CASE WHEN NEW.author_id = t.recipient_id THEN NEW.created_at ELSE NULL END,
    sender_read_at = CASE WHEN NEW.author_id = t.sender_id THEN NEW.created_at ELSE NULL END
  WHERE t.id = NEW.thread_id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.on_message_reply() FROM PUBLIC, anon, authenticated;

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
        CASE WHEN t.institution_id IS NULL OR t.recipient_identified
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
REVOKE EXECUTE ON FUNCTION public.list_my_message_threads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_my_message_threads() TO authenticated;