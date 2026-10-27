REVOKE EXECUTE ON FUNCTION public.list_my_message_threads() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_message_thread_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_message_reply() FROM PUBLIC, anon, authenticated;