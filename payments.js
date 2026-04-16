/**
 * E-GARRAGE PAYMENT & INVOICE SYSTEM
 * Stripe, PayPal, Invoice generation, Tax calculation
 */

const path = require('path');

// ============ STRIPE CONFIG ============
const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_xxx',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_xxx',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xxx',
  currency: 'eur',
  // Stripe plans
  plans: {
    basic: { price: 990, name: 'Basic Plan', features: ['Products', 'Orders', 'Basic Support'] },
    premium: { price: 2990, name: 'Premium Plan', features: ['All Basic +', 'Analytics', 'Priority Support', 'API Access'] },
    enterprise: { price: 9900, name: 'Enterprise', features: ['All Premium +', 'Custom Integration', 'Dedicated Support', 'Unlimited']
    }
  }
};

// ============ PAYPAL CONFIG ============
const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID || 'AYxxx',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'xxx',
  mode: 'sandbox', // 'sandbox' or 'live'
  baseUrl: 'https://api-m.sandbox.paypal.com' // or api-m.paypal.com for live
};

// ============ TAX RATES ============
const taxRates = {
  FR: 0.20,    // France 20%
  DE: 0.19,    // Germany 19%
  ES: 0.21,    // Spain 21%
  IT: 0.22,    // Italy 22%
  GB: 0.20,    // UK 20%
  US: 0.08,    // US average 8%
  default: 0.20
};

// ============ CURRENCIES ============
const currencies = {
  EUR: { symbol: '€', name: 'Euro', rate: 1 },
  USD: { symbol: '$', name: 'US Dollar', rate: 1.08 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.86 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 162.50 }
};

// ============ STRIPE PAYMENT ============
async function createStripePayment(amount, currency, customerEmail, metadata = {}) {
  // Simulate Stripe payment intent
  const paymentIntent = {
    id: 'pi_' + Date.now(),
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    status: 'requires_payment_method',
    client_secret: 'pi_xxx_secret_xxx',
    metadata,
    created: Date.now()
  };
  
  return {
    success: true,
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: amount,
    currency: currency
  };
}

// ============ PAYPAL PAYMENT ============
async function createPayPalOrder(amount, currency) {
  // Simulate PayPal order
  const order = {
    id: 'PAY-' + Date.now(),
    status: 'CREATED',
    amount: amount,
    currency: currency,
    createTime: new Date().toISOString()
  };
  
  return {
    success: true,
    orderId: order.id,
    approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}`
  };
}

// ============ GENERATE INVOICE ============
function generateInvoice(order, user, taxRate = 0.20) {
  const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  const invoice = {
    invoiceNumber,
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    
    customer: {
      name: user.username,
      email: user.email,
      address: order.shipping_address || 'Not provided'
    },
    
    items: order.items.map(item => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity
    })),
    
    subtotal: subtotal.toFixed(2),
    taxRate: (taxRate * 100).toFixed(0) + '%',
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    
    paymentMethod: order.paymentMethod || 'card',
    notes: 'Thank you for your business!'
  };
  
  return invoice;
}

// ============ CALCULATE TAX ============
function calculateTax(amount, countryCode) {
  const rate = taxRates[countryCode] || taxRates.default;
  return {
    subtotal: amount,
    taxRate: rate,
    taxAmount: amount * rate,
    total: amount * (1 + rate)
  };
}

// ============ CONVERT CURRENCY ============
function convertCurrency(amount, fromCurrency, toCurrency) {
  const from = currencies[fromCurrency] || currencies.EUR;
  const to = currencies[toCurrency] || currencies.EUR;
  
  // Convert to EUR first, then to target
  const inEur = amount / from.rate;
  const converted = inEur * to.rate;
  
  return {
    from: fromCurrency,
    to: toCurrency,
    originalAmount: amount,
    convertedAmount: converted.toFixed(2),
    symbol: to.symbol
  };
}

// ============ REFUND ============
async function processRefund(paymentId, amount, reason) {
  const refund = {
    id: 're_' + Date.now(),
    paymentId,
    amount,
    status: 'succeeded',
    reason,
    created: new Date().toISOString()
  };
  
  return {
    success: true,
    refundId: refund.id,
    amount: amount,
    message: 'Refund processed successfully'
  };
}

// ============ SUBSCRIPTION ============
async function createSubscription(planId, customerEmail) {
  const plan = stripeConfig.plans[planId] || stripeConfig.plans.basic;
  
  const subscription = {
    id: 'sub_' + Date.now(),
    plan: planId,
    customer: customerEmail,
    status: 'active',
    currentPeriodStart: Date.now(),
    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
    amount: plan.price / 100,
    currency: 'EUR'
  };
  
  return {
    success: true,
    subscription
  };
}

// ============ EXPORT FOR ROUTES ============
module.exports = {
  stripeConfig,
  paypalConfig,
  taxRates,
  currencies,
  createStripePayment,
  createPayPalOrder,
  generateInvoice,
  calculateTax,
  convertCurrency,
  processRefund,
  createSubscription
};