# 🚀 SILA - AI-Driven Moroccan Delivery Management System

## 📋 Project Overview

SILA is a comprehensive delivery management system that leverages AI and WhatsApp integration to streamline package delivery in Morocco. The system connects customers, drivers, and administrators through an intelligent chatbot interface and mobile applications.

## 🏗️ System Architecture

### 🎯 Core Components

1. **🤖 AI-Powered WhatsApp Bot** - Natural language processing for delivery requests
2. **📱 Mobile Driver App** - React Native application for delivery drivers
3. **🖥️ Admin Dashboard** - Web-based management interface
4. **⚡ FastAPI Backend** - RESTful API with real-time capabilities
5. **💾 SQLite Database** - Persistent data storage with async operations

### 🔄 Integration Flow

```
Customer (WhatsApp) → AI Chatbot → Backend System → Driver Assignment → Mobile App → Delivery Completion
```

## 📁 Project Structure

```
project V0/
├── backend-python/          # FastAPI backend server
│   ├── main.py             # Main application entry point
│   ├── models.py           # Database models (SQLAlchemy)
│   ├── webhooks/           # WhatsApp webhook handlers
│   ├── services/           # Business logic services
│   ├── routers/            # API route handlers
│   └── database.py         # Database configuration
├── mobile/                 # React Native driver app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── store/          # State management (Zustand)
│   │   └── config/         # API configuration
├── admin/                  # React admin dashboard
│   ├── src/
│   │   ├── pages/          # Dashboard pages
│   │   └── components/     # Reusable components
└── README.md               # This file
```

## 🚀 Features

### 🤖 WhatsApp Chatbot Features
- **Natural Language Processing**: Understands Moroccan Darija and French
- **Voice Message Support**: Transcribes audio notes using AI
- **Smart Booking Extraction**: Automatically extracts delivery details
- **Deadline Management**: Handles delivery time preferences
- **Status Updates**: Real-time delivery status notifications

### 📱 Mobile Driver App Features
- **Task Management**: View, accept, and complete delivery tasks
- **Real-time Updates**: Live task status synchronization
- **Earnings Tracking**: Automatic calculation of delivery earnings
- **GPS Integration**: Location-based delivery navigation
- **Performance Metrics**: Rating and completion statistics

### 🖥️ Admin Dashboard Features
- **Real-time Analytics**: Live delivery statistics and trends
- **Driver Management**: Monitor and manage driver performance
- **Package Tracking**: View all packages and their status
- **Revenue Analytics**: Financial insights and reporting
- **User Management**: KYC verification and user administration

## 🛠️ Technology Stack

### Backend Technologies
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: Python SQL toolkit and ORM
- **SQLite**: Lightweight database solution
- **Pydantic**: Data validation using Python type annotations
- **Groq AI**: Advanced AI model integration
- **OpenRouter**: AI model gateway for diverse AI services

### Frontend Technologies
- **React Native**: Cross-platform mobile development
- **React**: Modern web UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server

### AI & ML Services
- **Hugging Face**: Advanced NLP models
- **OpenRouter**: Multi-model AI gateway
- **Groq**: High-performance AI inference
- **Faster Whisper**: Audio transcription services

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- npm or yarn
- React Native development environment
- ngrok (for local development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend-python
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Run database migrations**
   ```bash
   python migrate_deadline_columns.py
   ```

5. **Start the backend server**
   ```bash
   python main.py
   ```

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API endpoint**
   ```bash
   # Edit src/config/api.ts
   export const API_BASE_URL = 'your-backend-url';
   ```

4. **Run the app**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

### Admin Dashboard Setup

1. **Navigate to admin directory**
   ```bash
   cd admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3002
DATABASE_URL="sqlite+aiosqlite:///./dev.db"
OPENROUTER_API_KEY="your-openrouter-key"
WHATSAPP_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_ID="your-whatsapp-phone-id"
WHATSAPP_VERIFY_TOKEN="your-verify-token"
WHATSAPP_APP_SECRET="your-app-secret"
HUGGINGFACE_TOKEN="your-huggingface-token"
GROQ_API_KEY="your-groq-api-key"
```

#### Mobile App (src/config/api.ts)
```typescript
export const API_BASE_URL = 'https://your-backend-url.com';
```

#### Admin Dashboard (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://your-backend-url.com',
        changeOrigin: true,
      }
    }
  }
});
```

## 🤖 AI Integration

### Supported AI Models
- **Groq**: Fast inference for chatbot responses
- **Hugging Face**: Advanced NLP for Moroccan dialects
- **OpenRouter**: Multi-model routing for optimal performance

### Chatbot Flow
1. **Message Reception**: WhatsApp webhook receives customer message
2. **Language Detection**: Identifies language (Darija/French/English)
3. **Intent Recognition**: Extracts delivery requirements
4. **Data Validation**: Confirms pickup/delivery locations and details
5. **Booking Creation**: Generates delivery booking in database
6. **Driver Assignment**: Notifies available drivers
7. **Status Updates**: Provides real-time tracking information

## 📱 User Guides

### For Customers
1. **Send WhatsApp Message**: Contact the SILA WhatsApp number
2. **Describe Delivery**: Provide pickup location, destination, and package details
3. **Confirm Details**: Verify extracted information with the AI assistant
4. **Track Delivery**: Receive real-time updates on delivery progress

### For Drivers
1. **Login to Mobile App**: Use phone number and password
2. **View Available Tasks**: See pending delivery requests
3. **Accept Tasks**: Choose deliveries to complete
4. **Navigate to Pickup**: Use integrated GPS for directions
5. **Complete Delivery**: Mark packages as delivered
6. **Track Earnings**: Monitor daily and total earnings

### For Administrators
1. **Access Dashboard**: Login to admin web interface
2. **Monitor Operations**: View real-time delivery statistics
3. **Manage Drivers**: Oversee driver performance and availability
4. **Handle Issues**: Resolve customer complaints and system issues
5. **Generate Reports**: Export financial and operational reports

## 🔒 Security Features

- **API Authentication**: Secure token-based authentication
- **Data Encryption**: Encrypted data storage and transmission
- **WhatsApp Verification**: Verified WhatsApp Business API integration
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against API abuse

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active deliveries count
- Driver availability status
- Customer satisfaction ratings
- Revenue tracking and trends
- System performance indicators

### Historical Data
- Delivery completion rates
- Driver performance analytics
- Customer behavior patterns
- Financial reporting
- Operational efficiency metrics

## 🚀 Deployment

### Production Deployment
1. **Backend**: Deploy to cloud server (AWS, Azure, etc.)
2. **Database**: Set up production database
3. **WhatsApp**: Configure production WhatsApp Business API
4. **Mobile Apps**: Publish to App Store and Google Play
5. **Admin Dashboard**: Deploy to web hosting service

### Development Setup
1. **Local Backend**: Use ngrok for WhatsApp webhook testing
2. **Mobile Development**: Use React Native CLI or Expo
3. **Admin Development**: Local development with hot reload

## 🐛 Troubleshooting

### Common Issues
- **WhatsApp Webhook Not Working**: Check ngrok tunnel and webhook URL
- **Mobile App Connection Issues**: Verify API_BASE_URL configuration
- **Database Errors**: Run migration scripts and check database permissions
- **AI Model Errors**: Verify API keys and model availability

### Debug Mode
Enable debug logging by setting environment variables:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential to SILA Delivery Systems.

## 📞 Support

For technical support and questions:
- **Email**: support@sila-delivery.com
- **WhatsApp**: +212-XXX-XXXXXXX
- **Documentation**: Available in project wiki

---

## 🎯 Key Performance Indicators

- **Delivery Success Rate**: Target >95%
- **Average Delivery Time**: Target <2 hours
- **Customer Satisfaction**: Target >4.5/5
- **Driver Utilization**: Target >80%
- **System Uptime**: Target >99.5%

---

*Built with ❤️ for Moroccan delivery excellence*
