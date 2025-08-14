import React, { useState } from 'react'
import { Send, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PostFormProps {
  onPostCreated: () => void
}

export function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      console.log('Creating post for user:', user.id)

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name')
        .eq('id', user.id)
        .single()

      console.log('User profile:', profile, 'Error:', profileError)

      if (profileError || !profile) {
        console.warn('Profile not found for user:', user.id, profileError)
        throw new Error('Profile not found. Please complete your profile first.')
      }

      const { data: insertData, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim()
        })
        .select()

      console.log('Insert result:', insertData, 'Error:', insertError)

      if (insertError) throw insertError

      setContent('')
      console.log('Post created successfully, triggering refresh')
      onPostCreated()
    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent placeholder-gray-500 text-gray-800 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {content.length}/500
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Add Image (Coming Soon)"
            >
              <Image className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Posting...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Post
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
