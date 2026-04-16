/**
 * E-GARRAGE - CUSTOM CONFIGURATION
 * Replace with your real information
 */

module.exports = {
  // ==================== COMPANY INFO ====================
  company: {
    name: 'E-GARRAGE',
    tagline: 'Next-Gen Automotive Platform',
    slogan: 'Drive the Future',
    
    // YOUR REAL INFORMATION HERE
    email: 'contact@egarage.com',
    phone: '+225 07 00 00 0000', // Your phone number
    whatsapp: '+225 07 00 00 0000',
    website: 'https://egarage.com',
    
    address: 'Abidjan, Côte d\'Ivoire',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    
    // Social Media
    facebook: 'https://facebook.com/egarage',
    instagram: 'https://instagram.com/egarage',
    twitter: 'https://twitter.com/egarage',
    linkedin: 'https://linkedin.com/company/egarage',
    youtube: 'https://youtube.com/@egarage',
    
    // Business Hours
    hours: '24/7 AI Support | Mon-Fri: 9AM-6PM GMT',
    timezone: 'Africa/Abidjan'
  },
  
  // ==================== FOUNDER INFO ====================
  founder: {
    name: '[YOUR NAME]',
    title: 'Founder & CEO',
    bio: 'Visionary leader transforming the automotive industry with AI-powered solutions.',
    photo: '/images/founder.jpg',
    linkedin: 'https://linkedin.com/in/yourprofile',
    email: 'founder@egarage.com'
  },
  
  // ==================== TEAM MEMBERS ====================
  team: [
    {
      name: '[CTO NAME]',
      role: 'Chief Technology Officer',
      bio: 'AI & Tech Expert',
      photo: '/images/team/cto.jpg'
    },
    {
      name: '[COO NAME]',
      role: 'Chief Operations Officer',
      bio: 'Operations & Logistics Expert',
      photo: '/images/team/coo.jpg'
    },
    {
      name: '[CMO NAME]',
      role: 'Chief Marketing Officer',
      bio: 'Growth & Brand Expert',
      photo: '/images/team/cmo.jpg'
    }
  ],
  
  // ==================== BUSINESS INFO ====================
  business: {
    // Tax information
    taxId: 'YOUR TAX ID',
    vatRate: 0.18, // 18% for Côte d'Ivoire
    
    // Currency (XOF = West African Franc)
    currency: 'XOF',
    currencySymbol: 'XOF',
    currencyName: 'Franc CFA',
    
    // Payment info
    paymentEmail: 'payments@egarage.com',
    bankName: 'YOUR BANK',
    bankAccount: 'YOUR ACCOUNT NUMBER',
    
    // Registration
    registeredYear: 2024,
    rccm: 'YOUR RCCM NUMBER',
    ncc: 'YOUR NCC NUMBER'
  },
  
  // ==================== SHIPPING ====================
  shipping: {
    freeShippingThreshold: 50000, // XOF
    standardDays: '5-10 jours',
    expressDays: '2-3 jours',
    freeZones: ['Abidjan', 'Bouaké', 'Yamoussoukro'],
    countries: ['Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Togo', 'Bénin']
  },
  
  // ==================== LEGAL ====================
  legal: {
    privacyPolicyUrl: '/privacy',
    termsUrl: '/terms',
    refundUrl: '/refund-policy',
    cookiesUrl: '/cookies',
    
    // Legal entity
    companyName: '[YOUR COMPANY NAME]',
    address: 'YOUR FULL ADDRESS',
    rccm: 'RCCM NUMBER',
    ncc: 'NCC NUMBER'
  },
  
  // ==================== SUPPORT ====================
  support: {
    email: 'support@egarage.com',
    phone: '+225 07 00 00 0000',
    whatsapp: 'https://wa.me/2250700000000',
    ticketingUrl: 'https://support.egarage.com',
    
    // Response times
    responseTime: '24-48 hours',
    liveChatHours: '24/7'
  },
  
  // ==================== API KEYS (SET VIA ENV) ====================
  apiKeys: {
    // Set these as environment variables
    stripeSecret: process.env.STRIPE_SECRET_KEY,
    stripePublishable: process.env.STRIPE_PUBLISHABLE_KEY,
    paypalClient: process.env.PAYPAL_CLIENT_ID,
    paypalSecret: process.env.PAYPAL_CLIENT_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    twilioSid: process.env.TWILIO_ACCOUNT_SID,
    twilioToken: process.env.TWILIO_AUTH_TOKEN,
    openaiKey: process.env.OPENAI_API_KEY
  }
};