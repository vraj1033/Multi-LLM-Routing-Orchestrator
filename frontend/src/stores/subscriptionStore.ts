import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Subscription {
  id: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  startDate: string
  endDate?: string
  paymentId?: string
}

interface SubscriptionState {
  subscription: Subscription | null
  setSubscription: (subscription: Subscription) => void
  updateSubscription: (updates: Partial<Subscription>) => void
  clearSubscription: () => void
  isProUser: () => boolean
  isEnterpriseUser: () => boolean
  isPaidUser: () => boolean
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,

      setSubscription: (subscription) => {
        set({ subscription })
      },

      updateSubscription: (updates) => {
        const current = get().subscription
        if (current) {
          set({ subscription: { ...current, ...updates } })
        }
      },

      clearSubscription: () => {
        set({ subscription: null })
      },

      isProUser: () => {
        const subscription = get().subscription
        return subscription?.plan === 'pro' && subscription?.status === 'active'
      },

      isEnterpriseUser: () => {
        const subscription = get().subscription
        return subscription?.plan === 'enterprise' && subscription?.status === 'active'
      },

      isPaidUser: () => {
        const subscription = get().subscription
        return (subscription?.plan === 'pro' || subscription?.plan === 'enterprise') && 
               subscription?.status === 'active'
      }
    }),
    {
      name: 'subscription-storage'
    }
  )
)