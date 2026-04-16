/**
 * E-GARRAGE SECURITY SYSTEM
 * OAuth, 2FA, Rate Limiting, Validation
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ============ JWT CONFIG ============
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'egarrage_super_secret_key_2024',
  expiresIn: '7d',
  refreshExpiresIn: '30d'
};

// ============ OAUTH PROVIDERS ============
const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'xxx',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'xxx',
    callbackUrl: '/auth/google/callback',
    scope: ['profile', 'email']
  },
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID || 'xxx',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'xxx',
    callbackUrl: '/auth/facebook/callback',
    scope: ['email', 'public_profile']
  }
};

// ============ RATE LIMITING ============
const rateLimits = {
  general: { windowMs: 15 * 60 * 1000, max: 100 },      // 100 requests per 15 min
  auth: { windowMs: 15 * 60 * 1000, max: 5 },          // 5 attempts per 15 min
  api: { windowMs: 60 * 1000, max: 60 },               // 60 API calls per min
  payment: { windowMs: 60 * 60 * 1000, max: 10 }       // 10 payments per hour
};

// In-memory rate limit store
const rateLimitStore = new Map();

function checkRateLimit(key, type = 'general') {
  const limit = rateLimits[type];
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1 };
  }
  
  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + limit.windowMs;
    return { allowed: true, remaining: limit.max - 1 };
  }
  
  if (record.count >= limit.max) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: limit.max - record.count };
}

// ============ 2FA (TOTP) ============
const twoFactor = {
  // Generate secret
  generateSecret: () => {
    const secret = crypto.randomBytes(20).toString('hex');
    return {
      secret,
      otpauthUrl: `otpauth://totp:E-GARRAGE?secret=${secret}&issuer=E-GARRAGE`
    };
  },
  
  // Verify code
  verifyCode: (secret, code) => {
    // Simple implementation - in production use 'speakeasy' library
    // For demo, accept any 6-digit code
    return code && code.length === 6 && /^\d+$/.test(code);
  },
  
  // Enable 2FA for user
  enable: (userId) => {
    const { secret, otpauthUrl } = twoFactor.generateSecret();
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    return {
      secret,
      otpauthUrl,
      backupCodes,
      enabled: true
    };
  },
  
  // Disable 2FA
  disable: (userId, code) => {
    if (twoFactor.verifyCode('ignored', code)) {
      return { disabled: true };
    }
    return { error: 'Invalid code' };
  }
};

// ============ PASSWORD STRENGTH ============
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character (!@#$%^&*)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength: password.length >= 12 && errors.length === 0 ? 'strong' : 
              password.length >= 8 ? 'medium' : 'weak'
  };
}

// ============ HASH PASSWORD ============
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, 'egarrage_salt', 100000, 64, 'sha512').toString('hex');
}

// ============ VERIFY PASSWORD ============
function verifyPassword(password, hash) {
  const newHash = crypto.pbkdf2Sync(password, 'egarrage_salt', 100000, 64, 'sha512').toString('hex');
  return newHash === hash;
}

// ============ GENERATE TOKEN ============
function generateToken(payload, type = 'access') {
  const options = {
    expiresIn: type === 'access' ? jwtConfig.expiresIn : jwtConfig.refreshExpiresIn
  };
  
  return jwt.sign(payload, jwtConfig.secret, options);
}

// ============ VERIFY TOKEN ============
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
}

// ============ IP BLOCKING ============
const blockedIPs = new Set();

function blockIP(ip) {
  blockedIPs.add(ip);
  console.log(`🚫 IP blocked: ${ip}`);
}

function unblockIP(ip) {
  blockedIPs.delete(ip);
}

function isIPBlocked(ip) {
  return blockedIPs.has(ip);
}

// ============ INPUT SANITIZATION ============
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// ============ CSRF TOKEN ============
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============ SECURITY HEADERS ============
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self' https: data:; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
};

// ============ EXPORT ============
module.exports = {
  jwtConfig,
  oauthConfig,
  rateLimits,
  checkRateLimit,
  twoFactor,
  validatePassword,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  blockIP,
  unblockIP,
  isIPBlocked,
  sanitizeInput,
  generateCSRFToken,
  securityHeaders
};