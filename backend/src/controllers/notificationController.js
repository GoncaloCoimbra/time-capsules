const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const n = await Notification.findOne({ where: { id, userId } });
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    n.read = true;
    await n.save();
    res.json({ message: 'Marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification read', error: error.message });
  }
};

const ScheduledNotification = require('../models/ScheduledNotification');
const { Op } = require('sequelize');

// Schedule a reminder for a user (stored as ScheduledNotification)
exports.schedule = async (req, res) => {
  try {
    const actorId = req.user.userId;
    const { userId, capsuleId, remindAt, meta } = req.body;
    if (!userId || !remindAt) return res.status(400).json({ message: 'Missing userId or remindAt' });

    const remindDate = new Date(remindAt);
    if (isNaN(remindDate.getTime())) return res.status(400).json({ message: 'Invalid remindAt date' });

    const scheduled = await ScheduledNotification.create({ userId, actorId, capsuleId: capsuleId || null, remindAt: remindDate, meta: meta || null });

    res.json({ message: 'Scheduled', scheduled });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling notification', error: error.message });
  }
};

// Send an email (placeholder): tries to use SMTP if configured or logs otherwise
exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) return res.status(400).json({ message: 'Missing fields' });

    // Try to send via nodemailer if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
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

      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html });
      return res.json({ message: 'Email sent' });
    }

    console.log('sendEmail fallback - email payload:', { to, subject, html });
    res.json({ message: 'Email queued (mock)' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
};

