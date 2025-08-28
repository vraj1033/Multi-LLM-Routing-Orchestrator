import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Zap, Star, ArrowLeft, Users, Shield, Clock, Sparkles, TrendingUp, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useAuthStore } from '../stores/authStore'

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingPlan {
  id: string
  name: string
  price: number
  originalPrice?: number
  period: string
  description: string
  features: string[]
  popular?: boolean
  buttonText: string
  razorpayPlanId: string
}

const PricingPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const { subscription, setSubscription } = useSubscriptionStore()
  const { user } = useAuthStore()

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '100 AI requests per month',
        'Basic chat functionality',
        'Standard response time',
        'Community support',
        'Basic analytics'
      ],
      buttonText: 'Current Plan',
      razorpayPlanId: ''
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 999,
      originalPrice: 1499,
      period: 'month',
      description: 'Best for professionals and teams',
      features: [
        '10,000 AI requests per month',
        'Priority response time',
        'Advanced chat features',
        'Custom AI models',
        'Priority support',
        'Advanced analytics',
        'API access',
        'Custom integrations'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro',
      razorpayPlanId: 'plan_pro_monthly'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 4999,
      originalPrice: 7499,
      period: 'month',
      description: 'For large organizations',
      features: [
        'Unlimited AI requests',
        'Fastest response time',
        'All Pro features',
        'Dedicated support',
        'Custom deployment',
        'Advanced security',
        'SLA guarantee',
        'Custom training',
        'White-label solution'
      ],
      buttonText: 'Contact Sales',
      razorpayPlanId: 'plan_enterprise_monthly'
    }
  ]

  const handlePayment = async (plan: PricingPlan) => {
    if (plan.id === 'free') return
    if (!user?.id) {
      alert('Please log in to upgrade your plan.')
      navigate('/login')
      return
    }
    
    // Check if user already has this plan
    if (subscription?.plan === plan.id && subscription?.status === 'active') {
      alert('You already have this plan!')
      return
    }
    
    setLoading(plan.id)
    
    try {
      // Initialize Razorpay
      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID, // Your Razorpay key ID
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        name: 'AI Chat Platform',
        description: `${plan.name} Plan Subscription`,
        image: '/logo.png', // Your logo
        order_id: '', // This should come from your backend
        handler: function (response: any) {
          // Handle successful payment
          console.log('Payment successful:', response)
          // Send payment details to your backend for verification
          verifyPayment(response, plan)
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        notes: {
          plan_id: plan.id,
          plan_name: plan.name
        },
        theme: {
          color: '#7C3AED'
        },
        modal: {
          ondismiss: function() {
            setLoading(null)
          }
        }
      }

      // Create order from backend first
      const orderResponse = await fetch(`${(import.meta as any).env.VITE_API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100,
          currency: 'INR',
          plan_id: plan.id,
          user_id: user?.id ?? 0
        })
      })

      const orderData = await orderResponse.json()
      options.order_id = orderData.order_id

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Payment initialization failed:', error)
      setLoading(null)
    }
  }

  const verifyPayment = async (response: any, plan: PricingPlan) => {
    try {
      const verifyResponse = await fetch(`${(import.meta as any).env.VITE_API_BASE_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan_id: plan.id,
          user_id: user?.id ?? 0
        })
      })

      const verifyData = await verifyResponse.json()
      
      if (verifyData.success) {
        // Payment verified successfully - update subscription
        const newSubscription = {
          id: response.razorpay_payment_id,
          plan: plan.id as 'pro' | 'enterprise',
          status: 'active' as const,
          startDate: new Date().toISOString(),
          paymentId: response.razorpay_payment_id
        }
        
        setSubscription(newSubscription)
        alert('Payment successful! Your plan has been upgraded.')
        navigate('/dashboard')
      } else {
        alert('Payment verification failed. Please contact support.')
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      alert('Payment verification failed. Please contact support.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-10 blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </motion.button>
          
          {/* Demo buttons for testing */}
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSubscription({
                  id: 'demo-pro',
                  plan: 'pro',
                  status: 'active',
                  startDate: new Date().toISOString(),
                  paymentId: 'demo-payment-pro'
                })
              }}
              className="px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Demo Pro
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSubscription({
                  id: 'demo-enterprise',
                  plan: 'enterprise',
                  status: 'active',
                  startDate: new Date().toISOString(),
                  paymentId: 'demo-payment-enterprise'
                })
              }}
              className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              Demo Enterprise
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSubscription({} as any)}
              className="px-2 sm:px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-gray-500/25"
            >
              Reset
            </motion.button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Floating Icons */}
            <div className="relative mb-8">
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-4 left-1/4 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center opacity-20"
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <motion.div 
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -top-2 right-1/4 w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center opacity-20"
              >
                <Star className="h-5 w-5 text-white" />
              </motion.div>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight"
            >
              Choose Your
              <span className="block">Perfect Plan</span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-4"
            >
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Transform your workflow with AI-powered conversations that adapt to your needs
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>10,000+ Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </motion.div>
            
            {/* Current Plan Status */}
            {subscription?.status === 'active' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold shadow-lg"
              >
                <Crown className="h-5 w-5" />
                <span>Currently on {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan</span>
                {subscription.plan === 'pro' && (
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold"
                  >
                    • Upgrade Available
                  </motion.span>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const getCardStyles = () => {
              if (plan.id === 'free') {
                return 'bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300/80 dark:hover:border-gray-600/80'
              }
              if (plan.popular) {
                return 'bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200/60 dark:border-purple-500/60 shadow-2xl shadow-purple-500/10 dark:shadow-purple-500/20 transform scale-105 hover:scale-110'
              }
              return 'bg-white/70 dark:bg-gray-800/70 border-indigo-200/50 dark:border-indigo-700/50 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 hover:shadow-xl hover:shadow-indigo-500/10'
            }
            
            const getIconBg = () => {
              if (plan.id === 'free') return 'bg-gradient-to-r from-gray-400 to-gray-500'
              if (plan.id === 'pro') return 'bg-gradient-to-r from-purple-500 to-pink-500'
              return 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                className={`relative backdrop-blur-sm rounded-2xl border-2 transition-all duration-500 group overflow-hidden ${getCardStyles()}`}
              >
                {/* Gradient overlay for popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 rounded-2xl"></div>
                )}
                
                {/* Popular badge */}
                {plan.popular && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.3 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="h-3 w-3" />
                      </motion.div>
                      Most Popular
                    </div>
                  </motion.div>
                )}

                <div className="relative p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    {/* Icon */}
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.15 + 0.4, duration: 0.6, ease: "backOut" }}
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${getIconBg()} mb-6 shadow-lg`}
                    >
                      {plan.id === 'free' && <Zap className="h-8 w-8 text-white" />}
                      {plan.id === 'pro' && <Crown className="h-8 w-8 text-white" />}
                      {plan.id === 'enterprise' && <Star className="h-8 w-8 text-white" />}
                    </motion.div>
                    
                    <motion.h3 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 + 0.5 }}
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                    >
                      {plan.name}
                    </motion.h3>
                    
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.6 }}
                      className="text-gray-600 dark:text-gray-400 mb-6"
                    >
                      {plan.description}
                    </motion.p>

                    {/* Pricing */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.15 + 0.7 }}
                      className="flex items-center justify-center gap-2 mb-4"
                    >
                      {plan.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          ₹{plan.originalPrice}
                        </span>
                      )}
                      <span className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        ₹{plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-lg">
                        /{plan.period}
                      </span>
                    </motion.div>

                    {plan.originalPrice && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 + 0.8 }}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        <TrendingUp className="h-3 w-3" />
                        Save ₹{plan.originalPrice - plan.price}/month
                      </motion.div>
                    )}
                  </div>

                  {/* Features */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.9 }}
                    className="space-y-4 mb-8"
                  >
                    {plan.features.slice(0, 5).map((feature, featureIndex) => (
                      <motion.div 
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 + 1 + featureIndex * 0.1 }}
                        className="flex items-start gap-3 group-hover:scale-105 transition-transform duration-300"
                      >
                        <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-white font-bold" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                    {plan.features.length > 5 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.15 + 1.5 }}
                        className="text-center"
                      >
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                          +{plan.features.length - 5} more features
                        </span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 + 1.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePayment(plan)}
                    disabled={
                      loading === plan.id || 
                      (plan.id === 'free') ||
                      (subscription?.plan === plan.id && subscription?.status === 'active') ||
                      (subscription?.plan === 'enterprise' && plan.id === 'pro')
                    }
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl ${
                      subscription?.plan === plan.id && subscription?.status === 'active'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 cursor-not-allowed border-2 border-emerald-300/50 dark:border-emerald-500/50'
                        : subscription?.plan === 'enterprise' && plan.id === 'pro'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular || (subscription?.plan === 'pro' && plan.id === 'enterprise')
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-purple-500/25 hover:shadow-purple-500/40'
                        : plan.id === 'free'
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-white'
                    } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading === plan.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : subscription?.plan === plan.id && subscription?.status === 'active' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4" />
                        Current Plan
                      </div>
                    ) : subscription?.plan === 'enterprise' && plan.id === 'pro' ? (
                      'Downgrade'
                    ) : subscription?.plan === 'pro' && plan.id === 'enterprise' ? (
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Enterprise
                      </div>
                    ) : (
                      plan.buttonText
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Value Proposition Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 mb-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.0, duration: 0.6 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Bank-grade security with end-to-end encryption</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Latest AI technology for superior performance</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Round-the-clock assistance when you need it</p>
            </motion.div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need to know about our pricing plans</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.8 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Can I change my plan anytime?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and we'll prorate the cost accordingly.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.0 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Our Free plan gives you access to basic features forever. You can upgrade anytime to unlock more capabilities without any commitment.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.2 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  What about data security?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We use enterprise-grade security with end-to-end encryption, regular security audits, and comply with GDPR and SOC 2 standards.
                </p>
              </motion.div>
            </div>
            
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.9 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure Razorpay integration.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.1 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team for quick assistance with refunds.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.3 }}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Can I get a custom plan?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Absolutely! For enterprise customers, we offer custom plans tailored to your specific needs. Contact our sales team to discuss.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.4 }}
          className="mt-20 text-center bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-12 border border-purple-200/50 dark:border-purple-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust our AI platform for their business needs
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-700 hover:to-blue-700"
            >
              Start Free Trial
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300"
            >
              Contact Sales
            </motion.button>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PricingPage