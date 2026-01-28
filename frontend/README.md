CodeTime Capsule
A modern, feature-rich social time capsule application for developers. Write code, predictions, or messages that get "locked" until a future date. When the date arrives, your capsule automatically unlocks and becomes visible to the community!
Perfect for:

💡 Documenting tech predictions
🚀 Recording career milestones
📝 Sharing code snippets from past versions
🎯 Goal tracking and personal growth
🌐 Community exploration and discussions

🌟 Features
Core Features

✨ Create and manage time capsules
🔐 Auto-unlock based on custom unlock dates
📁 Organize with custom categories
🏷️ Tag system for better organization
⭐ Favorite your important capsules
📊 Detailed statistics and analytics
📈 Visual charts and graphs
🎨 Custom colors for capsules
💾 Export data (JSON backup)
♿ Accessibility features

Social Features

👥 Explore public capsules from community
💬 Comment on capsules
👍 Like capsules
🏆 Leaderboard system
🔥 Trending technologies
📊 Community statistics
🎉 Achievements system

Advanced Features

🔍 Advanced search and filtering
🖼️ Multiple view modes (Grid/List)
📑 Multiple sorting options
⏰ Reminder system for unlocks
👁️ View counter (1 unique view per user)
🔐 Privacy controls (public/private accounts)
🔔 Pending follow requests for private accounts
✨ Real-time countdown timer for sealed capsules
📚 Templates library
📝 Audit logging
⚡ Performance optimizations
🌗 Dark/Light mode
💾 Remember me functionality on login
✅ Terms agreement on registration

🛠️ Tech Stack
Backend

Runtime: Node.js 18+
Framework: Express.js 5.x
Database: SQLite with Sequelize ORM
Authentication: JWT (JSON Web Tokens)
OAuth: Passport.js (GitHub & Google)
Security: Helmet, CORS, Rate Limiting
Performance: Compression middleware
Additional: Nodemailer for notifications

Frontend

Framework: React 19
Build Tool: Vite 6.x
Routing: React Router v7
Charts: Recharts 3.x
Icons: React Icons 5.x
Animations: Framer Motion 12.x
Styling: CSS3 with custom design system
HTTP Client: Axios
Date Utilities: Date-fns 4.x
Code Highlighting: React Syntax Highlighter
UI Notifications: React Hot Toast

Vite Configuration
This project uses Vite with HMR (Hot Module Replacement) and ESLint rules. Two official plugins are available:

@vitejs/plugin-react - Uses Babel for Fast Refresh
@vitejs/plugin-react-swc - Uses SWC for Fast Refresh (currently used)


Note: The React Compiler is not enabled on this template due to its impact on dev & build performance. To add it, see React Compiler documentation.

🚀 Getting Started

Backend integration: See docs/BACKEND_INTEGRATION.md for instructions to enable emails, scheduled reminders and voting endpoints. Configure provider credentials (SMTP or SendGrid) and set EMAIL_FROM, SMTP_USER and SMTP_PASS in the backend .env before enabling production notifications.

Prerequisites

Node.js 18+ and npm
Git
A code editor (VSCode recommended)

Installation

Clone the repository

bashgit clone https://github.com/yourusername/CodeTime-Capsule.git
cd CodeTime-Capsule

Install backend dependencies

bashcd backend
npm install

Install frontend dependencies

bashcd ../frontend
npm install

Configure environment variables

Backend (.env):
bashcd backend
cp .env.example .env

# Edit .env with your settings:
PORT=5000
DATABASE_URL=./database.sqlite
JWT_SECRET=your_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: OAuth Configuration
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
# GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Optional: Email Configuration
# EMAIL_FROM=noreply@codetimecapsule.com
# SMTP_USER=your_smtp_user
# SMTP_PASS=your_smtp_password
Frontend (.env):
bashcd frontend
cp .env.example .env

# Edit .env with your settings:
VITE_API_URL=http://localhost:5000

Initialize database (First time only)

bashcd backend
npm run db:init
Running the Application
Terminal 1 - Backend:
bashcd backend
npm run dev
# Backend will run on http://localhost:5000
Terminal 2 - Frontend:
bashcd frontend
npm run dev
# Frontend will run on http://localhost:5173

Open http://localhost:5173 in your browser

Quick Start Summary
Local Development:

Backend: cd backend && npm install and create a .env with JWT_SECRET, DB_NAME
Frontend: cd frontend && npm install and set VITE_API_URL in .env
Run backend: npm start in backend/
Run frontend: npm run dev in frontend/

Deploy to Render (staging):

Create two services on Render: a Web Service for backend/ (Node.js), and a Static Site for the built frontend (frontend/)
Set environment variables in Render (JWT_SECRET, DB_NAME, SMTP_* for email)
Configure the backend service to run npm start and the frontend build step to run npm run build and serve the dist/ directory

🔑 OAuth Authentication (GitHub / Google)
To enable social login via GitHub or Google:

Create OAuth apps in GitHub and Google and configure callback URLs:

GitHub callback: http://localhost:5000/api/auth/github/callback
Google callback: http://localhost:5000/api/auth/google/callback


Add environment variables to your backend .env file (see backend/.env.example):

env   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
   
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_secret_key_here

Install required packages in the backend:

bash   npm install passport passport-github2 passport-google-oauth20 --save
```

4. **Restart the backend server** (`npm run dev`)

5. **Frontend OAuth flow:** 
   - Social buttons redirect to the backend endpoints which start the OAuth flow
   - After successful provider sign-in, the backend redirects to: `${FRONTEND_URL}/auth/callback?token=...`
   - The frontend `/auth/callback` route consumes the `?token` parameter, stores it in `localStorage`, and calls `/api/auth/me` to complete sign-in

## 📖 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user info |
| PATCH | `/api/auth/me/privacy` | Toggle account privacy (public/private) |
| GET | `/api/auth/github` | Initiate GitHub OAuth flow |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Capsule Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capsules` | Get all user capsules |
| GET | `/api/capsules?scope=public` | Get public capsules from others |
| GET | `/api/capsules?scope=myPublic` | Get user's public capsules |
| POST | `/api/capsules` | Create new capsule |
| GET | `/api/capsules/:id` | Get capsule by ID (counts unique views) |
| PUT | `/api/capsules/:id` | Update capsule |
| DELETE | `/api/capsules/:id` | Delete capsule |
| PATCH | `/api/capsules/:id/favorite` | Toggle favorite status |
| GET | `/api/capsules/check/unlock-status` | Check capsule unlock status (debug) |
| POST | `/api/capsules/test/force-unlock` | Force unlock all capsules (testing) |
| POST | `/api/capsules/test/update-unlock-date` | Update unlock date (testing) |

### Statistics & Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capsules/statistics` | Get user statistics |
| GET | `/api/capsules/export` | Export all data as JSON |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | Get all tags |
| POST | `/api/tags` | Create tag |
| DELETE | `/api/tags/:id` | Delete tag |

### Comments & Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:capsuleId` | Get capsule comments |
| POST | `/api/comments/:capsuleId` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/likes/toggle` | Toggle like on capsule |
| GET | `/api/likes/:capsuleId/count` | Get like count |
| GET | `/api/likes/:capsuleId/check` | Check if user liked |

### Community Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community/explore/public` | Explore public capsules |
| GET | `/api/community/stats` | Get community statistics |
| GET | `/api/community/leaderboard` | Get leaderboard |
| POST | `/api/community/track-view` | Track capsule view |
| GET | `/api/community/trending` | Get trending technologies |

### Social & Privacy Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follow/toggle` | Toggle follow user |
| GET | `/api/follow/followers` | Get user followers |
| GET | `/api/follow/following` | Get user following |
| GET | `/api/follow/requests/pending` | Get pending follow requests (private accounts) |
| POST | `/api/follow/requests/:requesterId/approve` | Approve follow request |
| POST | `/api/follow/requests/:requesterId/reject` | Reject follow request |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | Get all templates |
| POST | `/api/templates` | Create template |
| DELETE | `/api/templates/:id` | Delete template |

## 🎨 Design System

### Color Palette
| Element | Color | Hex Code |
|---------|-------|----------|
| Primary Brand | Indigo | `#6366f1` |
| Secondary | Purple | `#8b5cf6` |
| Accent | Gold | `#e2b714` |
| Secondary Accent | Teal | `#1f7a8c` |
| Success | Green | `#10b981` |
| Error | Red | `#ef4444` |
| Warning | Amber | `#f59e0b` |
| Info | Blue | `#3b82f6` |
| Dark Background | Slate | `#0f172a` |
| Light Background | White | `#ffffff` |

### Typography
- **Font Family:** System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen)
- **Base Size:** 16px
- **Type Scale:** 1.2 (1.2x multiplier)
- **Font Weights:**
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

### Spacing
- **Base Unit:** 8px
- **Scales:** 8px, 16px, 24px, 32px, 48px, 64px

## 📂 Project Structure
```
CodeTime-Capsule/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   └── server.js        # Express app
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── docs/
│   ├── BACKEND_INTEGRATION.md
│   └── demo.gif
│
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
│
├── README.md
├── CHANGELOG.md
└── .gitignore
🔐 Security Features

🔒 JWT-based authentication
🔑 Password hashing with bcryptjs
⏱️ Rate limiting on auth endpoints
🛡️ CORS protection
🪖 Helmet for HTTP headers security
✅ Input validation with express-validator
💉 SQL injection prevention via ORM
🛡️ XSS protection via React
🔐 Privacy account system with follow request approval
👁️ Unique view counting (1 view per user per capsule)
🚫 Creator-agnostic view tracking (doesn't count own views)
🔐 OAuth secure token exchange

🧪 Testing
bash# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test
```

## 👁️ View Counter System

### How It Works

The view counter system ensures **accurate, unique view tracking**:

1. **One View Per User Per Capsule**
   - Each unique user can only count as 1 view for any capsule
   - Repeated visits from the same user don't increment the counter
   - Data stored in `CapsuleView` table linking users to capsules

2. **Creator Views Not Counted**
   - When the capsule creator views their own capsule, it doesn't count
   - Only views from other users are counted
   - Ensures authentic engagement metrics

3. **Automatic Tracking**
   - Views are automatically counted when calling `GET /api/capsules/:id`
   - System checks if user has already viewed that capsule
   - If new view, creates `CapsuleView` record and increments `viewCount`

### Example Flow
```
User A creates capsule "My First Code"
- viewCount = 0

User B opens the capsule
- System creates CapsuleView(userId: B, capsuleId: X)
- viewCount = 1

User B opens the same capsule again
- System finds existing CapsuleView for User B
- Does NOT increment (already counted)
- viewCount = 1

User C opens the capsule
- System creates CapsuleView(userId: C, capsuleId: X)
- viewCount = 2
API Response
When fetching a capsule, the response includes:
json{
  "capsule": {
    "id": "9825b953-30b4-44a2-b031-e8155396244e",
    "title": "My First Code",
    "viewCount": 5,
    "lastViewed": "2026-01-27T16:15:30Z",
    "creatorId": "user-id-123",
    ...
  }
}
🏗️ Building for Production
Backend
bashcd backend
npm run build
npm start
Frontend
bashcd frontend
npm run build
# Output will be in dist/ directory
🚀 Deployment
Recommended Platforms

Backend: Render, Railway, Heroku, Vercel
Frontend: Vercel, Netlify, GitHub Pages

Production Deployment Steps

Backend Setup:

Create a .env file with JWT_SECRET, DB_NAME, and optional SMTP variables
Run npm install and npm start in the backend/ folder


Frontend Setup:

Set VITE_API_URL in .env
Run npm install and npm run build in frontend/


CI/CD:

A template GitHub Actions workflow is available at .github/workflows/ci.yml
Automatically builds and verifies both frontend and backend



Deploy to Render (Recommended)

Create two services on Render:

Web Service for backend/ (Node.js)
Static Site for the built frontend (frontend/)


Set environment variables:

JWT_SECRET, DB_NAME, FRONTEND_URL
Optional: SMTP_* variables for email
Optional: OAuth credentials for GitHub/Google


Configure build commands:

Backend: npm start
Frontend: npm run build (serve dist/ directory)



Notes

The editor supports multiple languages: JavaScript, Python, Java, Bash, Go, JSON, and plain text
Backend stores codeSnippet and language fields
A lightweight background poller handles scheduled reminders
For production-grade scheduling, use a queue (BullMQ + Redis) with retry logic

⚙️ Advanced Configuration
Expanding ESLint Configuration
For production applications, we recommend using TypeScript with type-aware lint rules. Check out the Vite TS template for information on integrating TypeScript and typescript-eslint in your project.
Performance Optimization

Backend uses compression middleware for response optimization
Frontend leverages Vite's Fast Refresh for instant HMR
SQLite database with proper indexing
React lazy loading for code splitting
Optimized bundle size with tree-shaking

🤝 Contributing
Contributions are welcome! Follow these steps:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Make your changes
Commit (git commit -m 'Add AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open a Pull Request

📄 License
This project is licensed under the MIT License. See LICENSE file for details.
👨‍💻 Authors

Gonçalo Coimbra - Full Stack Developer
Ana - Full Stack Developer

🙏 Acknowledgments

React and Node.js communities
Vite team for the amazing build tool
All open-source contributors
Project Mentor: @spars57

📧 Support
For support, open an issue on GitHub or contact the team.
📊 Project Status

Version: 4.1.0 - Community Edition (Enhanced)
Status: Active Development
Last Updated: January 27, 2026
Challenge: Desafio Mensal de Programação - Janeiro 2026

Recent Updates (v4.1.0)

✅ Real-time capsule unlock countdown timer
✅ Automatic capsule unlock detection
✅ Privacy account system with follow requests
✅ Unique view counter (1 per user per capsule)
✅ Remember me functionality on login
✅ Terms agreement validation on register
✅ Redesigned notifications center with animations
✅ Community page visual improvements
✅ PT-PT localization comments throughout codebase
✅ OAuth integration (GitHub & Google)
✅ Vite-powered frontend with Fast Refresh

🎯 Roadmap

 Mobile app (React Native)
 Social features enhancement
 Advanced notifications
 Analytics dashboard
 Blockchain integration
 AI-powered predictions
 Multi-language support
 TypeScript migration
 Real-time collaboration features

📸 Demo
<!-- Embedded demo GIF (base64 inline for immediate rendering) -->
<img src="data:image/gif;base64,R0lGODlhEAAQAKIAAP///wAAAMLCwgAAAG5ubgAAAAAAAAAAACH5BAEAAAQALAAAAAAQABAAAAKBlI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTN8gAAOw==" alt="Demo GIF" />

Note: A repository file is available at docs/demo.gif (base64). Replace it with a binary GIF to serve it directly if preferred.


Made with ❤️ by Gonçalo Coimbra and Ana
⭐ If you like this project, please give it a star!