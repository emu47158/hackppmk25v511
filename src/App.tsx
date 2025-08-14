import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/LoginForm'
import { ProfileForm } from './components/ProfileForm'
import { SocialFeed } from './components/SocialFeed'
import { supabase, Profile } from './lib/supabase'

function App() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)

  useEffect(() => {
    if (user) {
      checkProfile()
    } else {
      setProfile(null)
      setShowProfileForm(false)
    }
  }, [user])

  const checkProfile = async () => {
    if (!user) return

    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        setShowProfileForm(false)
      } else {
        setShowProfileForm(true)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setShowProfileForm(true)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    // Profile check will be triggered by useAuth hook
  }

  const handleProfileComplete = () => {
    checkProfile()
  }

  const handleLogout = () => {
    setProfile(null)
    setShowProfileForm(false)
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3"></div>
            <span className="text-gray-700 font-medium">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onSuccess={handleLoginSuccess} />
  }

  if (showProfileForm) {
    return (
      <ProfileForm 
        userEmail={user.email || ''} 
        onComplete={handleProfileComplete} 
      />
    )
  }

  if (profile) {
    return <SocialFeed profile={profile} onLogout={handleLogout} />
  }

  return null
}

export default App
