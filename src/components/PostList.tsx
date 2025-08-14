import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal, UserX, Users } from 'lucide-react'
import { supabase, Post, AnonymousPost, CommunityPost, likePost, unlikePost, getPostLikes, checkUserLikedPost, getPostComments } from '../lib/supabase'
import { CommentSection } from './CommentSection'

interface PostListProps {
  refreshTrigger: number
  section: 'public' | 'anonymous' | string
}

type CombinedPost = (Post | AnonymousPost | CommunityPost) & {
  is_anonymous?: boolean
  is_community?: boolean
  profiles?: any
  communities?: any
  like_count?: number
  user_liked?: boolean
  comment_count?: number
}

export function PostList({ refreshTrigger, section }: PostListProps) {
  const [posts, setPosts] = useState<CombinedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching posts for section:', section)
      
      if (section === 'anonymous') {
        // Fetch anonymous posts
        const { data: anonymousData, error: anonymousError } = await supabase
          .from('anonymous_posts')
          .select('id, content, created_at, updated_at')
          .order('created_at', { ascending: false })

        if (anonymousError) throw anonymousError

        console.log('Anonymous posts data:', anonymousData)

        // Mark as anonymous posts (no likes or comments for anonymous posts)
        const anonymousPosts = (anonymousData || []).map(post => ({
          ...post,
          is_anonymous: true,
          is_community: false,
          profiles: null,
          like_count: 0,
          user_liked: false,
          comment_count: 0
        }))

        setPosts(anonymousPosts)
      } else if (section === 'public') {
        // Fetch public posts
        const { data: publicData, error: publicError } = await supabase
          .from('posts')
          .select('id, content, created_at, updated_at, user_id')
          .order('created_at', { ascending: false })

        if (publicError) throw publicError

        console.log('Public posts data:', publicData)

        // Fetch profiles, likes, and comments for public posts
        const postsWithData = await Promise.all(
          (publicData || []).map(async (post) => {
            try {
              // Fetch profile
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, username')
                .eq('id', post.user_id)
                .single()

              if (profileError) {
                console.warn('Profile fetch error for user:', post.user_id, profileError)
              }

              // Fetch likes
              const likes = await getPostLikes(post.id, false)
              const userLiked = await checkUserLikedPost(post.id, false)

              // Fetch comment count
              const comments = await getPostComments(post.id, false)

              return { 
                ...post, 
                profiles: profile || null, 
                is_anonymous: false, 
                is_community: false,
                like_count: likes.length,
                user_liked: userLiked,
                comment_count: comments.length
              }
            } catch (err) {
              console.warn('Error fetching data for post:', post.id, err)
              return { 
                ...post, 
                profiles: null, 
                is_anonymous: false, 
                is_community: false,
                like_count: 0,
                user_liked: false,
                comment_count: 0
              }
            }
          })
        )

        setPosts(postsWithData)
      } else {
        // Fetch community posts - section is a community ID
        console.log('Fetching community posts for community ID:', section)
        
        const { data: communityData, error: communityError } = await supabase
          .from('community_posts')
          .select(`
            id, 
            content, 
            created_at, 
            updated_at, 
            user_id,
            community_id,
            communities (
              id,
              name,
              description
            )
          `)
          .eq('community_id', section)
          .order('created_at', { ascending: false })

        if (communityError) throw communityError

        console.log('Community posts data:', communityData)

        // Fetch profiles, likes, and comments for community posts
        const communityPostsWithData = await Promise.all(
          (communityData || []).map(async (post) => {
            try {
              // Fetch profile
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name, full_name, username')
                .eq('id', post.user_id)
                .single()

              if (profileError) {
                console.warn('Profile fetch error for user:', post.user_id, profileError)
              }

              // Fetch likes
              const likes = await getPostLikes(post.id, true)
              const userLiked = await checkUserLikedPost(post.id, true)

              // Fetch comment count
              const comments = await getPostComments(post.id, true)

              return { 
                ...post, 
                profiles: profile || null, 
                is_anonymous: false, 
                is_community: true,
                like_count: likes.length,
                user_liked: userLiked,
                comment_count: comments.length
              }
            } catch (err) {
              console.warn('Error fetching data for community post:', post.id, err)
              return { 
                ...post, 
                profiles: null, 
                is_anonymous: false, 
                is_community: true,
                like_count: 0,
                user_liked: false,
                comment_count: 0
              }
            }
          })
        )

        setPosts(communityPostsWithData)
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      setError(error.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [refreshTrigger, section])

  const handleLikeToggle = async (postId: string, isCurrentlyLiked: boolean, isCommunityPost: boolean) => {
    // Prevent multiple simultaneous like operations on the same post
    if (likingPosts.has(postId)) return

    setLikingPosts(prev => new Set(prev).add(postId))

    try {
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              user_liked: !isCurrentlyLiked,
              like_count: isCurrentlyLiked 
                ? (post.like_count || 0) - 1 
                : (post.like_count || 0) + 1
            }
          }
          return post
        })
      )

      // Perform the actual like/unlike operation
      if (isCurrentlyLiked) {
        await unlikePost(postId, isCommunityPost)
      } else {
        await likePost(postId, isCommunityPost)
      }
    } catch (error: any) {
      console.error('Error toggling like:', error)
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              user_liked: isCurrentlyLiked,
              like_count: isCurrentlyLiked 
                ? (post.like_count || 0) + 1 
                : (post.like_count || 0) - 1
            }
          }
          return post
        })
      )

      // Show error message briefly
      setError('Failed to update like. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getDisplayName = (post: CombinedPost) => {
    if (post.is_anonymous) return 'Anonymous'
    
    const profile = post.profiles
    if (!profile) return 'Unknown User'
    
    return profile.display_name || profile.full_name || profile.username || 'User'
  }

  const getInitials = (post: CombinedPost) => {
    if (post.is_anonymous) return '?'
    
    const profile = post.profiles
    if (!profile) return 'U'
    
    const name = profile.display_name || profile.full_name || profile.username || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSectionDisplayName = () => {
    if (section === 'anonymous') return 'anonymous'
    if (section === 'public') return 'public'
    return 'community'
  }

  const getSectionIcon = () => {
    if (section === 'anonymous') return UserX
    if (section === 'public') return MessageCircle
    return Users
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-300/50 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300/50 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300/50 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    const SectionIcon = getSectionIcon()
    const sectionName = getSectionDisplayName()
    
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
          <SectionIcon className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No {sectionName} posts yet
        </h3>
        <p className="text-gray-600">
          {section === 'anonymous' 
            ? 'Be the first to share an anonymous thought!'
            : section === 'public'
            ? 'Be the first to share something with the community!'
            : 'Be the first to post in this community!'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.01]">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Profile Picture */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ${
                post.is_anonymous 
                  ? 'bg-gradient-to-br from-gray-400 to-gray-600' 
                  : post.is_community
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                {getInitials(post)}
              </div>
              
              {/* User Info */}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-800">
                    {getDisplayName(post)}
                  </h3>
                  {post.is_anonymous && (
                    <UserX className="w-4 h-4 text-gray-500" />
                  )}
                  {post.is_community && (
                    <Users className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatTimeAgo(post.created_at)}
                  {post.is_community && post.communities && (
                    <span className="ml-2 text-purple-600">
                      in {post.communities.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* More Options - Only show for non-anonymous posts */}
            {!post.is_anonymous && (
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Post Content */}
          <div className={post.is_anonymous ? '' : 'mb-4'}>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Post Actions - Only show for non-anonymous posts */}
          {!post.is_anonymous && (
            <>
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div className="flex items-center space-x-6">
                  <button 
                    onClick={() => handleLikeToggle(post.id, post.user_liked || false, post.is_community || false)}
                    disabled={likingPosts.has(post.id)}
                    className={`flex items-center space-x-2 transition-colors group ${
                      post.user_liked 
                        ? 'text-red-500' 
                        : 'text-gray-500 hover:text-red-500'
                    } ${likingPosts.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart 
                      className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                        post.user_liked ? 'fill-current' : ''
                      } ${likingPosts.has(post.id) ? 'animate-pulse' : ''}`} 
                    />
                    <span className="text-sm">{post.like_count || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center space-x-2 transition-colors group ${
                      expandedComments.has(post.id)
                        ? 'text-blue-500'
                        : 'text-gray-500 hover:text-blue-500'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">{post.comment_count || 0}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors group">
                    <Share className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>

              {/* Comment Section */}
              <CommentSection
                postId={post.id}
                isCommunityPost={post.is_community || false}
                isExpanded={expandedComments.has(post.id)}
                onToggle={() => toggleComments(post.id)}
              />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
