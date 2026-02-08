# TCM Clinic Management System
> Web 管理系統技術文檔

> 📌 **返回專案首頁：** [README.md](../README.md)  
> 📌 **其他文檔：** [作品集展示](./PORTFOLIO.md) | [LINE BOT](./LINEBOT.md) | [API 參考](./API.md) | [部署指南](./DEPLOYMENT.md)

A modern Traditional Chinese Medicine clinic patient management system with LINE messaging integration, built with Next.js 14, TypeScript, and MongoDB.

## 🏥 Features

### Authentication & Security
- **Google OAuth Integration**: Secure login with NextAuth.js and Google OAuth
- **Session Management**: Persistent user sessions with automatic token refresh
- **Role-based Access**: Secure access control for clinic staff
- **Protected Routes**: Authenticated access to patient data and medical records

### Patient Management
- **Simplified Patient Profiles**: Name and broadcast account management
- **Medical Record Tracking**: Symptoms and TCM syndrome records
- **Smart Search**: Flexible search for names, symptoms, and syndromes
- **Batch Operations**: Select multiple patients for messaging

### TCM Professional Features
- **Symptom Tracking**: Traditional Chinese Medicine symptom records
- **Syndrome Records**: TCM pattern identification and treatment
- **Visit History**: Time-series medical record tracking
- **Clinical Notes**: Physician observations and diagnoses

### Messaging & Communication
- **LINE Integration**: Broadcast health education videos to patients
- **Account Sync**: Automatic synchronization of LINE users with patient data
- **Batch Messaging**: Send content to multiple patients at once
- **Link Preview**: Automatic thumbnail and summary display for video content

### Search System
- **Name Search**: Multi-keyword OR logic search ("Wang Ming" finds patients containing either keyword)
- **Symptom Search**: Find patients with specific symptoms
- **Combined Search**: Cross-field AND logic (name + symptoms + syndromes)
- **Search Help**: Built-in interactive search guidance

### User Interface
- **Responsive Design**: Support for desktop, tablet, and mobile
- **Chinese Support**: Full Unicode Chinese character support
- **Intuitive Navigation**: Clean professional interface design
- **Real-time Feedback**: Instant operation status and result display

## 🚀 Quick Start

### System Requirements
- Node.js 18+
- MongoDB Atlas account (free tier available)
- Git version control

### Local Development
```bash
# Clone the repository
git clone <your-repository-url>
cd health-ed-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local to add your MongoDB connection string and LINE API Token

# Initialize database
npm run setup-db

# Start development server
npm run dev
```

Visit http://localhost:3000 to view the application.

### Cloud Deployment (Render.com)
For detailed deployment instructions, see [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md).

## 🔧 System Configuration

### Environment Variables
```bash
# Required settings
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tcm-clinic
MONGODB_DB=tcm-clinic

# LINE Bot database (optional, can be omitted if same as main database)
LINEBOT_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linebot
LINEBOT_MONGODB_DB=linebot

# LINE Message API (required for messaging features)
LINE_CHANNEL_ACCESS_TOKEN=your_line_token

# NextAuth Google OAuth (required for authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Database Configuration
The system automatically creates optimized indexes:
- Patient name search index
- Medical record query index
- Symptom and syndrome filtering index
- Date sorting index

## 📱 User Guide

### Authentication
- **Google Login**: Click "Sign in with Google" to authenticate
- **Session Management**: Stay logged in across browser sessions
- **Secure Logout**: Use the logout button to end your session safely
- **Access Control**: Only authenticated users can access patient data

### Patient Search
- **Single keyword**: "Wang" - Find all patients with names containing "Wang"
- **Multiple keywords**: "Wang Ming" - Find patients containing either "Wang" or "Ming"
- **Symptom search**: "headache fatigue" - Find patients with either symptom
- **Combined search**: Name + symptoms + syndromes, all conditions must match

### Medical Record Management
- **View patient records**: Click "View Medical Records" on patient cards
- **Edit latest record**: Use the "Edit Latest Record" button
- **Weekly overview**: "Weekly Records" in the navigation bar

### LINE Messaging Features
1. **Sync broadcast accounts**: Click "Sync Broadcast Accounts" button
2. **Select patients**: Use checkboxes to select patients
3. **Send content**: Click "Send Health Education Videos" button
4. **Enter URL**: Paste video URL (automatic preview)
5. **Messaging complete**: System displays sending result statistics

## 🏗️ System Architecture

### Frontend Technologies
- **Next.js 14**: React framework with App Router
- **NextAuth.js**: Authentication library with Google OAuth integration
- **TypeScript**: Type-safe development environment
- **CSS Modules**: Modular style management
- **Responsive Design**: Mobile-first design approach

### Backend Technologies
- **Next.js API Routes**: Serverless functions with authentication middleware
- **NextAuth.js**: Secure session management and OAuth integration
- **MongoDB**: Document database for patient records
- **LINE Message API**: Messaging communication integration
- **Multi-database Support**: TCM clinic + LINE Bot databases

### Database Structure
```typescript
interface Patient {
  _id?: string;
  name: string;
  lineUserId?: string;  // LINE broadcast account
  historyRecords: TCMHistoryRecord[];
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;  // Broadcast account sync time
}

interface TCMHistoryRecord {
  visitDate: Date;
  symptoms: string[];
  syndromes: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔍 API Endpoints

### Authentication
- `GET /api/auth/signin` - Google OAuth login page
- `POST /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/session` - Current user session
- `POST /api/auth/signout` - User logout

### Patient Management
- `GET /api/users` - Search patients
- `GET /api/users/[id]` - Get patient details
- `POST /api/users` - Create new patient
- `PUT /api/users/[id]/record` - Update latest record

### Records & Reports
- `GET /api/records/weekly` - Get weekly records
- `GET /api/health` - System health check

### Messaging Features
- `POST /api/sync/line-users` - Sync LINE broadcast accounts
- `POST /api/notifications/send` - Send broadcast notifications
- `POST /api/link-preview` - Get link preview data

## 🧪 Development Guide

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
npm run setup-db     # Initialize database indexes
```

### Code Structure
```
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── auth/       # NextAuth authentication routes
│   │   ├── sync/       # Broadcast account sync
│   │   ├── notifications/ # Broadcast notifications
│   │   └── users/      # Patient management
│   ├── edit/           # Edit record pages
│   ├── patient/        # Patient detail pages
│   ├── records/        # Weekly records page
│   └── globals.css     # Global styles
├── components/         # React components
├── lib/               # Utility functions
│   ├── mongodb.ts     # Database connection
│   ├── line-api.ts    # LINE API client
│   └── auth.ts        # NextAuth configuration
├── types/             # TypeScript type definitions
└── scripts/           # Database setup scripts
```

## 🔐 Security

### Data Protection
- Environment variable encryption
- SSL/TLS connection encryption
- Input validation and filtering
- Secure MongoDB connections
- NextAuth.js secure session management
- Google OAuth 2.0 authentication

### Access Control
- Google OAuth authentication required for all users
- Secure session-based access control
- Protected API routes with authentication middleware
- Automatic session refresh and token management
- Database connection restrictions
- Secure environment variable handling

## 📊 Performance Optimization

### Optimization Measures
- Database indexes for fast queries
- Next.js automatic code splitting
- Image optimization and compression
- CDN static resource delivery

### Monitoring Features
- Health check endpoints
- Error tracking and logging
- Performance metrics monitoring
- Database connection monitoring

## 🆘 Troubleshooting

### Common Issues
- **Database connection problems**: Check MONGODB_URI format
- **Build failures**: Ensure Node.js version (18+)
- **Search functionality issues**: Ensure database indexes are created
- **Messaging features not working**: Verify LINE API credentials setup
- **Authentication issues**: Verify Google OAuth credentials and NextAuth configuration
- **Session problems**: Check NEXTAUTH_SECRET and NEXTAUTH_URL settings

### Getting Help
- Review [Deployment Guide](./DEPLOYMENT.md)
- Check application logs
- Test database connections
- Verify environment variable configuration
- Refer to [LINE BOT Documentation](./LINEBOT.md)

## 🎯 Development Roadmap

### Planned Features
- [ ] Advanced reporting and analytics
- [ ] Appointment scheduling system
- [ ] Prescription management features
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Role-based permissions (admin/staff/viewer)

### Recent Updates
- ✅ Google OAuth authentication with NextAuth.js
- ✅ Protected routes and session management
- ✅ LINE broadcast account sync functionality
- ✅ Multi-keyword OR logic search
- ✅ LINE broadcast notification system with preview
- ✅ Multi-database support architecture
- ✅ Responsive design improvements
- ✅ Cloud deployment configuration

## 🔗 相關文檔

- [專案總覽](../README.md)
- [作品集展示](./PORTFOLIO.md)
- [LINE BOT 技術文檔](./LINEBOT.md)
- [API 參考文檔](./API.md)
- [部署指南](./DEPLOYMENT.md)

---

**Built with ❤️ for Traditional Chinese Medicine practitioners**