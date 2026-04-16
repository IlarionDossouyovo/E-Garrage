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