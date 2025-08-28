import { Crown, Star, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptionStore } from '../stores/subscriptionStore'

const UpgradeButton = () => {
  const navigate = useNavigate()
  const { subscription, isProUser, isEnterpriseUser, isPaidUser } = useSubscriptionStore()

  // If user is Enterprise, show non-clickable status
  if (isEnterpriseUser()) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm shadow-lg">
        <Star className="h-4 w-4" />
        <span>Enterprise User</span>
      </div>
    )
  }

  // If user is Pro, show clickable upgrade to Enterprise
  if (isProUser()) {
    return (
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <Crown className="h-4 w-4" />
        <span>Pro User</span>
      </button>
    )
  }

  // Default upgrade button for free users
  return (
    <button
      onClick={() => navigate('/pricing')}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <Crown className="h-4 w-4" />
      <span>Upgrade your plan</span>
    </button>
  )
}

export default UpgradeButton