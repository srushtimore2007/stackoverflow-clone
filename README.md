# Stack Overflow Clone - CodeQuest

A full-featured, modern Stack Overflow clone built with Next.js, Express.js, and MongoDB. This platform includes user authentication, subscription plans, multilingual support, and real-time translation capabilities.

## 🚀 Project Overview

CodeQuest is a comprehensive Q&A platform that replicates Stack Overflow's core functionality with enhanced features including:

- **Question & Answer System**: Post questions, provide answers, and vote on content
- **User Authentication**: Secure login/signup with OTP verification (SMS & Email)
- **Subscription Plans**: Tiered access with payment integration via Razorpay
- **Multilingual Support**: Dynamic translation in 6 languages
- **Real-time Features**: Live translation and language switching
- **Modern UI**: Responsive design with Tailwind CSS and shadcn/ui components

## ✨ Key Features

### Core Functionality
- 📝 **Ask Questions**: Rich text editor for posting questions with tags
- 💬 **Answer System**: Detailed answers with voting and reputation system
- 🔍 **Search & Filter**: Advanced search with category filtering
- 👤 **User Profiles**: Complete user management with activity tracking
- 📊 **Analytics**: Question views, answer counts, and user statistics

### Authentication & Security
- 🔐 **Secure Auth**: JWT-based authentication with bcrypt password hashing
- 📱 **SMS OTP**: Vonage integration for mobile verification
- 📧 **Email OTP**: SendGrid/Nodemailer for email verification
- 🕐 **Login History**: Track user login sessions with device detection
- 🛡️ **Security**: Rate limiting and input validation

### Subscription System
- 💳 **Razorpay Integration**: Secure payment processing
- 📦 **Tiered Plans**: Free, Bronze, Silver, and Gold plans
- ⏰ **Payment Window**: Restricted payment hours (10-11 AM IST)
- 🔄 **Plan Upgrades**: Seamless subscription management
- 📈 **Usage Tracking**: Question limits based on subscription tier

### Multilingual Support
- 🌍 **6 Languages**: English, Hindi, Spanish, Portuguese, Chinese, French
- 🔄 **Dynamic Translation**: Real-time content translation via LibreTranslate
- 🎯 **Language Verification**: OTP verification for language changes
- 📱 **RTL Support**: Right-to-left language compatibility
- 🎨 **Localized UI**: Translated interface elements

## 🛠️ Tech Stack

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Internationalization**: react-i18next + i18next
- **HTTP Client**: Axios

### Backend (Node.js)
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer with AWS S3 support
- **Translation**: LibreTranslate + Google Cloud Translation API

### Payment & Communication
- **Payment**: Razorpay (INR)
- **SMS**: Vonage/Nexmo
- **Email**: SendGrid/Nodemailer/Resend
- **Cloud**: AWS S3 for file storage

### Development Tools
- **Language**: TypeScript
- **Linting**: ESLint
- **Hot Reload**: Nodemon (backend), Next.js dev server (frontend)
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0 or higher (local or Atlas)
- **npm**: v8.0.0 or higher
- **Git**: For version control

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stackoverflow-clone
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Configure environment variables (see [Environment Variables](#environment-variables) section):

```bash
# Database
MONGODB_URL=mongodb://localhost:27017/stackoverflow-clone
PORT=5000

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d

# Translation
LIBRETRANSLATE_URL=http://localhost:5001
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# Payment
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# SMS (Vonage)
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
```

Start the backend server:

```bash
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

Navigate to the stack directory:

```bash
cd ../stack
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env.local
```

Configure frontend environment variables:

```bash
# Vonage/Nexmo SMS Configuration
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here
VONAGE_BRAND_NAME=CodeQuest

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_SERVICE=gmail

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# LibreTranslate API Configuration
NEXT_PUBLIC_LIBRETRANSLATE_URL=https://libretranslate.de/translate
NEXT_PUBLIC_ENABLE_DYNAMIC_TRANSLATION=true
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,es,hi,pt,zh,fr
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Database Setup

Ensure MongoDB is running locally or configure with MongoDB Atlas:

```bash
# For local MongoDB
mongod

# Or update the MONGODB_URL in .env to use Atlas
MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/stackoverflow-clone
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login with device detection
- `POST /send-email-otp` - Send email OTP
- `POST /verify-login-otp` - Verify login OTP
- `POST /forgot-password` - Password reset
- `GET /current-user` - Get current user profile
- `GET /friends` - Get user friends list

### Questions (`/api/questions`)
- `GET /` - Get all questions
- `POST /` - Create new question
- `GET /:id` - Get question by ID
- `PUT /:id` - Update question
- `DELETE /:id` - Delete question

### Answers (`/api/answer`)
- `GET /question/:questionId` - Get answers for question
- `POST /` - Create new answer
- `PUT /:id` - Update answer
- `DELETE /:id` - Delete answer

### Subscriptions (`/api/subscription`)
- `GET /status` - Get subscription status
- `POST /create-order` - Create Razorpay order
- `POST /verify-payment` - Verify payment
- `POST /mock-activate` - Mock subscription activation
- `POST /immediate-upgrade` - Immediate plan upgrade

### Translation (`/api/translate`)
- `POST /` - Translate text using LibreTranslate
- `GET /languages` - Get supported languages

### OTP (`/api/otp`)
- `POST /send` - Send OTP (SMS/Email)
- `POST /verify` - Verify OTP
- `POST /send-language-otp` - Send language change OTP

### Language (`/api/language`)
- `POST /change` - Change user language
- `POST /verify-otp` - Verify language change OTP

### Points (`/api/points`)
- `GET /user/:userId` - Get user points
- `POST /award` - Award points to user

### Login History (`/api/login-history`)
- `GET /user/:userId` - Get user login history
- `POST /` - Record login attempt

## 💳 Subscription Plans

### Free Plan (₹0/month)
- **Questions**: 1 per day
- **Features**: Basic support, community access
- **Duration**: 30 days

### Bronze Plan (₹100/month)
- **Questions**: 5 per day
- **Features**: Priority support, profile customization
- **Duration**: 30 days

### Silver Plan (₹300/month)
- **Questions**: 10 per day
- **Features**: Advanced analytics, premium themes
- **Duration**: 30 days

### Gold Plan (₹1000/month)
- **Questions**: Unlimited
- **Features**: All features, API access, dedicated support
- **Duration**: 30 days

### Payment Window
- **Time**: 10:00 AM - 11:00 AM IST
- **Timezone**: Asia/Kolkata
- **Restriction**: Payments only allowed during this window

## 🌍 Multilingual Support

### Supported Languages
1. **English** (en) - Default language
2. **Hindi** (hi) - हिन्दी
3. **Spanish** (es) - Español
4. **Portuguese** (pt) - Português
5. **Chinese** (zh) - 中文
6. **French** (fr) - Français

### Translation Features
- **Dynamic Translation**: Real-time content translation
- **Language Verification**: OTP verification for language changes
- **Fallback Support**: Graceful handling of translation failures
- **Caching**: Translation caching for performance
- **UI Localization**: Complete interface translation

### Translation Services
- **Primary**: LibreTranslate (self-hosted or public instance)
- **Fallback**: Google Cloud Translation API
- **Configuration**: Configurable via environment variables

## 📁 Project Structure

```
stackoverflow-clone/
├── server/                          # Backend application
│   ├── api/                         # API route handlers
│   │   ├── auth/                    # Authentication endpoints
│   │   └── otp/                     # OTP endpoints
│   ├── config/                      # Configuration files
│   │   ├── multer.js               # File upload config
│   │   └── plans.js                # Subscription plans
│   ├── controller/                  # Business logic controllers
│   ├── lib/                         # Utility libraries
│   │   ├── db/                     # Database utilities
│   │   ├── email/                  # Email services
│   │   └── otp/                    # OTP services
│   ├── middleware/                  # Express middleware
│   ├── models/                      # Mongoose models
│   ├── routes/                      # API routes
│   ├── uploads/                     # File upload directory
│   ├── .env.example                # Environment variables template
│   ├── index.js                    # Server entry point
│   └── package.json                # Backend dependencies
│
├── stack/                           # Frontend application
│   ├── public/                      # Static assets
│   │   └── locales/                # Translation files
│   │       ├── en.json             # English translations
│   │       ├── hi.json             # Hindi translations
│   │       ├── es.json             # Spanish translations
│   │       ├── pt.json             # Portuguese translations
│   │       ├── zh.json             # Chinese translations
│   │       └── fr.json             # French translations
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── verification/       # OTP verification components
│   │   │   ├── AskQuestion.tsx     # Question form
│   │   │   ├── LanguageSwitcher.tsx # Language switcher
│   │   │   ├── Navbar.tsx          # Navigation bar
│   │   │   ├── RazorpayPayment.tsx # Payment component
│   │   │   ├── Sidebar.tsx         # Sidebar navigation
│   │   │   └── SubscriptionPlans.tsx # Subscription plans
│   │   ├── contexts/               # React contexts
│   │   │   ├── TranslationContext.tsx # Translation context
│   │   │   └── language-context.tsx  # Language context
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── axiosinstance.ts    # HTTP client
│   │   │   └── AuthContext.tsx     # Authentication context
│   │   ├── pages/                  # Next.js pages
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── ask/                # Question pages
│   │   │   ├── feed/               # Main feed
│   │   │   ├── subscription/       # Subscription pages
│   │   │   └── users/              # User pages
│   │   └── layout/                 # Layout components
│   ├── .env.example               # Frontend environment template
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   └── package.json               # Frontend dependencies
│
├── .gitignore                      # Git ignore file
├── README.md                       # This file
└── Various documentation files     # Implementation guides
```

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
MONGODB_URL=mongodb://localhost:27017/stackoverflow-clone
PORT=5000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d

# Translation
LIBRETRANSLATE_URL=http://localhost:5001
LIBRETRANSLATE_API_KEY=
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# SMS (Vonage)
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here
VONAGE_FROM_NUMBER=StackOverflow

# Email Services
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
SENDGRID_API_KEY=your-sendgrid-api-key
RESEND_API_KEY=your-resend-api-key

# Payment (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# AWS (File Upload)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Development
NODE_ENV=development
```

### Frontend (.env.local)
```bash
# Vonage SMS
VONAGE_API_KEY=your-vonage-api-key-here
VONAGE_API_SECRET=your-vonage-api-secret-here
VONAGE_BRAND_NAME=CodeQuest

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_SERVICE=gmail

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Translation
NEXT_PUBLIC_LIBRETRANSLATE_URL=https://libretranslate.de/translate
NEXT_PUBLIC_ENABLE_DYNAMIC_TRANSLATION=true
NEXT_PUBLIC_SHOW_TRANSLATION_INDICATORS=false
NEXT_PUBLIC_TRANSLATION_TIMEOUT=10000
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,es,hi,pt,zh,fr
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running locally or update MONGODB_URL to use MongoDB Atlas.

#### 2. Port Already in Use
```bash
Error: listen EADDRINUSE :::5000
```
**Solution**: Kill the process using the port or change the PORT in .env file.

#### 3. Translation Service Not Working
```bash
Error: LibreTranslate connection failed
```
**Solution**: 
- Check LibreTranslate URL configuration
- Ensure LibreTranslate service is running
- Verify API key if required

#### 4. OTP Not Sending
```bash
Error: Vonage API failed
```
**Solution**:
- Verify Vonage API credentials
- Check account balance
- Ensure phone number format is correct

#### 5. Payment Verification Failed
```bash
Error: Razorpay signature verification failed
```
**Solution**:
- Check Razorpay key ID and secret
- Verify webhook configuration
- Ensure payment is completed before verification

#### 6. Frontend Build Errors
```bash
Error: Module not found
```
**Solution**:
- Run `npm install` in stack directory
- Check for missing dependencies in package.json
- Clear Next.js cache: `rm -rf .next`

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=*
```

### Health Checks

Check backend health:
```bash
curl http://localhost:5000
```

Check frontend health:
```bash
curl http://localhost:3000
```

## 🚀 Deployment

### Backend Deployment (Production)

1. **Environment Setup**:
   ```bash
   export NODE_ENV=production
   export MONGODB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/stackoverflow-clone
   export JWT_SECRET=your-production-jwt-secret
   ```

2. **Install Production Dependencies**:
   ```bash
   npm ci --only=production
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Environment Variables**:
   Configure all required environment variables in your hosting platform.

3. **Deploy**:
   - **Vercel**: Connect repository and deploy automatically
   - **Netlify**: Build and deploy static files

### Database Deployment

**MongoDB Atlas Setup**:
1. Create cluster on MongoDB Atlas
2. Configure network access (IP whitelist)
3. Create database user
4. Update connection string in environment variables

## 🧪 Testing

### Backend Testing
```bash
# Run available tests
npm test

# Test API endpoints manually
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Frontend Testing
```bash
# Run linting
npm run lint

# Build check
npm run build
```

## 📈 Performance Optimization

### Backend
- **Database Indexing**: Add indexes to frequently queried fields
- **Caching**: Implement Redis for session and data caching
- **Compression**: Enable gzip compression for API responses
- **Rate Limiting**: Implement API rate limiting

### Frontend
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Use webpack-bundle-analyzer
- **CDN**: Deploy static assets to CDN

## 🔒 Security Considerations

### Implemented Security Measures
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Request body validation and sanitization
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent brute force attacks
- **Environment Variables**: Secure configuration management

### Additional Security Recommendations
- **HTTPS**: Enable SSL/TLS in production
- **Helmet.js**: Security headers middleware
- **SQL Injection**: Use parameterized queries (if using SQL)
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Implement CSRF tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

## 🎯 Future Enhancements

### Planned Features
- **Real-time Notifications**: WebSocket-based notifications
- **Advanced Search**: Elasticsearch integration
- **Mobile App**: React Native application
- **API Documentation**: Swagger/OpenAPI documentation
- **Analytics Dashboard**: User behavior analytics
- **Content Moderation**: Automated content moderation
- **Achievement System**: Gamification features
- **Dark Mode**: Theme switching capability

### Technical Improvements
- **Microservices**: Split into microservices architecture
- **GraphQL**: API implementation with GraphQL
- **Docker**: Containerization for easy deployment
- **CI/CD**: Automated testing and deployment pipeline
- **Monitoring**: Application performance monitoring
- **Load Balancing**: Horizontal scaling capabilities

---

**Built with ❤️ using modern web technologies**
