const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'e-garrage-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new Database('e-garrage.db');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    isPremium INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost REAL DEFAULT 0,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    supplier_id INTEGER,
    status TEXT DEFAULT 'active',
    isDropshipping INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    api_key TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    tracking_number TEXT,
    supplier_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    revenue REAL DEFAULT 0,
    orders INTEGER DEFAULT 0,
    visitors INTEGER DEFAULT 0,
    dropship_orders INTEGER DEFAULT 0
  );
`);

// Seed demo data
const seedDemo = db.prepare(`SELECT COUNT(*) as count FROM products`).get();
if (seedDemo.count === 0) {
  const insertProduct = db.prepare(`INSERT INTO products (name, description, price, cost, image, category, stock, isDropshipping) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const demoProducts = [
    ['Wireless Bluetooth Earbuds', 'High quality wireless earbuds with noise cancellation', 49.99, 15.00, '/images/earbuds.jpg', 'Electronics', 100, 1],
    ['Smart Watch Pro', 'Fitness tracker with heart rate monitor', 89.99, 35.00, '/images/watch.jpg', 'Electronics', 50, 1],
    ['Phone Case Premium', 'Shockproof phone case for all models', 19.99, 5.00, '/images/case.jpg', 'Accessories', 200, 1],
    ['USB-C Cable 3-Pack', 'Fast charging cables', 12.99, 3.00, '/images/cable.jpg', 'Accessories', 300, 1],
    ['Portable Power Bank 20000mAh', 'High capacity portable charger', 39.99, 12.00, '/images/powerbank.jpg', 'Electronics', 80, 1],
    ['LED Desk Lamp', 'Adjustable brightness desk lamp', 29.99, 8.00, '/images/lamp.jpg', 'Home', 60, 1],
    ['Wireless Mouse', 'Ergonomic wireless mouse', 24.99, 7.00, '/images/mouse.jpg', 'Electronics', 150, 1],
    ['HD Webcam 1080p', 'Full HD webcam for streaming', 59.99, 20.00, '/images/webcam.jpg', 'Electronics', 40, 1]
  ];
  
  demoProducts.forEach(p => insertProduct.run(...p));
  
  // Add demo supplier
  db.prepare(`INSERT INTO suppliers (name, email, phone, status) VALUES (?, ?, ?, ?)`).run('Global Supplies Ltd', 'supplier@global.com', '+1-555-0123', 'active');
  
  // Add admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, email, password, role, isPremium) VALUES (?, ?, ?, ?, ?)`).run('admin', 'admin@egarrage.com', hashedPassword, 'admin', 1);
  
  console.log('Demo data seeded successfully');
}

// ============ AUTH ROUTES ============

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`).run(username, email, hashedPassword);
    
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: result.lastInsertRowid, username, email, role: 'customer', isPremium: 0 } });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Username or email already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role, isPremium: user.isPremium } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

// ============ PRODUCT ROUTES ============

app.get('/api/products', (req, res) => {
  const { category, search, dropshipping } = req.query;
  let query = 'SELECT * FROM products WHERE status = ?';
  const params = ['active'];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  if (dropshipping === 'true') {
    query += ' AND isDropshipping = 1';
  }
  
  query += ' ORDER BY created_at DESC';
  const products = db.prepare(query).all(...params);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

app.post('/api/products', auth, adminOnly, (req, res) => {
  const { name, description, price, cost, image, category, stock, supplier_id, isDropshipping } = req.body;
  const result = db.prepare(`INSERT INTO products (name, description, price, cost, image, category, stock, supplier_id, isDropshipping) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(name, description, price, cost || 0, image, category, stock || 0, supplier_id, isDropshipping ? 1 : 0);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/products/:id', auth, adminOnly, (req, res) => {
  const { name, description, price, cost, image, category, stock, status } = req.body;
  db.prepare(`UPDATE products SET name = ?, description = ?, price = ?, cost = ?, image = ?, category = ?, stock = ?, status = ? WHERE id = ?`)
    .run(name, description, price, cost, image, category, stock, status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/products/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ ORDER ROUTES ============

app.post('/api/orders', auth, (req, res) => {
  try {
    const { items, shipping_address } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    let total = 0;
    items.forEach(item => {
      total += item.price * item.quantity;
    });
    
    const result = db.prepare(`INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)`)
      .run(req.user.id, total, shipping_address);
    
    const orderId = result.lastInsertRowid;
    const insertItem = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
    
    items.forEach(item => {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    });
    
    res.json({ success: true, orderId, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/orders', auth, (req, res) => {
  let orders;
  if (req.user.role === 'admin') {
    orders = db.prepare(`SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`).all();
  } else {
    orders = db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).all(req.user.id);
  }
  res.json(orders);
});

app.get('/api/orders/:id', auth, (req, res) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = 'admin')`).get(req.params.id, req.user.id, req.user.role);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  
  const items = db.prepare(`SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`).all(req.params.id);
  res.json({ ...order, items });
});

app.put('/api/orders/:id/status', auth, adminOnly, (req, res) => {
  const { status, tracking_number } = req.body;
  db.prepare(`UPDATE orders SET status = ?, tracking_number = ? WHERE id = ?`).run(status, tracking_number, req.params.id);
  res.json({ success: true });
});

// ============ SUPPLIER/DROPSHIPPING ROUTES ============

app.get('/api/suppliers', auth, adminOnly, (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
  res.json(suppliers);
});

app.post('/api/suppliers', auth, adminOnly, (req, res) => {
  const { name, email, phone, address, api_key } = req.body;
  const result = db.prepare(`INSERT INTO suppliers (name, email, phone, address, api_key) VALUES (?, ?, ?, ?, ?)`).run(name, email, phone, address, api_key);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/suppliers/:id', auth, adminOnly, (req, res) => {
  const { name, email, phone, address, status } = req.body;
  db.prepare(`UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?`)
    .run(name, email, phone, address, status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/suppliers/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ============ ANALYTICS (PREMIUM) ============

app.get('/api/analytics', auth, adminOnly, (req, res) => {
  const { period } = req.query;
  let days = period === 'year' ? 365 : period === 'month' ? 30 : 7;
  
  const revenue = db.prepare(`
    SELECT SUM(total) as total FROM orders 
    WHERE created_at >= date('now', '-${days} days') AND status != 'cancelled'
  `).get();
  
  const orders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE created_at >= date('now', '-${days} days')
  `).get();
  
  const topProducts = db.prepare(`
    SELECT p.name, SUM(oi.quantity) as sold, SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= date('now', '-${days} days')
    GROUP BY p.id
    ORDER BY sold DESC
    LIMIT 5
  `).all();
  
  res.json({
    revenue: revenue.total || 0,
    orders: orders.count,
    topProducts,
    period: days
  });
});

app.get('/api/analytics/dropshipping', auth, adminOnly, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      SUM(o.total) as total_revenue,
      COUNT(DISTINCT o.supplier_id) as active_suppliers
    FROM orders o
    JOIN products p ON EXISTS (
      SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id AND p.isDropshipping = 1
    )
    WHERE o.created_at >= date('now', '-30 days')
  `).get();
  
  res.json(stats);
});

// ============ USER ROUTES ============

app.get('/api/users/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, isPremium, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.put('/api/users/me', auth, (req, res) => {
  const { username } = req.body;
  db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
  res.json({ success: true });
});

app.post('/api/users/upgrade', auth, (req, res) => {
  // Premium upgrade endpoint
  db.prepare('UPDATE users SET isPremium = 1 WHERE id = ?').run(req.user.id);
  res.json({ success: true, message: 'Upgraded to Premium!' });
});

// ============ STATIC FILES ============

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

app.get('/supplier', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'supplier.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

app.get('/agents', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agents.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/config', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'config.html'));
});

// ============ WEBHOOKS API ============
app.post('/api/webhooks', (req, res) => {
  const { url, events } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL required' });
  }
  
  const webhook = {
    id: Date.now(),
    url,
    events: events || ['order.created'],
    created_at: new Date().toISOString()
  };
  
  res.json({ success: true, webhook, message: 'Webhook registered' });
});

app.post('/api/webhooks/trigger', async (req, res) => {
  const { event, data } = req.body;
  console.log(`🔗 Webhook triggered: ${event}`, data);
  res.json({ success: true, message: `Webhook ${event} triggered` });
});

// ============ PAYMENTS API ============
const payments = require('./payments');

app.post('/api/payments/stripe', async (req, res) => {
  try {
    const { amount, currency, email, metadata } = req.body;
    const result = await payments.createStripePayment(amount, currency, email, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/paypal', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const result = await payments.createPayPalOrder(amount, currency);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/invoice', (req, res) => {
  const { order, user } = req.body;
  const invoice = payments.generateInvoice(order, user, 0.20);
  res.json({ success: true, invoice });
});

app.post('/api/payments/refund', async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  const result = await payments.processRefund(paymentId, amount, reason);
  res.json(result);
});

app.get('/api/payments/plans', (req, res) => {
  res.json({ plans: payments.stripeConfig.plans });
});

// ============ COMMUNICATIONS API ============
const communications = require('./communications');

app.post('/api/communications/email', async (req, res) => {
  try {
    const { to, template, data } = req.body;
    const result = await communications.sendEmail(to, template, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/communications/sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await communications.sendSMS(to, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/communications/push', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    const result = await communications.sendPushNotification(userId, title, body, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notifications/:userId', (req, res) => {
  const notifications = communications.getUserNotifications(req.params.userId);
  res.json({ notifications });
});

// ============ SECURITY API ============
const security = require('./security');

app.post('/api/security/rate-limit', (req, res) => {
  const { key, type } = req.body;
  const result = security.checkRateLimit(key, type);
  res.json(result);
});

app.post('/api/security/2fa/enable', (req, res) => {
  const { userId } = req.body;
  const result = security.twoFactor.enable(userId);
  res.json(result);
});

app.post('/api/security/2fa/verify', (req, res) => {
  const { secret, code } = req.body;
  const valid = security.twoFactor.verifyCode(secret, code);
  res.json({ valid });
});

app.post('/api/security/password/validate', (req, res) => {
  const { password } = req.body;
  const result = security.validatePassword(password);
  res.json(result);
});

app.post('/api/auth/token/refresh', (req, res) => {
  const { token } = req.body;
  const decoded = security.verifyToken(token);
  if (decoded) {
    const newToken = security.generateToken({ id: decoded.id, email: decoded.email });
    res.json({ token: newToken });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============ ANALYTICS API ============
const analytics = require('./analytics');

app.post('/api/analytics/track', (req, res) => {
  const { eventType, data } = req.body;
  analytics.trackEvent(eventType, data);
  res.json({ success: true });
});

app.get('/api/analytics/live', (req, res) => {
  const metrics = analytics.getLiveMetrics();
  res.json(metrics);
});

app.get('/api/analytics/report', (req, res) => {
  const { period } = req.query;
  const report = analytics.generateReport(period || 'daily');
  res.json(report);
});

app.get('/api/analytics/funnel', (req, res) => {
  const funnel = analytics.analyzeFunnel();
  res.json(funnel);
});

// ============ AI API ============
const advancedAI = require('./advanced-ai');

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const result = await advancedAI.chatWithGPT(message, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/rag', (req, res) => {
  const { query } = req.body;
  const result = advancedAI.ragChatbot(query);
  res.json(result);
});

app.post('/api/ai/car-diagnosis', async (req, res) => {
  try {
    const { imageData } = req.body;
    const result = await advancedAI.analyzeCarImage(imageData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/speech-to-text', async (req, res) => {
  try {
    const { audioData } = req.body;
    const result = await advancedAI.speechToText(audioData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/sentiment', (req, res) => {
  const { text } = req.body;
  const result = advancedAI.analyzeSentiment(text);
  res.json(result);
});

// ============ AI AGENTS API ============
const agents = require('./agents');

// Run specific agent
app.post('/api/agents/run', async (req, res) => {
  try {
    const { agentType, input, orderId, action, data, productId, userId, type, period, campaign } = req.body;
    
    const result = await agents.runAgent(agentType, {
      query: input,
      orderId,
      action,
      data,
      productId,
      userId,
      type,
      period,
      campaign
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer Service Agent
app.post('/api/agents/customer-service', async (req, res) => {
  try {
    const { query, userId } = req.body;
    const result = await agents.runCustomerServiceAgent({ query, userId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order Agent
app.post('/api/agents/order', async (req, res) => {
  try {
    const { orderId, action, data } = req.body;
    const result = await agents.runOrderAgent(orderId, action, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inventory Agent
app.post('/api/agents/inventory', async (req, res) => {
  try {
    const { action, productId } = req.body;
    const result = await agents.runInventoryAgent(action, productId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales Agent
app.post('/api/agents/sales', async (req, res) => {
  try {
    const { userId, type } = req.body;
    const result = await agents.runSalesAgent(userId, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Agent
app.post('/api/agents/analytics', async (req, res) => {
  try {
    const { period } = req.body;
    const result = await agents.runAnalyticsAgent(period);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marketing Agent
app.post('/api/agents/marketing', async (req, res) => {
  try {
    const { campaign } = req.body;
    const result = await agents.runMarketingAgent(campaign);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent status
app.get('/api/agents/status', (req, res) => {
  const status = agents.getAgentStatus();
  res.json(status);
});

// Run automated tasks
app.post('/api/agents/automate', async (req, res) => {
  try {
    await agents.runAutomatedTasks();
    res.json({ success: true, message: 'Automated tasks completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`E-Garrage server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});