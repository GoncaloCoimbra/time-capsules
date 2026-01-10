const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/capsules', require('./routes/capsuleRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/likes', require('./routes/likeRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    features: ['community', 'comments', 'likes', 'leaderboard', 'templates', 'audit-logs', 'compression', 'enhanced-security']
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

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

app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Follow associations
User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(' Server running on port ' + PORT);
    console.log(' Version 3.0.0 - Ultimate Edition');
  });
});
