import React, { useState } from 'react'
import { TopNavigation } from './TopNavigation'
import { ControlPanel } from './ControlPanel'
import { PostList } from './PostList'
import { ProfilePage } from './ProfilePage'
import { CreatePostPopup } from './CreatePostPopup'
import { CreateCommunityPopup } from './CreateCommunityPopup'
import { AddMemberPopup } from './AddMemberPopup'
import { CommunityInfoPopup } from './CommunityInfoPopup'
import { AddToCartPopup } from './AddToCartPopup'
import { Profile } from '../lib/supabase'

interface SocialFeedProps {
  profile: Profile
  onLogout: () => void
}

export function SocialFeed({ profile, onLogout }: SocialFeedProps) {
  const [currentView, setCurrentView] = useState<'feed' | 'profile'>('feed')
  const [currentSection, setCurrentSection] = useState<'public' | 'anonymous' | string>('public')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isCommunityInfoOpen, setIsCommunityInfoOpen] = useState(false)
  const [isAddToCartOpen, setIsAddToCartOpen] = useState(false)

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setIsCreatePostOpen(false)
  }

  const handleCommunityCreated = () => {
    // Increment refresh trigger to update both posts and dropdown
    setRefreshTrigger(prev => prev + 1)
    setIsCreateCommunityOpen(false)
  }

  const handleMemberAdded = () => {
    // Refresh to update member count or any related data
    setRefreshTrigger(prev => prev + 1)
    setIsAddMemberOpen(false)
    setIsCommunityInfoOpen(false)
  }

  const handleItemAddedToCart = () => {
    // Could refresh cart count or show notification
    console.log('Item added to cart successfully!')
    // Keep popup open for now, user can close manually or continue shopping
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshTrigger(prev => prev + 1)
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleProfileClick = () => {
    setCurrentView('profile')
  }

  const handleBackToFeed = () => {
    setCurrentView('feed')
  }

  const handleSectionChange = (section: 'public' | 'anonymous' | string) => {
    setCurrentSection(section)
    setRefreshTrigger(prev => prev + 1) // Refresh posts when switching sections
  }

  const handleCreatePostOpen = () => {
    setIsCreatePostOpen(true)
  }

  const handleCreatePostClose = () => {
    setIsCreatePostOpen(false)
  }

  const handleCreateCommunityOpen = () => {
    setIsCreateCommunityOpen(true)
  }

  const handleCreateCommunityClose = () => {
    setIsCreateCommunityOpen(false)
  }

  const handleAddMemberOpen = () => {
    setIsAddMemberOpen(true)
  }

  const handleAddMemberClose = () => {
    setIsAddMemberOpen(false)
  }

  const handleCommunityInfoOpen = () => {
    setIsCommunityInfoOpen(true)
  }

  const handleCommunityInfoClose = () => {
    setIsCommunityInfoOpen(false)
  }

  const handleAddToCartOpen = () => {
    setIsAddToCartOpen(true)
  }

  const handleAddToCartClose = () => {
    setIsAddToCartOpen(false)
  }

  if (currentView === 'profile') {
    return <ProfilePage profile={profile} onBack={handleBackToFeed} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Full Screen Blur Backdrop - At the very top level */}
      {(isCreatePostOpen || isCreateCommunityOpen || isAddMemberOpen || isCommunityInfoOpen || isAddToCartOpen) && (
        <div 
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 transition-all duration-300 ease-out"
          onClick={() => {
            if (isCreatePostOpen) handleCreatePostClose()
            if (isCreateCommunityOpen) handleCreateCommunityClose()
            if (isAddMemberOpen) handleAddMemberClose()
            if (isCommunityInfoOpen) handleCommunityInfoClose()
            if (isAddToCartOpen) handleAddToCartClose()
          }}
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        />
      )}

      {/* Create Post Popup - At top level */}
      {isCreatePostOpen && (
        <CreatePostPopup
          section={currentSection}
          onPostCreated={handlePostCreated}
          onClose={handleCreatePostClose}
        />
      )}

      {/* Create Community Popup - At top level */}
      {isCreateCommunityOpen && (
        <CreateCommunityPopup
          onCommunityCreated={handleCommunityCreated}
          onClose={handleCreateCommunityClose}
        />
      )}

      {/* Add Member Popup - At top level */}
      {isAddMemberOpen && (
        <AddMemberPopup
          communityId={currentSection}
          onMemberAdded={handleMemberAdded}
          onClose={handleAddMemberClose}
        />
      )}

      {/* Community Info Popup - At top level */}
      {isCommunityInfoOpen && (
        <CommunityInfoPopup
          communityId={currentSection}
          onMemberAdded={handleMemberAdded}
          onClose={handleCommunityInfoClose}
        />
      )}

      {/* Add to Cart Popup - At top level */}
      {isAddToCartOpen && (
        <AddToCartPopup
          onItemAdded={handleItemAddedToCart}
          onClose={handleAddToCartClose}
        />
      )}

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        {/* Top Navigation */}
        <TopNavigation 
          profile={profile} 
          onProfileClick={handleProfileClick}
          onLogout={onLogout} 
        />

        {/* Control Panel - Sticky under top navigation */}
        <ControlPanel
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          onCreatePostOpen={handleCreatePostOpen}
          onCreateCommunityOpen={handleCreateCommunityOpen}
          onAddMemberOpen={handleAddMemberOpen}
          onCommunityInfoOpen={handleCommunityInfoOpen}
          onAddToCartOpen={handleAddToCartOpen}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          refreshTrigger={refreshTrigger}
        />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Posts List */}
          <PostList 
            refreshTrigger={refreshTrigger} 
            section={currentSection}
          />
        </div>
      </div>
    </div>
  )
}
