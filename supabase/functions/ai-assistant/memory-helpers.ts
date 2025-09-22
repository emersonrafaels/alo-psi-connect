// Helper functions for managing conversation memory

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

export async function manageSessionAndMemory(supabase: any, sessionId: string, userId?: string, userMessage?: string) {
  try {
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('ai_chat_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .single();

    if (!existingSession) {
      // Create new session only if it doesn't exist
      const { error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          updated_at: new Date().toISOString(),
          metadata: { last_activity: new Date().toISOString() }
        });

      if (sessionError) {
        console.error('❌ Error creating session:', sessionError);
      }
    } else {
      // Update existing session
      const { error: updateError } = await supabase
        .from('ai_chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
          metadata: { last_activity: new Date().toISOString() }
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('❌ Error updating session:', updateError);
      }
    }

    // Save user message if provided
    if (userMessage) {
      await saveMessage(supabase, sessionId, 'user', userMessage);
    }

    // Clean old messages to maintain 50 message window
    await cleanOldMessages(supabase, sessionId);

  } catch (error) {
    console.error('❌ Error in manageSessionAndMemory:', error);
  }
}

export async function saveMessage(supabase: any, sessionId: string, role: string, content: string) {
  try {
    const { error } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error saving message:', error);
    }
  } catch (error) {
    console.error('❌ Error in saveMessage:', error);
  }
}

export async function getConversationHistory(supabase: any, sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('role, content, timestamp')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
      .limit(50); // Memory window of 50 messages

    if (error) {
      console.error('❌ Error fetching conversation history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getConversationHistory:', error);
    return [];
  }
}

export async function cleanOldMessages(supabase: any, sessionId: string) {
  try {
    // Keep only the latest 50 messages per session
    const { data: messages } = await supabase
      .from('ai_chat_messages')
      .select('id')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (messages && messages.length === 50) {
      // Get the ID of the 50th message
      const cutoffId = messages[49].id;

      // Delete messages older than the 50th
      const { error } = await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .not('id', 'in', `(${messages.map(m => `'${m.id}'`).join(',')})`);

      if (error) {
        console.error('❌ Error cleaning old messages:', error);
      } else {
        console.log('🧹 Cleaned old messages for session:', sessionId);
      }
    }
  } catch (error) {
    console.error('❌ Error in cleanOldMessages:', error);
  }
}
