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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    features: ['templates', 'audit-logs', 'compression', 'enhanced-security']
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

Capsule.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Capsule, { foreignKey: 'categoryId', as: 'capsules' });

Capsule.belongsToMany(Tag, { through: CapsuleTag, foreignKey: 'capsuleId', as: 'tags' });
Tag.belongsToMany(Capsule, { through: CapsuleTag, foreignKey: 'tagId', as: 'capsules' });

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(' Server running on port ' + PORT);
    console.log(' Version 3.0.0 - Ultimate Edition');
  });
});
