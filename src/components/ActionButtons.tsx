import React from 'react'
import { Plus, RefreshCw, Users, Info, UserPlus, ShoppingCart } from 'lucide-react'

interface ActionButtonsProps {
  onCreatePostOpen: () => void
  onCreateCommunityOpen: () => void
  onAddMemberOpen: () => void
  onCommunityInfoOpen: () => void
  onAddToCartOpen: () => void
  onRefresh: () => void
  isRefreshing?: boolean
  section: 'public' | 'anonymous' | string
}

export function ActionButtons({
  onCreatePostOpen,
  onCreateCommunityOpen,
  onAddMemberOpen,
  onCommunityInfoOpen,
  onAddToCartOpen,
  onRefresh,
  isRefreshing = false,
  section
}: ActionButtonsProps) {
  const isCommunityFeed = section !== 'public' && section !== 'anonymous'

  return (
    <div className="flex items-center space-x-2">
      {/* Community Info Button - Only show for community feeds */}
      {isCommunityFeed && (
        <button
          onClick={onCommunityInfoOpen}
          className="p-2.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-blue-500/20"
          title="Community Information"
        >
          <Info className="w-5 h-5" />
        </button>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={onAddToCartOpen}
        className="p-2.5 bg-gradient-to-r from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 text-green-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-green-500/20"
        title="Add to Cart"
      >
        <ShoppingCart className="w-5 h-5" />
      </button>

      {/* Create Community Button */}
      <button
        onClick={onCreateCommunityOpen}
        className="p-2.5 bg-gradient-to-r from-purple-500/20 to-pink-600/20 hover:from-purple-500/30 hover:to-pink-600/30 text-purple-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-purple-500/20"
        title="Create Community"
      >
        <Users className="w-5 h-5" />
      </button>

      {/* Add Member Button - Only show for community feeds */}
      {isCommunityFeed && (
        <button
          onClick={onAddMemberOpen}
          className="p-2.5 bg-gradient-to-r from-orange-500/20 to-red-600/20 hover:from-orange-500/30 hover:to-red-600/30 text-orange-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-orange-500/20"
          title="Add Member"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      )}

      {/* Create Post Button */}
      <button
        onClick={onCreatePostOpen}
        className="p-2.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-blue-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-blue-500/20"
        title="Create Post"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="p-2.5 bg-gradient-to-r from-gray-500/20 to-slate-600/20 hover:from-gray-500/30 hover:to-slate-600/30 disabled:from-gray-400/10 disabled:to-slate-500/10 text-gray-700 disabled:text-gray-400 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg backdrop-blur-sm border border-gray-500/20 disabled:cursor-not-allowed"
        title="Refresh"
      >
        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
