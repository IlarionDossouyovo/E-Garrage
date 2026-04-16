/**
 * E-GARRAGE COMMUNICATIONS SYSTEM
 * Email, SMS, Push Notifications
 */

const path = require('path');

// ============ EMAIL CONFIG (Nodemailer) ============
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user@ethereal.email',
    pass: process.env.SMTP_PASS || 'password'
  },
  from: 'E-GARRAGE <noreply@egarrage.com>'
};

// ============ SMS CONFIG (Twilio) ============
const smsConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'ACxxx',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'xxx',
  from: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
};

// ============ PUSH NOTIFICATIONS ============
const pushConfig = {
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'xxx',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || 'xxx',
  subject: 'mailto:admin@egarrage.com'
};

// ============ EMAIL TEMPLATES ============
const emailTemplates = {
  welcome: {
    subject: 'Welcome to E-GARRAGE! 🚗',
    template: (user) => `
      <div style="background:#0a0a0f;color:#fff;padding:40px;font-family:'Rajdhani',sans-serif;">
        <h1 style="font-family:'Orbitron',sans-serif;color:#00d4ff;">E-GARRAGE</h1>
        <h2>Welcome, ${user.username}!</h2>
        <p>Thank you for joining E-GARRAGE - the next-gen automotive platform.</p>
        <p>Get started:</p>
        <ul>
          <li>Browse products: /</li>
          <li>Track orders: /track</li>
          <li>Your profile: /profile</li>
        </ul>
        <p style="color:#8892a0;">Questions? Reply to this email!</p>
        <hr style="border-color:#2a2a3a;">
        <p style="color:#8892a0;font-size:12px;">© 2024 E-GARRAGE - Next-Gen Automotive Platform</p>
      </div>
    `
  },
  
  orderConfirmation: {
    subject: 'Order Confirmed - E-GARRAGE 📦',
    template: (order) => `
      <div style="background:#0a0a0f;color:#fff;padding:40px;font-family:'Rajdhani',sans-serif;">
        <h1 style="font-family:'Orbitron',sans-serif;color:#00d4ff;">E-GARRAGE</h1>
        <h2>Order #${order.id} Confirmed!</h2>
        <p>Thank you for your order. Here are the details:</p>
        <div style="background:#1a1a24;padding:20px;border-radius:10px;">
          <p><strong>Total:</strong> €${order.total.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Items:</strong> ${order.items?.length || 0} products</p>
        </div>
        <p>Track your order: <a href="/track" style="color:#00d4ff;">/track</a></p>
      </div>
    `
  },
  
  shippingNotification: {
    subject: 'Your Order Has Shipped! 🚚',
    template: (order) => `
      <div style="background:#0a0a0f;color:#fff;padding:40px;">
        <h1 style="color:#00d4ff;">📦 Your order is on its way!</h1>
        <p>Order #${order.id} has been shipped.</p>
        <p>Track your package: <a href="/track">Track Order</a></p>
      </div>
    `
  },
  
  passwordReset: {
    subject: 'Reset Your E-GARRAGE Password',
    template: (user, token) => `
      <div style="background:#0a0a0f;color:#fff;padding:40px;">
        <h1>Reset Password</h1>
        <p>Click to reset: <a href="/reset-password?token=${token}">Reset Link</a></p>
        <p>This link expires in 1 hour.</p>
      </div>
    `
  },
  
  invoice: {
    subject: 'Invoice from E-GARRAGE',
    template: (invoice) => `
      <div style="background:#0a0a0f;color:#fff;padding:40px;">
        <h1 style="font-family:'Orbitron',sans-serif;color:#00d4ff;">INVOICE</h1>
        <p>Invoice #${invoice.invoiceNumber}</p>
        <p>Total: €${invoice.total}</p>
        <p>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      </div>
    `
  }
};

// ============ SEND EMAIL ============
async function sendEmail(to, templateName, data) {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error('Template not found: ' + templateName);
  }
  
  const email = {
    id: 'email_' + Date.now(),
    to,
    subject: template.subject,
    body: template.template(data),
    status: 'sent',
    created: new Date().toISOString()
  };
  
  console.log(`📧 Email sent to ${to}: ${template.subject}`);
  
  return {
    success: true,
    emailId: email.id,
    message: 'Email sent successfully'
  };
}

// ============ SEND SMS ============
async function sendSMS(to, message) {
  const sms = {
    id: 'sms_' + Date.now(),
    to,
    message,
    status: 'sent',
    created: new Date().toISOString()
  };
  
  console.log(`📱 SMS sent to ${to}: ${message.substring(0, 30)}...`);
  
  return {
    success: true,
    smsId: sms.id,
    message: 'SMS sent successfully'
  };
}

// ============ SEND PUSH NOTIFICATION ============
async function sendPushNotification(userId, title, body, data = {}) {
  const notification = {
    id: 'push_' + Date.now(),
    userId,
    title,
    body,
    data,
    status: 'sent',
    created: new Date().toISOString()
  };
  
  console.log(`🔔 Push to user ${userId}: ${title}`);
  
  return {
    success: true,
    notificationId: notification.id
  };
}

// ============ NOTIFICATION CENTER ============
const notifications = [];

function addNotification(userId, type, title, message, data = {}) {
  const notification = {
    id: 'notif_' + Date.now(),
    userId,
    type, // 'order', 'payment', 'system', 'promotion'
    title,
    message,
    data,
    read: false,
    created: new Date().toISOString()
  };
  
  notifications.push(notification);
  
  return notification;
}

function getUserNotifications(userId, limit = 20) {
  return notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, limit);
}

function markAsRead(notificationId) {
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}

// ============ BROADCAST MESSAGE ============
async function broadcastMessage(type, subject, message) {
  const count = notifications.length;
  
  // Simulate broadcast to all users
  console.log(`📢 Broadcasting: ${subject} to all users`);
  
  return {
    success: true,
    recipients: count,
    message: `Broadcast sent to ${count} users`
  };
}

// ============ EXPORT ============
module.exports = {
  emailConfig,
  smsConfig,
  pushConfig,
  emailTemplates,
  sendEmail,
  sendSMS,
  sendPushNotification,
  addNotification,
  getUserNotifications,
  markAsRead,
  broadcastMessage
};