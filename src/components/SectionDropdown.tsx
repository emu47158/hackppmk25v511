import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, UserX, Users } from 'lucide-react'
import { supabase, Community, CommunityMembership } from '../lib/supabase'

interface SectionDropdownProps {
  currentSection: 'public' | 'anonymous' | string
  onSectionChange: (section: 'public' | 'anonymous' | string) => void
  refreshTrigger?: number // Add this prop to trigger refresh
}

export function SectionDropdown({ currentSection, onSectionChange, refreshTrigger }: SectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchJoinedCommunities()
  }, [])

  // Add effect to refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchJoinedCommunities()
    }
  }, [refreshTrigger])

  const fetchJoinedCommunities = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        setJoinedCommunities([])
        return
      }

      // First, get communities created by the user
      const { data: createdCommunities, error: createdError } = await supabase
        .from('communities')
        .select('*')
        .eq('created_by', user.id)
        .order('name', { ascending: true })

      if (createdError) {
        console.error('Error fetching created communities:', createdError)
      }

      // Then get communities where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('community_memberships')
        .select(`
          communities (
            id,
            name,
            description,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('communities(name)', { ascending: true })

      if (membershipError) {
        console.error('Error fetching community memberships:', membershipError)
      }

      // Combine both lists and remove duplicates
      const memberCommunities = memberships
        ?.map((membership: any) => membership.communities)
        .filter(Boolean) || []

      const allCommunities = [...(createdCommunities || []), ...memberCommunities]
      
      // Remove duplicates based on ID
      const uniqueCommunities = allCommunities.filter((community, index, self) => 
        index === self.findIndex(c => c.id === community.id)
      )

      // Sort alphabetically
      uniqueCommunities.sort((a: Community, b: Community) => a.name.localeCompare(b.name))

      setJoinedCommunities(uniqueCommunities)
      console.log('Fetched communities:', uniqueCommunities)
    } catch (error) {
      console.error('Error fetching communities:', error)
      setJoinedCommunities([])
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      id: 'public' as const,
      name: 'Public',
      description: 'Posts with your name visible',
      icon: Globe,
    },
    {
      id: 'anonymous' as const,
      name: 'Anonymous',
      description: 'Text-only posts without your name',
      icon: UserX,
    },
  ]

  const getCurrentSectionData = () => {
    // Check if current section is a community
    const community = joinedCommunities.find(c => c.id === currentSection)
    if (community) {
      return {
        name: community.name,
        description: 'Community posts',
        icon: Users
      }
    }
    
    // Otherwise, find in regular sections
    return sections.find(s => s.id === currentSection) || sections[0]
  }

  const currentSectionData = getCurrentSectionData()
  const CurrentIcon = currentSectionData.icon

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-6 py-4 backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl hover:bg-white/80 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl min-w-[220px]"
      >
        <CurrentIcon className="w-5 h-5 text-gray-700" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-gray-800">
            {currentSectionData.name}
          </p>
          <p className="text-xs text-gray-600">
            {currentSectionData.description}
          </p>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu - Enhanced visibility */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Regular Sections */}
          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = section.id === currentSection
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-6 py-4 text-left hover:bg-white/60 transition-colors duration-150 ${
                  isActive ? 'bg-white/60' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-700'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                    {section.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {section.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            )
          })}

          {/* Communities Section */}
          {joinedCommunities.length > 0 && (
            <>
              {/* Divider */}
              <div className="border-t border-white/20 mx-4"></div>
              
              {/* Communities Header */}
              <div className="px-6 py-3 bg-white/30">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Communities ({joinedCommunities.length})
                </p>
              </div>

              {/* Community List */}
              {joinedCommunities.map((community, index) => {
                const isActive = community.id === currentSection
                const isLast = index === joinedCommunities.length - 1
                
                return (
                  <button
                    key={community.id}
                    onClick={() => {
                      onSectionChange(community.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-6 py-4 text-left hover:bg-white/60 transition-colors duration-150 ${
                      isActive ? 'bg-white/60' : ''
                    } ${isLast ? 'rounded-b-2xl' : ''}`}
                  >
                    <Users className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-700'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActive ? 'text-purple-800' : 'text-gray-800'}`}>
                        {community.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {community.description || 'Community posts'}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* Loading state for communities */}
          {loading && joinedCommunities.length === 0 && (
            <>
              <div className="border-t border-white/20 mx-4"></div>
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-gray-500">Loading communities...</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
