import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

export interface ThreadSummary {
  thread_id: string;
  message_id: string;
  subject: string;
  preview: string;
  is_sender: boolean;
  counterpart_name: string;
  institution_name: string | null;
  unread: boolean;
  last_activity_at: string;
  recipient_count: number;
}

export type AudienceInput =
  | { kind: 'all' }
  | { kind: 'institutions'; institutionIds?: string[] }
  | { kind: 'users'; userIds: string[] }
  | { kind: 'students'; institutionId: string }
  | { kind: 'units'; institutionId: string; unitIds: string[] }
  | { kind: 'student_ids'; institutionId: string; patientIds: string[] };

export function useThreads() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['message-threads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.rpc('list_my_message_threads');
      if (error) throw error;
      return (data ?? []) as ThreadSummary[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`msg-threads-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => {
        qc.invalidateQueries({ queryKey: ['message-threads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return q;
}

export function useUnreadCount() {
  const { data } = useThreads();
  return (data ?? []).filter((t) => t.unread).length;
}

export function useThread(threadId: string | null) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['message-thread', threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data: t, error } = await db.from('message_threads')
        .select('id, sender_id, recipient_id, messages(subject, body, created_at, sender_id)')
        .eq('id', threadId).single();
      if (error) throw error;
      const { data: replies, error: rErr } = await db.from('message_replies')
        .select('id, author_id, body, created_at').eq('thread_id', threadId).order('created_at');
      if (rErr) throw rErr;
      return { thread: t, replies: replies ?? [] };
    },
  });

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`msg-replies-${threadId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_replies', filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ['message-thread', threadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, qc]);

  return q;
}

export function useMarkRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return async (t: { thread_id: string; is_sender: boolean; unread: boolean }) => {
    if (!user || !t.unread) return;
    const field = t.is_sender ? 'sender_read_at' : 'recipient_read_at';
    await db.from('message_threads').update({ [field]: new Date().toISOString() }).eq('id', t.thread_id);
    qc.invalidateQueries({ queryKey: ['message-threads'] });
  };
}

export function useSendReply(threadId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await db.from('message_replies').insert({ thread_id: threadId, author_id: user!.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['message-thread', threadId] });
      qc.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
}

async function invoke(body: unknown) {
  const { data, error } = await supabase.functions.invoke('send-message', { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try { const j = await error.context.json(); msg = typeof j.error === 'string' ? j.error : 'Dados inválidos.'; } catch { /* keep */ }
    }
    throw new Error(msg);
  }
  return data;
}

export const previewAudience = (audience: AudienceInput) =>
  invoke({ action: 'preview', audience }) as Promise<{ count: number }>;

export const sendMessage = (p: { audience: AudienceInput; subject: string; body: string; sendEmail: boolean }) =>
  invoke({ action: 'send', ...p }) as Promise<{ count: number; emailed: number }>;
