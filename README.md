# 🎯 Time Capsules

A modern, feature-rich time capsule application built with React and Node.js.

##  Features

### Core Features
-  Create and manage time capsules
-  Auto-unlock based on date
-  Organize with categories
-  Tag system for better organization
-  Favorite capsules
-  Detailed statistics and analytics
-  Visual charts and graphs
-  Dark/Light mode
-  Export data (JSON backup)
-  Rich text editing
-  Custom colors for capsules

### Advanced Features
- Advanced search and filtering
- Multiple view modes (Grid/List)
- Sorting options
- Reminder system
- View counter
- Privacy controls
- Templates library
- Audit logging
- Performance optimizations
- Accessibility features

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- SQLite (Sequelize ORM)
- JWT Authentication
- Rate Limiting
- Compression
- Security with Helmet

### Frontend
- React 18
- Recharts (Analytics)
- React Icons
- React Hot Toast
- Framer Motion
- Date-fns

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
\\\ash
git clone https://github.com/GoncaloCoimbra/time-capsules.git
cd time-capsules
\\\

2. Install backend dependencies
\\\ash
cd backend
npm install
\\\

3. Install frontend dependencies
\\\ash
cd ../frontend
npm install
\\\

4. Configure environment variables
\\\ash
cd ../backend
cp .env.example .env
# Edit .env with your settings
\\\

### Running the Application

1. Start the backend (Terminal 1)
\\\ash
cd backend
npm run dev
\\\

2. Start the frontend (Terminal 2)
\\\ash
cd frontend
npm run dev
\\\

3. Open your browser
\\\
http://localhost:5173
\\\

## 📖 API Documentation

### Authentication
- \POST /api/auth/register\ - Register new user
- \POST /api/auth/login\ - Login user

### Capsules
- \GET /api/capsules\ - Get all capsules
- \POST /api/capsules\ - Create capsule
- \GET /api/capsules/:id\ - Get capsule by ID
- \PUT /api/capsules/:id\ - Update capsule
- \DELETE /api/capsules/:id\ - Delete capsule
- \GET /api/capsules/statistics\ - Get statistics
- \GET /api/capsules/export\ - Export all data
- \PATCH /api/capsules/:id/favorite\ - Toggle favorite

### Categories
- \GET /api/categories\ - Get all categories
- \POST /api/categories\ - Create category
- \PUT /api/categories/:id\ - Update category
- \DELETE /api/categories/:id\ - Delete category

### Tags
- \GET /api/tags\ - Get all tags
- \POST /api/tags\ - Create tag
- \DELETE /api/tags/:id\ - Delete tag

### Templates
- \GET /api/templates\ - Get all templates
- \POST /api/templates\ - Create template
- \DELETE /api/templates/:id\ - Delete template

## 🎨 Design System

### Colors
- Primary: \#6366f1\
- Secondary: \#8b5cf6\
- Success: \#10b981\
- Danger: \#ef4444\
- Warning: \#f59e0b\
- Info: \#3b82f6\

### Typography
- Font Family: Inter
- Base Size: 16px
- Scale: 1.2 (Type Scale)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Gonçalo Coimbra and Ana 

## 🙏 Acknowledgments

- React Team
- Node.js Community
- All contributors

## 📊 Project Status

Version 3.0.0 - Ultimate Edition
Status: Active Development

---

Made with ❤️ by Gonçalo Coimbra and Ana
