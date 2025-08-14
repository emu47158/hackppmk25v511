import React, { useState } from 'react'
import { X, Users, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface CreateCommunityPopupProps {
  onCommunityCreated: () => void
  onClose: () => void
}

export function CreateCommunityPopup({ onCommunityCreated, onClose }: CreateCommunityPopupProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Community name is required')
      return
    }

    if (name.trim().length < 3) {
      setError('Community name must be at least 3 characters')
      return
    }

    if (name.trim().length > 50) {
      setError('Community name must be less than 50 characters')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('You must be logged in to create a community')
        return
      }

      // Create the community with explicit created_by field
      const { data, error: createError } = await supabase
        .from('communities')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('Community creation error:', createError)
        if (createError.code === '23505') {
          setError('A community with this name already exists')
        } else {
          setError(`Failed to create community: ${createError.message}`)
        }
        return
      }

      console.log('Community created successfully:', data)
      onCommunityCreated()
    } catch (error) {
      console.error('Error creating community:', error)
      setError('Failed to create community. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/95 border border-white/30 rounded-3xl shadow-2xl p-8 animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Create Community</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter community name..."
              className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-800 placeholder-gray-500"
              maxLength={50}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.length}/50 characters
            </p>
          </div>

          {/* Community Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your community..."
              rows={3}
              className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-gray-800 placeholder-gray-500 resize-none"
              maxLength={200}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/200 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50/80 border border-red-200/50 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="flex items-start space-x-2 p-3 bg-purple-50/80 border border-purple-200/50 rounded-xl">
            <Users className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium">Invite-Only Community</p>
              <p className="text-xs text-purple-600 mt-1">
                Only invited members will be able to view and post in this community.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 backdrop-blur-xl bg-gray-100/80 border border-gray-200/50 rounded-2xl hover:bg-gray-200/80 transition-all duration-200 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
