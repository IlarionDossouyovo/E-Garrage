/**
 * E-GARRAGE - CUSTOM CONFIGURATION
 * YOUR REAL INFORMATION
 */

module.exports = {
  // ==================== COMPANY INFO ====================
  company: {
    name: 'E-GARRAGE',
    tagline: 'Next-Gen Automotive Platform',
    slogan: 'Drive the Future',
    
    // YOUR REAL INFORMATION
    email: 'electronbusiness@gmail.com',
    phone: '+229 01 977 003 47',
    phoneAlt: '+229 01 498 022 02',
    whatsapp: '+229 01 977 003 47',
    website: 'https://e-garrage.com',
    
    address: 'Cotonou, Bénin',
    city: 'Cotonou',
    country: 'Bénin',
    countryCode: 'BJ',
    
    // Social Media
    facebook: 'https://facebook.com/egarage',
    instagram: 'https://instagram.com/egarage',
    twitter: 'https://twitter.com/egarage',
    linkedin: 'https://linkedin.com/company/egarage',
    youtube: 'https://youtube.com/@egarage',
    
    // Business Hours
    hours: '24/7 AI Support | Mon-Fri: 8AM-6PM GMT+1',
    timezone: 'Africa/Porto-Novo'
  },
  
  // ==================== FOUNDER INFO ====================
  founder: {
    name: 'DOSSOU-YOVO ATTIOGBE A.Y. Ilarion',
    title: 'Founder & CEO',
    bio: 'Visionary leader transforming the automotive industry in Africa with AI-powered solutions.',
    photo: '/images/founder.jpg',
    linkedin: 'https://linkedin.com/in/ilarion-dossou-yovo',
    email: 'electronbusiness@gmail.com'
  },
  
  // ==================== TEAM MEMBERS ====================
  team: [],
  
  // ==================== BUSINESS INFO ====================
  business: {
    // Tax information (Bénin)
    taxId: '',
    vatRate: 0.18, // 18% TVA Benin
    
    // Currency (XOF = West African Franc - BCEAO)
    currency: 'XOF',
    currencySymbol: 'XOF',
    currencyName: 'Franc CFA',
    
    // Payment info
    paymentEmail: 'electronbusiness@gmail.com',
    bankName: '',
    bankAccount: '',
    
    // Registration
    registeredYear: 2024,
    rccm: '',
    ncc: ''
  },
  
  // ==================== SHIPPING ====================
  shipping: {
    freeShippingThreshold: 50000, // XOF
    standardDays: '5-10 jours',
    expressDays: '2-3 jours',
    freeZones: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo'],
    countries: ['Bénin', 'Togo', 'Niger', 'Burkina Faso', 'Sénégal', 'Mali']
  },
  
  // ==================== LEGAL ====================
  legal: {
    privacyPolicyUrl: '/privacy',
    termsUrl: '/terms',
    refundUrl: '/refund-policy',
    cookiesUrl: '/cookies',
    
    // Legal entity
    companyName: 'E-GARRAGE',
    address: 'Cotonou, République du Bénin',
    rccm: '',
    ncc: ''
  },
  
  // ==================== SUPPORT ====================
  support: {
    email: 'electronbusiness@gmail.com',
    phone: '+229 01 977 003 47',
    whatsapp: 'https://wa.me/2290197700347',
    ticketingUrl: 'https://support.e-garrage.com',
    
    // Response times
    responseTime: '24-48 heures',
    liveChatHours: '24/7'
  },
  
  // ==================== API KEYS (SET VIA ENV) ====================
  apiKeys: {
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