const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

//  Endpoint para verificar configuração OAuth
exports.getOAuthConfig = async (req, res) => {
  try {
    res.json({
      github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching config', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, avatar, bio, password, isPrivate } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    
    // Validar e processar avatar
    if (avatar && avatar.trim()) {
      // Se é base64, verificar tamanho
      if (avatar.startsWith('data:image')) {
        // Remover "data:image/...;base64," para calcular tamanho real
        const base64Data = avatar.split(',')[1];
        const sizeInBytes = Buffer.byteLength(base64Data, 'base64');
        
        // Limite: 2MB para avatar em base64
        if (sizeInBytes > 2 * 1024 * 1024) {
          return res.status(400).json({ 
            message: 'Avatar muito grande. Use uma imagem menor.',
            maxSize: '2MB'
          });
        }
      }
      user.avatar = avatar.trim();
    }
    
    if (bio) user.bio = bio;
    
    // Atualiza o estado de privacidade da conta
    if (typeof isPrivate === 'boolean') {
      user.isPrivate = isPrivate;
    }
    
    if (password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ 
      message: 'Profile updated', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        avatar: user.avatar, 
        bio: user.bio,
        isPrivate: user.isPrivate
      } 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'avatar', 'bio', 'isPrivate']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};