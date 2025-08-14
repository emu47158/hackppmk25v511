import React from 'react'
import { LogOut } from 'lucide-react'
import { Profile, supabase } from '../lib/supabase'

interface TopNavigationProps {
  profile: Profile
  onProfileClick: () => void
  onLogout: () => void
}

export function TopNavigation({ profile, onProfileClick, onLogout }: TopNavigationProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(profile.full_name || profile.display_name || 'U')

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">Social</h1>
          </div>

          {/* Right side - Profile box and logout */}
          <div className="flex items-center space-x-3">
            {/* Profile Box */}
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-3 p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 hover:scale-[1.02]"
            >
              {/* Profile Picture (Initials) */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {initials}
              </div>
              
              {/* Name and Username */}
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">
                  {profile.display_name || profile.full_name}
                </p>
                {profile.username && (
                  <p className="text-xs text-gray-600">@{profile.username}</p>
                )}
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl hover:bg-red-500/30 text-red-600 transition-all duration-200 hover:scale-[1.02]"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
