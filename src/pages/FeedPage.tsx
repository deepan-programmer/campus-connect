import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPost, getPosts, likePost, unlikePost, getUserLikes, addComment, getComments, subscribeToPostChanges } from '../services/posts';
import { mockPosts, mockProfiles } from '../data/mockData';

interface PostData {
  id: string;
  content: string;
  author_id: string;
  post_type: string;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    department?: string;
  };
  likesCount: number;
  commentsCount: number;
  userLiked: boolean;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export function FeedPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
  const [selectedPostComments, setSelectedPostComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [useSupabase, setUseSupabase] = useState(false);

  useEffect(() => {
    loadPosts();

    if (profile?.id) {
      loadUserLikes();
    }

    const unsubscribe = subscribeToPostChanges(() => {
      loadPosts();
    });

    return () => {
      unsubscribe();
    };
  }, [profile?.id]);

  const loadPosts = async () => {
    try {
      const data = await getPosts();
      if (data && data.length > 0) {
        setUseSupabase(true);
        const formattedPosts = data.map((post: any) => ({
          id: post.id,
          content: post.content,
          author_id: post.author_id,
          post_type: post.post_type,
          created_at: post.created_at,
          profiles: post.profiles,
          likesCount: Array.isArray(post.likes) ? post.likes.length : (post.likes?.[0]?.count || 0),
          commentsCount: Array.isArray(post.comments) ? post.comments.length : (post.comments?.[0]?.count || 0),
          userLiked: false,
        }));
        setPosts(formattedPosts);
      } else {
        setUseSupabase(false);
        const mockData = mockPosts.map(post => ({
          ...post,
          author_id: post.authorId,
          post_type: post.postType,
          created_at: post.createdAt,
        }));
        setPosts(mockData as any);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setUseSupabase(false);
      const mockData = mockPosts.map(post => ({
        ...post,
        author_id: post.authorId,
        post_type: post.postType,
        created_at: post.createdAt,
      }));
      setPosts(mockData as any);
    }
  };

  const loadUserLikes = async () => {
    if (!profile?.id) return;
    try {
      const likes = await getUserLikes(profile.id);
      setUserLikedPosts(likes);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (useSupabase) {
        await createPost(newPostContent, 'update');
        setNewPostContent('');
        await loadPosts();
      } else {
        const newPost = {
          id: Date.now().toString(),
          content: newPostContent,
          author_id: profile?.id || '1',
          post_type: 'update',
          created_at: new Date().toISOString(),
          profiles: {
            id: profile?.id || '1',
            first_name: profile?.firstName || 'User',
            last_name: profile?.lastName || 'Name',
            avatar_url: profile?.avatarUrl,
            department: profile?.department,
          },
          likesCount: 0,
          commentsCount: 0,
          userLiked: false,
        };
        setPosts([newPost, ...posts]);
        setNewPostContent('');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    const isLiked = userLikedPosts.includes(postId);

    try {
      if (useSupabase) {
        if (isLiked) {
          await unlikePost(postId);
          setUserLikedPosts(userLikedPosts.filter(id => id !== postId));
        } else {
          await likePost(postId);
          setUserLikedPosts([...userLikedPosts, postId]);
        }
      }

      setPosts(posts.map(post =>
        post.id === postId
          ? {
              ...post,
              userLiked: !isLiked,
              likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      if (useSupabase) {
        const postComments = await getComments(postId);
        setComments(prev => ({ ...prev, [postId]: postComments }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleShowComments = async (postId: string) => {
    if (selectedPostComments === postId) {
      setSelectedPostComments(null);
    } else {
      setSelectedPostComments(postId);
      await loadComments(postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;

    try {
      if (useSupabase) {
        await addComment(postId, commentInput);
        await loadComments(postId);
        setCommentInput('');

        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        ));
      } else {
        const newComment: CommentData = {
          id: Date.now().toString(),
          content: commentInput,
          created_at: new Date().toISOString(),
          profiles: {
            id: profile?.id || '1',
            first_name: profile?.firstName || 'User',
            last_name: profile?.lastName || 'Name',
            avatar_url: profile?.avatarUrl,
          },
        };
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setCommentInput('');

        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const getAuthorProfile = (authorId: string) => {
    return mockProfiles.find((p) => p.id === authorId);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Campus Feed</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Your avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </div>
          )}
          <div className="flex-1">
            <textarea
              placeholder="Share something with the campus community..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleCreatePost}
                disabled={isSubmitting || !newPostContent.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => {
          const author = post.profiles || getAuthorProfile(post.author_id);
          const isLiked = userLikedPosts.includes(post.id) || post.userLiked;
          const postComments = comments[post.id] || [];

          return (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {('avatar_url' in author && author.avatar_url) || ('avatarUrl' in author && author.avatarUrl) ? (
                  <img
                    src={('avatar_url' in author ? author.avatar_url : null) || ('avatarUrl' in author ? author.avatarUrl : null) || ''}
                    alt={`${('first_name' in author ? author.first_name : null) || ('firstName' in author ? author.firstName : '')} ${('last_name' in author ? author.last_name : null) || ('lastName' in author ? author.lastName : '')}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {(('first_name' in author ? author.first_name : null) || ('firstName' in author ? author.firstName : 'U'))?.[0]}
                    {(('last_name' in author ? author.last_name : null) || ('lastName' in author ? author.lastName : 'U'))?.[0]}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {('first_name' in author ? author.first_name : null) || ('firstName' in author ? author.firstName : '')} {('last_name' in author ? author.last_name : null) || ('lastName' in author ? author.lastName : '')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {author?.department} • {getTimeAgo(post.created_at)}
                      </p>
                    </div>
                    {post.post_type === 'announcement' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Announcement
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-gray-800 whitespace-pre-wrap">{post.content}</p>

                  <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Heart
                        size={20}
                        className={isLiked ? 'fill-red-600 text-red-600' : ''}
                      />
                      <span className="text-sm font-medium">{post.likesCount}</span>
                    </button>
                    <button
                      onClick={() => handleShowComments(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={20} />
                      <span className="text-sm font-medium">{post.commentsCount}</span>
                    </button>
                  </div>

                  {selectedPostComments === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-3 mb-4">
                        {postComments.map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            {comment.profiles?.avatar_url ? (
                              <img
                                src={comment.profiles.avatar_url}
                                alt="Commenter"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                                {comment.profiles?.first_name?.[0]}
                                {comment.profiles?.last_name?.[0]}
                              </div>
                            )}
                            <div className="flex-1 bg-gray-50 rounded-lg p-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {comment.profiles?.first_name} {comment.profiles?.last_name}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInput.trim()}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
