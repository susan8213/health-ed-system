# TCM Clinic Management System

A modern Traditional Chinese Medicine clinic patient management system built with Next.js 14, TypeScript, and MongoDB.

## 🏥 Features

### Patient Management
- **Simplified Patient Profiles**: Name and LINE ID only
- **Medical History Tracking**: Symptoms and TCM syndromes
- **Multi-keyword Search**: Space-separated search terms
- **Patient Selection**: Bulk operations with checkboxes

### TCM-Specific Features
- **Symptom Tracking**: Traditional Chinese Medicine symptoms
- **Syndrome Records**: TCM pattern differentiation (辨證)
- **Visit History**: Chronological medical records
- **Clinical Notes**: Practitioner observations

### Communication & Notifications
- **LINE Integration**: Send podcast notifications to patients
- **Link Previews**: Automatic thumbnail and metadata display
- **Bulk Messaging**: Select multiple patients for notifications
- **Rich Content**: Share podcasts with visual previews

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Traditional Chinese Support**: Full Unicode support
- **Intuitive Navigation**: Clean, professional interface
- **Search Help**: Interactive search tips and examples

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Git for version control

### Local Development
```bash
# Clone the repository
git clone <your-repository-url>
cd tcm-clinic

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string

# Initialize database
npm run setup-db

# Start development server
npm run dev
```

Visit http://localhost:3000 to see the application.

### Cloud Deployment (Render.com)
See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed deployment instructions.

## 🔧 Configuration

### Environment Variables
```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tcm-clinic
MONGODB_DB=tcm-clinic

# Optional
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
```

### Database Setup
The application automatically creates optimized indexes for:
- Patient name and LINE ID search
- Medical history queries
- Symptom and syndrome filtering
- Date-based sorting

## 📱 Usage Guide

### Patient Search
- **Single keyword**: "Chen" - finds all patients with "Chen"
- **Multiple keywords**: "Chen Wei" - finds patients with BOTH terms
- **Symptoms**: "Headache Fatigue" - finds either symptom
- **Syndromes**: "Liver Fire" - finds matching TCM patterns

### Medical Records
- **View Patient History**: Click "View Patient Records" on any patient card
- **Edit Latest Record**: Use "Edit Latest Record" button
- **Weekly Overview**: Use navbar "This Week's Records"

### LINE Notifications
1. Select patients using checkboxes
2. Click "Send Podcast" button
3. Enter podcast URL (automatic preview)
4. Send to selected patients

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling
- **Responsive Design**: Mobile-first approach

### Backend
- **Next.js API Routes**: Serverless functions
- **MongoDB**: Document database for patient records
- **Link Preview API**: Automatic metadata extraction
- **Health Monitoring**: Built-in health checks

### Database Schema
```typescript
interface Patient {
  _id?: string;
  name: string;
  lineId?: string;
  historyRecords: TCMHistoryRecord[];
  createdAt: Date;
  updatedAt: Date;
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

### Patient Management
- `GET /api/users` - Search patients
- `GET /api/users/[id]` - Get patient details
- `POST /api/users` - Create patient
- `PUT /api/users/[id]/record` - Update latest record

### Records & Reports
- `GET /api/records/weekly` - Get this week's records
- `GET /api/health` - Application health check

### Notifications
- `POST /api/notifications/send` - Send LINE notifications
- `POST /api/link-preview` - Get link metadata

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run setup-db     # Initialize database indexes
```

### Code Structure
```
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── edit/           # Edit record pages
│   ├── patient/        # Patient detail pages
│   ├── records/        # Weekly records page
│   └── globals.css     # Global styles
├── components/         # React components
├── lib/               # Utility functions
├── types/             # TypeScript definitions
└── scripts/           # Database setup scripts
```

## 🔐 Security

### Data Protection
- Environment variable encryption
- SSL/TLS for all connections
- Input validation and sanitization
- MongoDB connection security

### Access Control
- No user authentication (clinic internal use)
- IP-based access control (deployment level)
- Database connection restrictions
- Secure environment variable handling

## 📊 Performance

### Optimizations
- Database indexing for fast queries
- Next.js automatic code splitting
- Image optimization and compression
- CDN delivery for static assets

### Monitoring
- Health check endpoint
- Error tracking and logging
- Performance metrics
- Database connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Check MONGODB_URI format
- **Build Failures**: Verify Node.js version (18+)
- **Search Not Working**: Ensure database indexes are created
- **LINE Notifications**: Verify LINE API credentials

### Getting Help
- Check the [deployment guide](./RENDER_DEPLOYMENT.md)
- Review application logs
- Test database connection
- Verify environment variables

## 🎯 Roadmap

### Planned Features
- [ ] User authentication and roles
- [ ] Advanced reporting and analytics
- [ ] Appointment scheduling
- [ ] Prescription management
- [ ] Multi-language support
- [ ] Mobile app development

### Recent Updates
- ✅ Multi-keyword search functionality
- ✅ LINE notification system with previews
- ✅ Render.com deployment configuration
- ✅ Cloud MongoDB integration
- ✅ Responsive design improvements

---

**Built with ❤️ for Traditional Chinese Medicine practitioners**