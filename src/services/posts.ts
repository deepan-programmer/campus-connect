import { supabase } from '../lib/supabase';

export async function createPost(content: string, postType: string = 'update') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content,
      post_type: postType,
    })
    .select(`
      *,
      profiles:author_id (
        id,
        first_name,
        last_name,
        avatar_url,
        department,
        graduation_year,
        current_employer
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id (
        id,
        first_name,
        last_name,
        avatar_url,
        department,
        graduation_year,
        current_employer
      ),
      likes (count),
      comments (count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function likePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('likes')
    .insert({
      post_id: postId,
      user_id: user.id,
    });

  if (error) throw error;
}

export async function unlikePost(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getUserLikes(userId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map(like => like.post_id) || [];
}

export async function addComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export function subscribeToPostChanges(callback: () => void) {
  const channel = supabase
    .channel('posts-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
