# Multi LLM Routing Orchestrator

A sophisticated AI-powered chat application with intelligent LLM routing, subscription management, and modern UI/UX built with React, Node.js, and deployed on Vercel.

## 🚀 Features

### Core Functionality
- **Multi-LLM Routing**: Intelligent routing between different AI models
- **Real-time Chat**: Responsive chat interface with typing indicators
- **User Authentication**: Secure JWT-based authentication system
- **Subscription Management**: Tiered pricing with Razorpay integration
- **Modern UI/UX**: Glass morphism design with smooth animations

### Technical Features
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Serverless functions on Vercel
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth transitions
- **State Management**: Zustand for lightweight state management
- **Payment Processing**: Razorpay integration for Indian market
- **Responsive Design**: Mobile-first approach

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - State management
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Backend
- **Vercel Serverless Functions** - Scalable backend
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Razorpay** - Payment processing

## 📦 Project Structure

```
Multi-LLM-Routing-Orchestrator/
├── api/                          # Vercel serverless functions
│   ├── auth/
│   │   ├── login.js             # User login endpoint
│   │   └── register.js          # User registration endpoint
│   ├── payment/
│   │   ├── create-order.js      # Create Razorpay order
│   │   └── verify-payment.js    # Verify payment signature
│   └── chat/
│       └── send.js              # Chat message processing
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── stores/              # Zustand state stores
│   │   └── services/            # API service functions
│   ├── public/                  # Static assets
│   └── dist/                    # Build output
├── vercel.json                  # Vercel deployment configuration
├── package.json                 # Root dependencies
└── README.md                    # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- Razorpay account (for payments)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vraj1033/Multi-LLM-Routing-Orchestrator.git
   cd Multi-LLM-Routing-Orchestrator
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

### Environment Variables

Create a `.env` file in the root directory:

```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## 🌐 Deployment

This project is configured for easy deployment on Vercel:

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   Add your environment variables in the Vercel dashboard under Settings → Environment Variables.

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy using the deploy script
chmod +x deploy.sh
./deploy.sh
```

## 💳 Pricing Plans

### Starter (Free)
- 100 AI requests per month
- Basic chat functionality
- Community support
- Mobile app access

### Professional (₹999/month)
- 10,000 AI requests per month
- Priority response time
- Advanced chat features
- Priority email support
- Advanced analytics
- API access

### Enterprise (₹4,999/month)
- Unlimited AI requests
- Fastest response time
- Dedicated account manager
- Custom deployment options
- Enterprise-grade security
- 99.9% SLA guarantee

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Chat
- `POST /api/chat/send` - Send chat message

### Payments
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment

## 🎨 UI Components

### Pages
- **Landing Page** - Hero section with features
- **Pricing Page** - Interactive pricing cards with billing toggle
- **Dashboard** - Main chat interface
- **Login/Register** - Authentication forms
- **Settings** - User preferences

### Components
- **Pricing Cards** - Animated pricing tiers
- **Chat Interface** - Real-time messaging
- **Navigation** - Responsive header and sidebar
- **Forms** - Styled input components

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Secure payment processing
- Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Adaptive layouts
- Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Vraj Patel**
- GitHub: [@vraj1033](https://github.com/vraj1033)
- LinkedIn: [Your LinkedIn Profile]

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for seamless deployment
- Tailwind CSS for utility-first styling
- Framer Motion for smooth animations
- Razorpay for payment processing

## 📞 Support

If you have any questions or need help with setup, please open an issue or contact me directly.

---

⭐ **Star this repository if you found it helpful!**