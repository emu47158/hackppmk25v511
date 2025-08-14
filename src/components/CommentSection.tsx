import React, { useState, useEffect } from 'react'
import { Send, Edit2, Trash2, MoreHorizontal } from 'lucide-react'
import { Comment, getPostComments, createComment, updateComment, deleteComment } from '../lib/supabase'

interface CommentSectionProps {
  postId: string
  isCommunityPost: boolean
  isExpanded: boolean
  onToggle: () => void
}

export function CommentSection({ postId, isCommunityPost, isExpanded, onToggle }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    if (!isExpanded) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getPostComments(postId, isCommunityPost)
      setComments(data)
    } catch (error: any) {
      console.error('Error fetching comments:', error)
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId, isCommunityPost, isExpanded])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      setError(null)
      
      const comment = await createComment(postId, newComment.trim(), isCommunityPost)
      
      // Add the new comment to the list with profile data
      const newCommentWithProfile = {
        ...comment,
        profiles: null // Will be populated when we refetch
      }
      
      setComments(prev => [...prev, newCommentWithProfile])
      setNewComment('')
      
      // Refetch to get complete profile data
      await fetchComments()
    } catch (error: any) {
      console.error('Error creating comment:', error)
      setError('Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      setError(null)
      await updateComment(commentId, editContent.trim())
      
      // Update the comment in the list
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editContent.trim(), updated_at: new Date().toISOString() }
            : comment
        )
      )
      
      setEditingComment(null)
      setEditContent('')
    } catch (error: any) {
      console.error('Error updating comment:', error)
      setError('Failed to update comment. Please try again.')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      setError(null)
      await deleteComment(commentId)
      
      // Remove the comment from the list
      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      setError('Failed to delete comment. Please try again.')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
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

  const getDisplayName = (comment: Comment) => {
    const profile = comment.profiles
    if (!profile) return 'Unknown User'
    return profile.display_name || profile.full_name || profile.username || 'User'
  }

  const getInitials = (comment: Comment) => {
    const profile = comment.profiles
    if (!profile) return 'U'
    
    const name = profile.display_name || profile.full_name || profile.username || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isExpanded) return null

  return (
    <div className="mt-4 pt-4 border-t border-white/20">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              rows={2}
              maxLength={500}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/10 disabled:text-gray-400 text-blue-700 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
                <span>{submitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-300/50 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-300/50 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              {/* Profile Picture */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {getInitials(comment)}
              </div>
              
              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                  {/* Comment Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 text-sm">
                        {getDisplayName(comment)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.created_at)}
                        {comment.updated_at !== comment.created_at && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditing(comment)}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-white/20 rounded transition-colors"
                        title="Edit comment"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-gray-500 hover:text-red-500 hover:bg-white/20 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Comment Text */}
                  {editingComment === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        rows={2}
                        maxLength={500}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim()}
                          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/10 disabled:text-gray-400 text-blue-700 text-xs rounded transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
