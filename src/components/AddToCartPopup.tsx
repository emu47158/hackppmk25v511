import React, { useState, useEffect } from 'react'
import { X, ShoppingCart, Plus, Minus, Package, Star, Upload, Camera, Trash2, Edit, DollarSign, Tag, Info } from 'lucide-react'
import { supabase, MarketplaceItem, getMarketplaceItems, createMarketplaceItem, updateMarketplaceItem, deleteMarketplaceItem, uploadItemImage, deleteItemImage } from '../lib/supabase'

interface AddToCartPopupProps {
  onClose: () => void
  onItemAdded: () => void
}

interface Product {
  id: string
  name: string
  price: number
  image: string
  description: string
  rating: number
  inStock: number
}

// Sample products for demonstration
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 199.99,
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'High-quality wireless headphones with noise cancellation',
    rating: 4.8,
    inStock: 15
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 299.99,
    image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Advanced fitness tracking with heart rate monitor',
    rating: 4.6,
    inStock: 8
  },
  {
    id: '3',
    name: 'Portable Bluetooth Speaker',
    price: 89.99,
    image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Compact speaker with powerful sound and long battery life',
    rating: 4.5,
    inStock: 22
  },
  {
    id: '4',
    name: 'Wireless Charging Pad',
    price: 49.99,
    image: 'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Fast wireless charging for compatible devices',
    rating: 4.3,
    inStock: 35
  }
]

const categories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Automotive',
  'Health & Beauty',
  'Other'
]

const conditions = [
  { value: 'new', label: 'New', description: 'Brand new, never used' },
  { value: 'like_new', label: 'Like New', description: 'Excellent condition, barely used' },
  { value: 'good', label: 'Good', description: 'Good condition, some signs of use' },
  { value: 'fair', label: 'Fair', description: 'Fair condition, noticeable wear' },
  { value: 'poor', label: 'Poor', description: 'Poor condition, significant wear' }
]

export function AddToCartPopup({ onClose, onItemAdded }: AddToCartPopupProps) {
  const [currentView, setCurrentView] = useState<'marketplace' | 'sell' | 'product-detail' | 'my-items'>('marketplace')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedMarketplaceItem, setSelectedMarketplaceItem] = useState<MarketplaceItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({})
  
  // Marketplace state
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([])
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Sell item form state
  const [sellForm, setSellForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Electronics',
    condition: 'good'
  })
  const [sellImages, setSellImages] = useState<File[]>([])
  const [sellImagePreviews, setSellImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (currentView === 'marketplace') {
      loadMarketplaceItems()
    } else if (currentView === 'my-items') {
      loadMyItems()
    }
  }, [currentView])

  const loadMarketplaceItems = async () => {
    setLoading(true)
    try {
      const items = await getMarketplaceItems()
      setMarketplaceItems(items)
    } catch (error) {
      console.error('Error loading marketplace items:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMyItems = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const items = await getMarketplaceItems(user.id)
        setMyItems(items)
      }
    } catch (error) {
      console.error('Error loading my items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCartItems(prev => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + quantity
      }))
      
      setQuantity(1)
      setSelectedProduct(null)
      onItemAdded()
      
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + sellImages.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }

    setSellImages(prev => [...prev, ...files])
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSellImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setSellImages(prev => prev.filter((_, i) => i !== index))
    setSellImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSellItem = async () => {
    if (!sellForm.title || !sellForm.price || sellImages.length === 0) {
      alert('Please fill in all required fields and add at least one image')
      return
    }

    setUploading(true)
    try {
      console.log('Starting item creation process...')
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth check:', { user: user?.id, authError })
      
      if (authError) {
        console.error('Authentication error:', authError)
        throw new Error('Authentication failed')
      }
      
      if (!user) {
        console.error('No authenticated user found')
        throw new Error('Please log in to create listings')
      }

      // Create the item data
      const itemData = {
        title: sellForm.title.trim(),
        description: sellForm.description.trim(),
        price: parseFloat(sellForm.price),
        category: sellForm.category,
        condition: sellForm.condition,
        images: [] as string[]
      }

      console.log('Item data to create:', itemData)

      // Validate price
      if (isNaN(itemData.price) || itemData.price <= 0) {
        throw new Error('Please enter a valid price')
      }

      // Create the item first
      console.log('Creating marketplace item...')
      const newItem = await createMarketplaceItem(itemData)
      console.log('Item created successfully:', newItem)

      // Upload images
      console.log('Uploading images...')
      const imageUrls: string[] = []
      for (let i = 0; i < sellImages.length; i++) {
        const file = sellImages[i]
        console.log(`Uploading image ${i + 1}/${sellImages.length}:`, file.name)
        try {
          const imageUrl = await uploadItemImage(file, newItem.id)
          imageUrls.push(imageUrl)
          console.log(`Image ${i + 1} uploaded successfully:`, imageUrl)
        } catch (imageError) {
          console.error(`Error uploading image ${i + 1}:`, imageError)
          throw new Error(`Failed to upload image ${i + 1}`)
        }
      }

      // Update item with image URLs
      console.log('Updating item with image URLs:', imageUrls)
      await updateMarketplaceItem(newItem.id, { images: imageUrls })
      console.log('Item updated with images successfully')

      // Reset form
      setSellForm({
        title: '',
        description: '',
        price: '',
        category: 'Electronics',
        condition: 'good'
      })
      setSellImages([])
      setSellImagePreviews([])

      // Refresh marketplace and switch view
      console.log('Refreshing marketplace...')
      await loadMarketplaceItems()
      setCurrentView('marketplace')
      
      console.log('Item creation process completed successfully')

    } catch (error) {
      console.error('Detailed error in handleSellItem:', error)
      
      // More specific error messages
      let errorMessage = 'Error creating item. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          errorMessage = 'Please log in to create listings.'
        } else if (error.message.includes('price')) {
          errorMessage = 'Please enter a valid price.'
        } else if (error.message.includes('upload')) {
          errorMessage = 'Failed to upload images. Please try again.'
        } else if (error.message.includes('RLS')) {
          errorMessage = 'Permission denied. Please check your account status.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteMarketplaceItem(itemId)
      loadMyItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item. Please try again.')
    }
  }

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-500 fill-current' 
            : i < rating 
            ? 'text-yellow-500 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-600 bg-green-100'
      case 'like_new': return 'text-blue-600 bg-blue-100'
      case 'good': return 'text-yellow-600 bg-yellow-100'
      case 'fair': return 'text-orange-600 bg-orange-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Marketplace</h2>
              <p className="text-sm text-gray-600">
                {currentView === 'marketplace' ? 'Browse items from other users' :
                 currentView === 'sell' ? 'Sell your second-hand items' :
                 currentView === 'my-items' ? 'Manage your listings' :
                 'Shop from our catalog'}
                {getTotalCartItems() > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-700 rounded-full text-xs">
                    {getTotalCartItems()} items in cart
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/20 bg-white/5">
          <button
            onClick={() => setCurrentView('marketplace')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentView === 'marketplace'
                ? 'text-green-700 border-b-2 border-green-500 bg-green-500/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
            }`}
          >
            Browse Marketplace
          </button>
          <button
            onClick={() => setCurrentView('sell')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentView === 'sell'
                ? 'text-blue-700 border-b-2 border-blue-500 bg-blue-500/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
            }`}
          >
            Sell Item
          </button>
          <button
            onClick={() => setCurrentView('my-items')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentView === 'my-items'
                ? 'text-purple-700 border-b-2 border-purple-500 bg-purple-500/10'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
            }`}
          >
            My Items
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentView === 'marketplace' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceItems.map((item) => (
                    <div
                      key={item.id}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                      onClick={() => setSelectedMarketplaceItem(item)}
                    >
                      {/* Item Image */}
                      <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-white/10">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                            {conditions.find(c => c.value === item.condition)?.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.category}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-lg font-bold text-green-600">
                            ${item.price}
                          </div>
                          <div className="text-xs text-gray-500">
                            by {item.profiles?.display_name || item.profiles?.username}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'sell' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Sell Your Item</h3>
                <p className="text-gray-600">Upload photos and details of your second-hand item</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Photos (Required - Max 5 images)
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sellImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-white/10 border border-white/20">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {sellImagePreviews.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center space-y-2 transition-colors">
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={sellForm.title}
                      onChange={(e) => setSellForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                      placeholder="What are you selling?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={sellForm.price}
                        onChange={(e) => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={sellForm.category}
                      onChange={(e) => setSellForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      value={sellForm.condition}
                      onChange={(e) => setSellForm(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    >
                      {conditions.map(condition => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label} - {condition.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={sellForm.description}
                      onChange={(e) => setSellForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                      placeholder="Describe your item..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSellItem}
                disabled={uploading || !sellForm.title || !sellForm.price || sellImages.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 disabled:from-gray-400/10 disabled:to-gray-500/10 text-blue-700 disabled:text-gray-400 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg backdrop-blur-sm border border-blue-500/20 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Listing...</span>
                  </div>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          )}

          {currentView === 'my-items' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : myItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No items listed yet</h3>
                  <p className="text-gray-500 mb-4">Start selling by creating your first listing</p>
                  <button
                    onClick={() => setCurrentView('sell')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 hover:from-blue-500/30 hover:to-purple-600/30 text-blue-700 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg backdrop-blur-sm border border-blue-500/20"
                  >
                    Create First Listing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myItems.map((item) => (
                    <div
                      key={item.id}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:shadow-xl transition-all duration-200"
                    >
                      {/* Item Image */}
                      <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 relative">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                        {item.is_sold && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">SOLD</span>
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                            {conditions.find(c => c.value === item.condition)?.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.category}
                          </span>
                        </div>

                        <div className="text-lg font-bold text-green-600">
                          ${item.price}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex-1 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-700 rounded-lg font-medium transition-all duration-200 text-sm"
                          >
                            Delete
                          </button>
                          {!item.is_sold && (
                            <button
                              onClick={() => updateMarketplaceItem(item.id, { is_sold: true }).then(() => loadMyItems())}
                              className="flex-1 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-green-700 rounded-lg font-medium transition-all duration-200 text-sm"
                            >
                              Mark Sold
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Marketplace Item Detail View */}
          {selectedMarketplaceItem && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                  <h3 className="text-xl font-bold text-gray-800">Item Details</h3>
                  <button
                    onClick={() => setSelectedMarketplaceItem(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-white">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Images */}
                    <div className="space-y-4">
                      {selectedMarketplaceItem.images && selectedMarketplaceItem.images.length > 0 ? (
                        <div className="space-y-4">
                          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                              src={selectedMarketplaceItem.images[0]}
                              alt={selectedMarketplaceItem.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {selectedMarketplaceItem.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedMarketplaceItem.images.slice(1).map((image, index) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  <img src={image} alt={`${selectedMarketplaceItem.title} ${index + 2}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {selectedMarketplaceItem.title}
                        </h3>
                        <div className="flex items-center space-x-3 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(selectedMarketplaceItem.condition)}`}>
                            {conditions.find(c => c.value === selectedMarketplaceItem.condition)?.label}
                          </span>
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {selectedMarketplaceItem.category}
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                          {selectedMarketplaceItem.description}
                        </p>
                      </div>

                      <div className="text-3xl font-bold text-green-600">
                        ${selectedMarketplaceItem.price}
                      </div>

                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600">
                          Sold by: <span className="font-medium text-gray-800">{selectedMarketplaceItem.profiles?.display_name || selectedMarketplaceItem.profiles?.username}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Listed on: {new Date(selectedMarketplaceItem.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg"
                      >
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
