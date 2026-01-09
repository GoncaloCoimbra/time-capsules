# 🎯 CodeTime Capsule

A modern, feature-rich **social time capsule application** for developers. Write code, predictions, or messages that get "locked" until a future date. When the date arrives, your capsule automatically unlocks and becomes visible to the community!

Perfect for:
- 💡 Documenting tech predictions
- 🚀 Recording career milestones
- 📝 Sharing code snippets from past versions
- 🎯 Goal tracking and personal growth
- 🌐 Community exploration and discussions

## 🌟 Features

### Core Features
- ✅ Create and manage time capsules
- 🔐 Auto-unlock based on custom unlock dates
- 📁 Organize with custom categories
- 🏷️ Tag system for better organization
- ⭐ Favorite your important capsules
- 📊 Detailed statistics and analytics
- 📈 Visual charts and graphs
- 🎨 Custom colors for capsules
- 💾 Export data (JSON backup)
- ♿ Accessibility features

### Social Features
- 👥 Explore public capsules from community
- 💬 Comment on capsules
- 👍 Like capsules
- 🏆 Leaderboard system
- 🔥 Trending technologies
- 📊 Community statistics
- 🎉 Achievements system

### Advanced Features
- 🔍 Advanced search and filtering
- 🖼️ Multiple view modes (Grid/List)
- 📑 Multiple sorting options
- ⏰ Reminder system for unlocks
- 👁️ View counter
- 🔒 Privacy controls (public/private)
- 📚 Templates library
- 📝 Audit logging
- ⚡ Performance optimizations
- 🌗 Dark/Light mode

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.x
- **Database:** SQLite with Sequelize ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet, CORS, Rate Limiting
- **Performance:** Compression middleware
- **Additional:** Nodemailer for notifications

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **Charts:** Recharts 3.x
- **Icons:** React Icons 5.x
- **Animations:** Framer Motion 12.x
- **Styling:** CSS3 with custom design system
- **HTTP Client:** Axios
- **Date Utilities:** Date-fns 4.x
- **Code Highlighting:** React Syntax Highlighter
- **UI Notifications:** React Hot Toast

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- A code editor (VSCode recommended)

### Installation

1. **Clone the repository**
\\\bash
git clone https://github.com/yourusername/CodeTime-Capsule.git
cd CodeTime-Capsule
\\\

2. **Install backend dependencies**
\\\bash
cd backend
npm install
\\\

3. **Install frontend dependencies**
\\\bash
cd ../frontend
npm install
\\\

4. **Configure environment variables**
\\\bash
# Backend configuration
cd ../backend
cp .env.example .env

# Edit .env with your settings:
# PORT=5000
# DATABASE_URL=./database.sqlite
# JWT_SECRET=your_secret_key_here
# NODE_ENV=development
\\\

5. **Initialize database** (First time only)
\\\bash
npm run db:init
\\\

### Running the Application

**Terminal 1 - Backend:**
\\\bash
cd backend
npm run dev
# Backend will run on http://localhost:5000
\\\

**Terminal 2 - Frontend:**
\\\bash
cd frontend
npm run dev
# Frontend will run on http://localhost:5173
\\\

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📖 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Capsule Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capsules` | Get all user capsules |
| POST | `/api/capsules` | Create new capsule |
| GET | `/api/capsules/:id` | Get capsule by ID |
| PUT | `/api/capsules/:id` | Update capsule |
| DELETE | `/api/capsules/:id` | Delete capsule |
| PATCH | `/api/capsules/:id/favorite` | Toggle favorite status |

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

\\\
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
├── README.md
├── CHANGELOG.md
└── .gitignore
\\\

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ Helmet for HTTP headers security
- ✅ Input validation with express-validator
- ✅ SQL injection prevention via ORM
- ✅ XSS protection via React

## 🧪 Testing

\\\bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test
\\\

## 📦 Building for Production

### Backend
\\\bash
cd backend
npm run build
npm start
\\\

### Frontend
\\\bash
cd frontend
npm run build
\\\

## 🚀 Deployment

### Recommended Platforms
- **Backend:** Render, Railway, Heroku, Vercel
- **Frontend:** Vercel, Netlify, GitHub Pages

### Deployment Steps
1. Push code to GitHub
2. Connect repository to deployment platform
3. Set environment variables
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit (`git commit -m 'Add AmazingFeature'`)
5. Push to branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Gonçalo Coimbra** - Full Stack Developer
- **Ana** - Full Stack Developer

## 🙏 Acknowledgments

- React and Node.js communities
- All open-source contributors
- Project Mentor: @spars57

## 📧 Support

For support, open an issue on GitHub or contact the team.

## 📊 Project Status

- **Version:** 4.0.0 - Community Edition
- **Status:** ✅ Active Development
- **Last Updated:** January 2026
- **Challenge:** Desafio Mensal de Programação - Janeiro 2026

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Social features enhancement
- [ ] Advanced notifications
- [ ] Analytics dashboard
- [ ] Blockchain integration
- [ ] AI-powered predictions
- [ ] Multi-language support

---

Made with ❤️ by Gonçalo Coimbra and Ana

⭐ If you like this project, please give it a star!
