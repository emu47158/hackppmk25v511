import React, { useState } from 'react'
import { X, Send, Globe, UserX, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CreatePostPopupProps {
  section: 'public' | 'anonymous' | string
  onPostCreated: () => void
  onClose: () => void
}

export function CreatePostPopup({ section, onPostCreated, onClose }: CreatePostPopupProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxLength = 500

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Please enter some content')
      return
    }

    if (content.length > maxLength) {
      setError(`Content must be ${maxLength} characters or less`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (section === 'anonymous') {
        // Create anonymous post
        const { error: insertError } = await supabase
          .from('anonymous_posts')
          .insert([{ content: content.trim() }])

        if (insertError) throw insertError
      } else if (section === 'public') {
        // Create public post
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          throw new Error('You must be logged in to create a post')
        }

        const { error: insertError } = await supabase
          .from('posts')
          .insert([{ 
            content: content.trim(),
            user_id: user.id
          }])

        if (insertError) throw insertError
      } else {
        // Create community post - section is community ID
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          throw new Error('You must be logged in to create a post')
        }

        const { error: insertError } = await supabase
          .from('community_posts')
          .insert([{ 
            content: content.trim(),
            user_id: user.id,
            community_id: section
          }])

        if (insertError) throw insertError
      }

      onPostCreated()
    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionInfo = () => {
    if (section === 'anonymous') {
      return {
        name: 'Anonymous',
        description: 'Your name will not be visible',
        icon: UserX,
        color: 'text-gray-600'
      }
    } else if (section === 'public') {
      return {
        name: 'Public',
        description: 'Visible to everyone with your name',
        icon: Globe,
        color: 'text-blue-600'
      }
    } else {
      return {
        name: 'Community',
        description: 'Visible to community members',
        icon: Users,
        color: 'text-purple-600'
      }
    }
  }

  const sectionInfo = getSectionInfo()
  const SectionIcon = sectionInfo.icon

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
      <div className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <SectionIcon className={`w-6 h-6 ${sectionInfo.color}`} />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Create {sectionInfo.name} Post
              </h2>
              <p className="text-sm text-gray-600">
                {sectionInfo.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind?${section === 'anonymous' ? ' (Anonymous)' : ''}`}
              className="w-full h-32 p-4 backdrop-blur-xl bg-white/50 border border-white/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-gray-800"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-sm ${
                content.length > maxLength ? 'text-red-500' : 'text-gray-500'
              }`}>
                {content.length}/{maxLength}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/20 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.length > maxLength}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
