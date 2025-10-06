import { supabase } from '../lib/supabase';

export async function createConversation(participantIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (convError) throw convError;

  const allParticipants = [user.id, ...participantIds.filter(id => id !== user.id)];

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert(
      allParticipants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
      }))
    );

  if (participantsError) throw participantsError;

  return conversation;
}

export async function getOrCreateConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existingConversations, error: fetchError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (fetchError) throw fetchError;

  if (existingConversations && existingConversations.length > 0) {
    const conversationIds = existingConversations.map(c => c.conversation_id);

    const { data: otherUserConversations, error: otherError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', conversationIds);

    if (otherError) throw otherError;

    if (otherUserConversations && otherUserConversations.length > 0) {
      const sharedConvId = otherUserConversations[0].conversation_id;
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', sharedConvId)
        .single();

      if (convError) throw convError;
      return conversation;
    }
  }

  return await createConversation([otherUserId]);
}

export async function getConversations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userConversations, error: fetchError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (fetchError) throw fetchError;

  if (!userConversations || userConversations.length === 0) {
    return [];
  }

  const conversationIds = userConversations.map(c => c.conversation_id);

  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_participants (
        user_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convError) throw convError;
  return conversations;
}

export async function sendMessage(conversationId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select(`
      *,
      profiles:sender_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('read', false);

  if (error) throw error;
}

export function subscribeToMessages(conversationId: string, callback: () => void) {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
