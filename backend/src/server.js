// Carregar variáveis de ambiente PRIMEIRO (antes de tudo!)
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Inicializar Passport (DEPOIS do dotenv.config())
const passport = require('passport');
require('./passport');

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/capsules', require('./routes/capsuleRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/likes', require('./routes/likeRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    features: ['community', 'comments', 'likes', 'leaderboard', 'templates', 'audit-logs', 'compression', 'enhanced-security']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// Models
const Capsule = require('./models/Capsule');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
const CapsuleTag = require('./models/CapsuleTag');
const Template = require('./models/Template');
const AuditLog = require('./models/AuditLog');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const CapsuleView = require('./models/CapsuleView');
const Favorite = require('./models/Favorite');
const User = require('./models/User');
const Follow = require('./models/Follow');
const Notification = require('./models/Notification');
const Vote = require('./models/Vote');
const ScheduledNotification = require('./models/ScheduledNotification');

// Model associations
Capsule.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Capsule, { foreignKey: 'categoryId', as: 'capsules' });

Capsule.belongsToMany(Tag, { through: CapsuleTag, foreignKey: 'capsuleId', as: 'tags' });
Tag.belongsToMany(Capsule, { through: CapsuleTag, foreignKey: 'tagId', as: 'capsules' });

// Creator / User
Capsule.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
User.hasMany(Capsule, { foreignKey: 'creatorId', as: 'capsules' });

// Social features
Capsule.hasMany(Comment, { foreignKey: 'capsuleId', as: 'comments' });
Comment.belongsTo(Capsule, { foreignKey: 'capsuleId' });

Capsule.hasMany(Like, { foreignKey: 'capsuleId', as: 'likes' });
Like.belongsTo(Capsule, { foreignKey: 'capsuleId' });

Capsule.hasMany(CapsuleView, { foreignKey: 'capsuleId', as: 'views' });
CapsuleView.belongsTo(Capsule, { foreignKey: 'capsuleId' });

// Favorites
Capsule.hasMany(Favorite, { foreignKey: 'capsuleId', as: 'favorites' });
Favorite.belongsTo(Capsule, { foreignKey: 'capsuleId' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

// Votes
Capsule.hasMany(Vote, { foreignKey: 'capsuleId', as: 'votes' });
Vote.belongsTo(Capsule, { foreignKey: 'capsuleId' });
User.hasMany(Vote, { foreignKey: 'userId', as: 'votesByUser' });
Vote.belongsTo(User, { foreignKey: 'userId' });

// Follow associations
User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ScheduledNotification, { foreignKey: 'userId', as: 'scheduledNotifications' });
ScheduledNotification.belongsTo(User, { foreignKey: 'userId' });

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('✓ Server running on port ' + PORT);
    console.log('✓ Version 4.0.0 - Ultimate Edition');
    console.log('✓ Environment:', process.env.NODE_ENV || 'development');
    
    // Log OAuth status
    if (process.env.GITHUB_CLIENT_ID) {
      console.log('✓ GitHub OAuth: ENABLED');
    } else {
      console.log('⚠ GitHub OAuth: DISABLED (missing credentials)');
    }
    
    if (process.env.GOOGLE_CLIENT_ID) {
      console.log('✓ Google OAuth: ENABLED');
    } else {
      console.log('⚠ Google OAuth: DISABLED (missing credentials)');
    }
  });

  // Background scheduler: process pending scheduled notifications every minute
  const { Op } = require('sequelize');
  const processScheduledNotifications = async () => {
    try {
      const due = await ScheduledNotification.findAll({ 
        where: { 
          sent: false, 
          remindAt: { [Op.lte]: new Date() } 
        } 
      });
      
      for (const s of due) {
        try {
          await Notification.create({ 
            userId: s.userId, 
            actorId: s.actorId, 
            type: 'reminder', 
            capsuleId: s.capsuleId, 
            meta: s.meta 
          });

          if (process.env.SMTP_HOST && s.meta && s.meta.email) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            });

            await transporter.sendMail({ 
              from: process.env.SMTP_FROM || process.env.SMTP_USER, 
              to: s.meta.email, 
              subject: s.meta.subject || 'Lembrete CodeTime', 
              html: s.meta.html || `<p>Lembrete da sua cápsula</p>` 
            });
          }

          s.sent = true;
          await s.save();
        } catch (err) {
          console.error('Error processing scheduled notification', err);
        }
      }
    } catch (err) {
      console.error('Error fetching scheduled notifications', err);
    }
  };

  setInterval(processScheduledNotifications, 60 * 1000);
});