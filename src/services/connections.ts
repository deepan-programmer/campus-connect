import { supabase } from '../lib/supabase';

export async function sendConnectionRequest(receiverId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('connections')
    .insert({
      requester_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptConnection(connectionId: string) {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) throw error;
}

export async function rejectConnection(connectionId: string) {
  const { error } = await supabase
    .from('connections')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) throw error;
}

export async function getConnections() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      requester:requester_id (
        id,
        first_name,
        last_name,
        avatar_url,
        department,
        graduation_year,
        current_employer
      ),
      receiver:receiver_id (
        id,
        first_name,
        last_name,
        avatar_url,
        department,
        graduation_year,
        current_employer
      )
    `)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export function subscribeToConnectionChanges(callback: () => void) {
  const channel = supabase
    .channel('connections-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
