import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name?: string
  display_name?: string
  username?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile | null
}

export type AnonymousPost = {
  id: string
  content: string
  created_at: string
  updated_at: string
}

export type Community = {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export type CommunityMembership = {
  id: string
  community_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  communities?: Community
}

export type CommunityPost = {
  id: string
  community_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile | null
  communities?: Community
}

export type Like = {
  id: string
  post_id?: string
  community_post_id?: string
  user_id: string
  created_at: string
}

export type Comment = {
  id: string
  post_id?: string
  community_post_id?: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile | null
}

export type MarketplaceItem = {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  images: string[]
  is_sold: boolean
  created_at: string
  updated_at: string
  profiles?: Profile | null
}

// Like management functions
export const likePost = async (postId: string, isCommunityPost: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const likeData = isCommunityPost 
    ? { community_post_id: postId, user_id: user.id }
    : { post_id: postId, user_id: user.id }

  const { data, error } = await supabase
    .from('likes')
    .insert([likeData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const unlikePost = async (postId: string, isCommunityPost: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const query = supabase
    .from('likes')
    .delete()
    .eq('user_id', user.id)

  if (isCommunityPost) {
    query.eq('community_post_id', postId)
  } else {
    query.eq('post_id', postId)
  }

  const { error } = await query

  if (error) throw error
}

export const getPostLikes = async (postId: string, isCommunityPost: boolean = false) => {
  const query = supabase
    .from('likes')
    .select('id, user_id, created_at')

  if (isCommunityPost) {
    query.eq('community_post_id', postId)
  } else {
    query.eq('post_id', postId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export const checkUserLikedPost = async (postId: string, isCommunityPost: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const query = supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)

  if (isCommunityPost) {
    query.eq('community_post_id', postId)
  } else {
    query.eq('post_id', postId)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// Comment management functions
export const createComment = async (postId: string, content: string, isCommunityPost: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const commentData = isCommunityPost 
    ? { community_post_id: postId, user_id: user.id, content }
    : { post_id: postId, user_id: user.id, content }

  const { data, error } = await supabase
    .from('comments')
    .insert([commentData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getPostComments = async (postId: string, isCommunityPost: boolean = false) => {
  const query = supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      updated_at,
      user_id,
      profiles (
        id,
        display_name,
        full_name,
        username
      )
    `)
    .order('created_at', { ascending: true })

  if (isCommunityPost) {
    query.eq('community_post_id', postId)
  } else {
    query.eq('post_id', postId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export const updateComment = async (commentId: string, content: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteComment = async (commentId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw error
}

// Marketplace item management functions
export const createMarketplaceItem = async (itemData: {
  title: string
  description: string
  price: number
  category: string
  condition: string
  images: string[]
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert([{
      ...itemData,
      seller_id: user.id
    }])
    .select(`
      *,
      profiles (
        id,
        display_name,
        full_name,
        username
      )
    `)
    .single()

  if (error) throw error
  return data
}

export const getMarketplaceItems = async (sellerId?: string) => {
  let query = supabase
    .from('marketplace_items')
    .select(`
      *,
      profiles (
        id,
        display_name,
        full_name,
        username
      )
    `)
    .order('created_at', { ascending: false })

  if (sellerId) {
    query = query.eq('seller_id', sellerId)
  } else {
    query = query.eq('is_sold', false)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export const updateMarketplaceItem = async (itemId: string, updates: {
  title?: string
  description?: string
  price?: number
  category?: string
  condition?: string
  images?: string[]
  is_sold?: boolean
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('marketplace_items')
    .update(updates)
    .eq('id', itemId)
    .eq('seller_id', user.id)
    .select(`
      *,
      profiles (
        id,
        display_name,
        full_name,
        username
      )
    `)
    .single()

  if (error) throw error
  return data
}

export const deleteMarketplaceItem = async (itemId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('marketplace_items')
    .delete()
    .eq('id', itemId)
    .eq('seller_id', user.id)

  if (error) throw error
}

// Enhanced image upload function with better error handling
export const uploadItemImage = async (file: File, itemId: string): Promise<string> => {
  console.log('Starting image upload process...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user found for image upload')
    throw new Error('User not authenticated')
  }

  console.log('User authenticated:', user.id)

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Invalid file type:', file.type)
    throw new Error('File must be an image')
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    console.error('File too large:', file.size, 'bytes')
    throw new Error('File size must be less than 5MB')
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const fileName = `${user.id}/${itemId}/${Date.now()}.${fileExt}`
  
  console.log('Uploading file:', {
    fileName,
    fileSize: file.size,
    fileType: file.type,
    bucket: 'marketplace-images'
  })

  try {
    const { data, error } = await supabase.storage
      .from('marketplace-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('Upload successful:', data)

    const { data: { publicUrl } } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(fileName)

    console.log('Public URL generated:', publicUrl)
    return publicUrl

  } catch (error) {
    console.error('Error in uploadItemImage:', error)
    throw error
  }
}

export const deleteItemImage = async (imageUrl: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Extract file path from URL
  const urlParts = imageUrl.split('/')
  const fileName = urlParts.slice(-3).join('/')

  const { error } = await supabase.storage
    .from('marketplace-images')
    .remove([fileName])

  if (error) throw error
}
