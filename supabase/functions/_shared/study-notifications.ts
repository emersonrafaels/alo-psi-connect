import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

// Fail closed when the case registry cannot be read. Never infer test status from names.
export async function isStudyNotificationBlocked(admin: SupabaseClient, target: { userId?: string; patientId?: string; email?: string; appointmentId?: string }) {
  let userId = target.userId;
  if (target.appointmentId) {
    const { data, error } = await admin.from('agendamentos').select('user_id').eq('id', target.appointmentId).maybeSingle();
    if (error) throw new Error('Notification safety check failed');
    userId = data?.user_id || userId;
  }
  if (!userId && target.email) {
    const { data, error } = await admin.from('profiles').select('user_id,id').eq('email', target.email.trim().toLowerCase()).maybeSingle();
    if (error) throw new Error('Notification safety check failed');
    if (data) {
      const result = await admin.from('synthetic_student_cases').select('id').eq('profile_id', data.id).eq('notifications_blocked', true).limit(1);
      if (result.error) throw new Error('Notification safety check failed');
      if (result.data?.length) return true;
    }
    userId = data?.user_id;
  }
  if (!userId && !target.patientId) return false;
  let query = admin.from('synthetic_student_cases').select('id').eq('notifications_blocked', true);
  query = target.patientId ? query.eq('patient_id', target.patientId) : query.eq('user_id', userId);
  const { data, error } = await query.limit(1);
  if (error) throw new Error('Notification safety check failed');
  return Boolean(data?.length);
}