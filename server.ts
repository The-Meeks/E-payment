import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb } from './server/db';
import { User, Merchant, MerchantProfile, MerchantStaff, Transaction, FAQ, SupportTicket, TicketMessage, Notification, SystemSettings } from './server/types';
import { PaymentServiceFactory, formatPhoneNumber } from './server/payment';

// Extend Express Request interface to include our custom session user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Simple Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Bearer Token Context Loader (Highly resilient for Iframe sandboxes)
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userId = authHeader.split(' ')[1];
      const db = getDb();
      const user = db.users.find(u => u.id === userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  });

  // Auth Middleware Helpers
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator' });
    }
    next();
  };

  const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      }
      next();
    };
  };

  // ---------------------------------------------------------------------------
  // AUTH API ENDPOINTS
  // ---------------------------------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Phone format check
    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 10) {
      return res.status(400).json({ error: 'Invalid Kenyan phone number format' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: password, // Simple plain text or simulated hashing
      firstName,
      lastName,
      role: 'merchant',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create associated Draft Merchant account
    const merchantId = 'mer_' + Math.random().toString(36).substr(2, 9);
    const merchantCode = 'PH' + Math.floor(100 + Math.random() * 900); // e.g. PH829
    
    const newMerchant: Merchant = {
      id: merchantId,
      ownerId: userId,
      merchantCode,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create empty associated Profile
    const newProfile: MerchantProfile = {
      id: 'prof_' + Math.random().toString(36).substr(2, 9),
      merchantId,
      businessName: `${firstName}'s Venture`,
      businessCategory: 'Retail',
      businessType: 'Sole Proprietor',
      description: 'Facilitating seamless payments via PayHub Direct Settlement.',
      county: 'Nairobi',
      city: 'Nairobi',
      physicalAddress: 'Nairobi HQ',
      businessEmail: email.toLowerCase(),
      businessPhone: formattedPhone,
      logoUrl: null,
      mpesaShortcode: '174379',
      mpesaType: 'till',
      mpesaConsumerKey: '',
      mpesaConsumerSecret: '',
      mpesaPasskey: '',
      airtelMerchantId: '',
      airtelClientId: '',
      airtelClientSecret: '',
      themeColor: '#16A34A',
      receiptFooter: `Thank you for shopping! Powered by PayHub.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create staff owner link
    const newStaff: MerchantStaff = {
      id: 'stf_' + Math.random().toString(36).substr(2, 9),
      merchantId,
      userId,
      role: 'owner',
      permissions: ['all_permissions'],
      status: 'active',
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.merchants.push(newMerchant);
    db.merchantProfiles.push(newProfile);
    db.merchantStaff.push(newStaff);

    // Platform audit log
    db.activityLogs.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      userId,
      userEmail: email,
      action: 'Register Merchant',
      details: `Created account for user ${email} with merchant code ${merchantCode}`,
      ipAddress: '127.0.0.1',
      device: 'Express Server SDK',
      createdAt: new Date().toISOString()
    });

    saveDb(db);

    res.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      },
      merchantCode
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator' });
    }

    // Identify associated merchant if any
    let merchantCode = '';
    if (user.role === 'merchant') {
      const merchant = db.merchants.find(m => m.ownerId === user.id);
      if (merchant) {
        merchantCode = merchant.merchantCode;
      }
    } else if (user.role === 'staff') {
      const staffLink = db.merchantStaff.find(s => s.userId === user.id && s.status === 'active');
      if (staffLink) {
        const merchant = db.merchants.find(m => m.id === staffLink.merchantId);
        if (merchant) {
          merchantCode = merchant.merchantCode;
        }
      }
    }

    res.json({
      message: 'Login successful',
      token: user.id, // Using userId as transparent Bearer token in the sandbox
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      merchantCode
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const db = getDb();
    let merchantCode = '';
    let merchantId = '';
    let merchantStatus = '';

    if (req.user!.role === 'merchant') {
      const merchant = db.merchants.find(m => m.ownerId === req.user!.id);
      if (merchant) {
        merchantCode = merchant.merchantCode;
        merchantId = merchant.id;
        merchantStatus = merchant.status;
      }
    } else if (req.user!.role === 'staff') {
      const staffLink = db.merchantStaff.find(s => s.userId === req.user!.id && s.status === 'active');
      if (staffLink) {
        const merchant = db.merchants.find(m => m.id === staffLink.merchantId);
        if (merchant) {
          merchantCode = merchant.merchantCode;
          merchantId = merchant.id;
          merchantStatus = merchant.status;
        }
      }
    }

    res.json({
      user: req.user,
      merchantCode,
      merchantId,
      merchantStatus
    });
  });

  // ---------------------------------------------------------------------------
  // MERCHANT DASHBOARD & PROFILE API
  // ---------------------------------------------------------------------------
  app.get('/api/merchant/profile', requireAuth, (req, res) => {
    const db = getDb();
    
    // Find merchant this user is owner or staff of
    let merchant: Merchant | undefined;
    if (req.user!.role === 'merchant') {
      merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    } else if (req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id);
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const profile = db.merchantProfiles.find(p => p.merchantId === merchant!.id);
    res.json({
      merchant,
      profile
    });
  });

  app.put('/api/merchant/profile', requireAuth, (req, res) => {
    const db = getDb();
    
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id && ['owner', 'manager'].includes(s.role));
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized profile access' });
    }

    const profileIdx = db.merchantProfiles.findIndex(p => p.merchantId === merchant!.id);
    if (profileIdx === -1) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = db.merchantProfiles[profileIdx];
    const { 
      businessName, businessCategory, businessType, description, 
      county, city, physicalAddress, businessEmail, businessPhone, 
      logoUrl, mpesaShortcode, mpesaType, mpesaConsumerKey, mpesaConsumerSecret, mpesaPasskey,
      airtelMerchantId, airtelClientId, airtelClientSecret, themeColor, receiptFooter,
      submitForReview
    } = req.body;

    // Build the updated profile
    db.merchantProfiles[profileIdx] = {
      ...profile,
      businessName: businessName || profile.businessName,
      businessCategory: businessCategory || profile.businessCategory,
      businessType: businessType || profile.businessType,
      description: description || profile.description,
      county: county || profile.county,
      city: city || profile.city,
      physicalAddress: physicalAddress || profile.physicalAddress,
      businessEmail: businessEmail || profile.businessEmail,
      businessPhone: businessPhone || profile.businessPhone,
      logoUrl: logoUrl !== undefined ? logoUrl : profile.logoUrl,
      mpesaShortcode: mpesaShortcode || profile.mpesaShortcode,
      mpesaType: mpesaType || profile.mpesaType,
      mpesaConsumerKey: mpesaConsumerKey !== undefined ? mpesaConsumerKey : profile.mpesaConsumerKey,
      mpesaConsumerSecret: mpesaConsumerSecret !== undefined ? mpesaConsumerSecret : profile.mpesaConsumerSecret,
      mpesaPasskey: mpesaPasskey !== undefined ? mpesaPasskey : profile.mpesaPasskey,
      airtelMerchantId: airtelMerchantId !== undefined ? airtelMerchantId : profile.airtelMerchantId,
      airtelClientId: airtelClientId !== undefined ? airtelClientId : profile.airtelClientId,
      airtelClientSecret: airtelClientSecret !== undefined ? airtelClientSecret : profile.airtelClientSecret,
      themeColor: themeColor || profile.themeColor,
      receiptFooter: receiptFooter || profile.receiptFooter,
      updatedAt: new Date().toISOString()
    };

    // If the merchant submitted for review and was draft, update status to submitted
    if (submitForReview && merchant.status === 'draft') {
      const merchIdx = db.merchants.findIndex(m => m.id === merchant!.id);
      db.merchants[merchIdx].status = 'submitted';
      db.merchants[merchIdx].updatedAt = new Date().toISOString();
      merchant.status = 'submitted';
    }

    // Log action
    db.activityLogs.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'Business Profile Updates',
      details: `Updated details for ${businessName || profile.businessName} (Submitted: ${submitForReview || 'No'})`,
      ipAddress: '127.0.0.1',
      device: 'Web Client',
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({
      message: 'Profile updated successfully',
      merchant,
      profile: db.merchantProfiles[profileIdx]
    });
  });

  // ---------------------------------------------------------------------------
  // MERCHANT DASHBOARD ANALYTICS & STATS
  // ---------------------------------------------------------------------------
  app.get('/api/merchant/dashboard', requireAuth, (req, res) => {
    const db = getDb();
    
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id);
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized dashboard access' });
    }

    // Retrieve all transactions for this merchant
    const merchantTxs = db.transactions.filter(tx => tx.merchantId === merchant!.id);

    // Calculate metrics
    const successfulTxs = merchantTxs.filter(tx => tx.status === 'successful');
    const totalRevenue = successfulTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const todayStr = new Date().toISOString().substring(0, 10);
    const revenueToday = successfulTxs
      .filter(tx => tx.createdAt.substring(0, 10) === todayStr)
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Seven days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const revenueThisWeek = successfulTxs
      .filter(tx => new Date(tx.createdAt) >= weekAgo)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const revenueThisMonth = successfulTxs
      .filter(tx => new Date(tx.createdAt) >= monthAgo)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalTransactions = merchantTxs.length;
    const successfulCount = successfulTxs.length;
    const pendingCount = merchantTxs.filter(tx => tx.status === 'processing').length;
    const failedCount = merchantTxs.filter(tx => ['failed', 'cancelled', 'expired'].includes(tx.status)).length;

    // Recent 10 transactions
    const recentTransactions = [...merchantTxs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    res.json({
      metrics: {
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        totalRevenue,
        totalTransactions,
        successfulCount,
        pendingCount,
        failedCount
      },
      recentTransactions
    });
  });

  // ---------------------------------------------------------------------------
  // TEAM MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------------------------
  app.get('/api/merchant/team', requireAuth, (req, res) => {
    const db = getDb();
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id);
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized team view' });
    }

    const team = db.merchantStaff
      .filter(s => s.merchantId === merchant!.id)
      .map(s => {
        const u = db.users.find(usr => usr.id === s.userId);
        return {
          id: s.id,
          userId: s.userId,
          firstName: u?.firstName || '',
          lastName: u?.lastName || '',
          email: u?.email || '',
          role: s.role,
          permissions: s.permissions,
          status: s.status,
          invitedAt: s.invitedAt,
          acceptedAt: s.acceptedAt
        };
      });

    res.json({ team });
  });

  app.post('/api/merchant/team/invite', requireAuth, (req, res) => {
    const { email, firstName, lastName, role, password } = req.body;
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDb();
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id && ['owner', 'manager'].includes(s.role));
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant) {
      return res.status(403).json({ error: 'Unauthorized to invite team members' });
    }

    // Verify if user already exists
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      // Check if already in the merchant staff
      const existingLink = db.merchantStaff.find(s => s.merchantId === merchant!.id && s.userId === user!.id);
      if (existingLink) {
        return res.status(400).json({ error: 'User is already a member of this team' });
      }
    } else {
      // Create new user for staff
      const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
      user = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash: password,
        firstName,
        lastName,
        role: 'staff',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(user);
    }

    const staffId = 'stf_' + Math.random().toString(36).substr(2, 9);
    const newStaff: MerchantStaff = {
      id: staffId,
      merchantId: merchant.id,
      userId: user.id,
      role: role,
      permissions: role === 'manager' ? ['view_transactions', 'manage_settings', 'invite_staff'] : ['view_transactions'],
      status: 'active',
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString() // auto-accepted for simulation convenience
    };

    db.merchantStaff.push(newStaff);
    
    // Notify staff
    db.notifications.push({
      id: 'ntf_' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      title: 'Welcome to the team!',
      message: `You have been added to ${db.merchantProfiles.find(p => p.merchantId === merchant!.id)?.businessName} as a ${role}.`,
      isRead: false,
      type: 'info',
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ message: 'Staff invited and added successfully', staff: newStaff });
  });

  // ---------------------------------------------------------------------------
  // TRANSACTIONS LIST & EXPORT
  // ---------------------------------------------------------------------------
  app.get('/api/transactions', requireAuth, (req, res) => {
    const db = getDb();
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id);
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    if (!merchant && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized transactions view' });
    }

    // Filter by merchant unless admin
    let txList = db.transactions;
    if (req.user!.role !== 'admin') {
      txList = db.transactions.filter(tx => tx.merchantId === merchant!.id);
    }

    // Sorting: default newest
    txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ transactions: txList });
  });

  // ---------------------------------------------------------------------------
  // SUPPORT TICKETS & CHAT
  // ---------------------------------------------------------------------------
  app.get('/api/support', requireAuth, (req, res) => {
    const db = getDb();
    let merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant && req.user!.role === 'staff') {
      const link = db.merchantStaff.find(s => s.userId === req.user!.id);
      if (link) {
        merchant = db.merchants.find(m => m.id === link.merchantId);
      }
    }

    let tickets = db.supportTickets;
    if (req.user!.role !== 'admin') {
      if (!merchant) return res.status(403).json({ error: 'Forbidden' });
      tickets = db.supportTickets.filter(t => t.merchantId === merchant!.id);
    }

    // Add merchant name for administration
    const hydratedTickets = tickets.map(t => {
      const prof = db.merchantProfiles.find(p => p.merchantId === t.merchantId);
      return {
        ...t,
        businessName: prof?.businessName || 'Unknown Merchant'
      };
    });

    res.json({ tickets: hydratedTickets });
  });

  app.post('/api/support', requireAuth, (req, res) => {
    const { subject, description, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const db = getDb();
    const merchant = db.merchants.find(m => m.ownerId === req.user!.id);
    if (!merchant) {
      return res.status(403).json({ error: 'Only merchants can submit support tickets' });
    }

    const ticketId = 'tkt_' + Math.random().toString(36).substr(2, 9);
    const newTicket: SupportTicket = {
      id: ticketId,
      merchantId: merchant.id,
      subject,
      description,
      status: 'open',
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const firstMsg: TicketMessage = {
      id: 'tmsg_' + Math.random().toString(36).substr(2, 9),
      ticketId,
      senderId: req.user!.id,
      senderName: `${req.user!.firstName} ${req.user!.lastName}`,
      senderRole: 'merchant',
      message: description,
      createdAt: new Date().toISOString()
    };

    db.supportTickets.push(newTicket);
    db.ticketMessages.push(firstMsg);
    saveDb(db);

    res.json({ message: 'Ticket submitted successfully', ticket: newTicket });
  });

  app.get('/api/support/:id', requireAuth, (req, res) => {
    const db = getDb();
    const ticket = db.supportTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check ownership
    if (req.user!.role !== 'admin') {
      const merchant = db.merchants.find(m => m.ownerId === req.user!.id);
      if (!merchant || ticket.merchantId !== merchant.id) {
        return res.status(403).json({ error: 'Unauthorized ticket access' });
      }
    }

    const messages = db.ticketMessages.filter(m => m.ticketId === ticket.id);
    res.json({ ticket, messages });
  });

  app.post('/api/support/:id/message', requireAuth, (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const db = getDb();
    const ticketIdx = db.supportTickets.findIndex(t => t.id === req.params.id);
    if (ticketIdx === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = db.supportTickets[ticketIdx];
    // Check ownership
    if (req.user!.role !== 'admin') {
      const merchant = db.merchants.find(m => m.ownerId === req.user!.id);
      if (!merchant || ticket.merchantId !== merchant.id) {
        return res.status(403).json({ error: 'Unauthorized ticket access' });
      }
    }

    const newMsg: TicketMessage = {
      id: 'tmsg_' + Math.random().toString(36).substr(2, 9),
      ticketId: ticket.id,
      senderId: req.user!.id,
      senderName: `${req.user!.firstName} ${req.user!.lastName}`,
      senderRole: req.user!.role,
      message,
      createdAt: new Date().toISOString()
    };

    db.ticketMessages.push(newMsg);
    
    // Update ticket status
    db.supportTickets[ticketIdx].status = req.user!.role === 'admin' ? 'pending' : 'open';
    db.supportTickets[ticketIdx].updatedAt = new Date().toISOString();

    saveDb(db);
    res.json({ message: 'Reply sent successfully', comment: newMsg });
  });

  // ---------------------------------------------------------------------------
  // PUBLIC CUSTOMER CHECKOUT ENDPOINTS (Instant & No-Auth)
  // ---------------------------------------------------------------------------
  app.get('/api/public/pay/:merchantCode', (req, res) => {
    const db = getDb();
    const merchant = db.merchants.find(m => m.merchantCode.toUpperCase() === req.params.merchantCode.toUpperCase());
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant code not found' });
    }

    if (merchant.status !== 'approved') {
      return res.status(403).json({ error: 'This merchant is not yet approved to collect payments via PayHub' });
    }

    const profile = db.merchantProfiles.find(p => p.merchantId === merchant.id);
    res.json({
      merchant: {
        id: merchant.id,
        merchantCode: merchant.merchantCode,
        status: merchant.status
      },
      profile: {
        businessName: profile?.businessName || '',
        description: profile?.description || '',
        logoUrl: profile?.logoUrl || null,
        themeColor: profile?.themeColor || '#16A34A',
        receiptFooter: profile?.receiptFooter || ''
      }
    });
  });

  app.post('/api/public/pay/:merchantCode', async (req, res) => {
    const { phone, amount, paymentMethod, reference } = req.body;

    if (!phone || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Phone, amount, and payment method are required' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number greater than zero' });
    }

    const db = getDb();
    const merchant = db.merchants.find(m => m.merchantCode.toUpperCase() === req.params.merchantCode.toUpperCase());
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (merchant.status !== 'approved') {
      return res.status(403).json({ error: 'Merchant payments suspended' });
    }

    const profile = db.merchantProfiles.find(p => p.merchantId === merchant.id);
    if (!profile) {
      return res.status(404).json({ error: 'Merchant profile configuration missing' });
    }

    try {
      // Direct Settlement - dynamically loading payment service
      const paymentService = PaymentServiceFactory.getService(paymentMethod);
      const result = await paymentService.initializePayment(profile, numAmount, phone, reference);

      res.json(result);
    } catch (err: any) {
      console.error('Payment initiation failure', err);
      res.status(500).json({ error: err.message || 'Payment engine failure' });
    }
  });

  // Safaricom M-Pesa STK Push Webhook Callback Receiver
  app.post('/api/public/pay/callback/mpesa', (req, res) => {
    console.log('[M-Pesa Webhook] Callback received:', JSON.stringify(req.body));
    
    try {
      const callbackData = req.body?.Body?.stkCallback;
      if (!callbackData) {
        console.warn('[M-Pesa Webhook] Invalid callback body format received.');
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid body format" });
      }

      const checkoutRequestId = callbackData.CheckoutRequestID;
      const resultCode = callbackData.ResultCode;
      const resultDesc = callbackData.ResultDesc;

      const db = getDb();
      const txIndex = db.transactions.findIndex(t => t.checkoutRequestId === checkoutRequestId);

      if (txIndex === -1) {
        console.warn(`[M-Pesa Webhook] Transaction with CheckoutRequestID ${checkoutRequestId} not found in database.`);
        return res.json({ ResultCode: 0, ResultDesc: "Success" }); // Accept callback anyways to stop Safaricom retries
      }

      const tx = db.transactions[txIndex];
      
      // If transaction is already finalised, do nothing
      if (tx.status !== 'processing') {
        console.log(`[M-Pesa Webhook] Transaction ${tx.id} is already finalised with status: ${tx.status}`);
        return res.json({ ResultCode: 0, ResultDesc: "Success" });
      }

      if (resultCode === 0) {
        // Success
        let receiptNumber = 'MP' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const metadataItems = callbackData.CallbackMetadata?.Item || [];
        
        const receiptItem = metadataItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
        if (receiptItem && receiptItem.Value) {
          receiptNumber = receiptItem.Value;
        }

        db.transactions[txIndex].status = 'successful';
        db.transactions[txIndex].receiptNumber = receiptNumber;
        db.transactions[txIndex].responseDescription = resultDesc || 'Payment settled successfully via M-Pesa STK Push.';
        db.transactions[txIndex].completedAt = new Date().toISOString();
        db.transactions[txIndex].callbackResponse = callbackData;

        // Add success notification
        db.notifications.push({
          id: 'ntf_' + Math.random().toString(36).substr(2, 9),
          userId: tx.merchantId,
          title: 'Payment Received (STK Direct)',
          message: `Received KES ${tx.amount.toLocaleString()} from ${tx.customerPhone} via M-Pesa. Receipt: ${receiptNumber}`,
          isRead: false,
          type: 'success',
          createdAt: new Date().toISOString()
        });

        console.log(`[M-Pesa Webhook] Transaction ${tx.id} updated to successful. Receipt: ${receiptNumber}`);
      } else {
        // Failed / Cancelled
        const isCancelled = resultCode === 1032;
        db.transactions[txIndex].status = isCancelled ? 'cancelled' : 'failed';
        db.transactions[txIndex].responseDescription = resultDesc || (isCancelled ? 'Cancelled by customer' : 'Payment request rejected');
        db.transactions[txIndex].completedAt = new Date().toISOString();
        db.transactions[txIndex].callbackResponse = callbackData;

        console.log(`[M-Pesa Webhook] Transaction ${tx.id} marked as ${db.transactions[txIndex].status}. Reason: ${resultDesc}`);
      }

      saveDb(db);
      return res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (err: any) {
      console.error('[M-Pesa Webhook] Error processing callback:', err);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal server error" });
    }
  });

  // Poll for payment completion
  app.get('/api/public/pay/status/:checkoutRequestId', (req, res) => {
    const db = getDb();
    const tx = db.transactions.find(t => t.checkoutRequestId === req.params.checkoutRequestId);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction checkout ID not found' });
    }
    res.json({
      status: tx.status,
      receiptNumber: tx.receiptNumber,
      amount: tx.amount,
      customerPhone: tx.customerPhone,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
      responseDescription: tx.responseDescription
    });
  });

  // ---------------------------------------------------------------------------
  // ADMINISTRATOR CONTROLLER ENDPOINTS
  // ---------------------------------------------------------------------------
  app.get('/api/admin/dashboard', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    
    const merchantsCount = db.merchants.length;
    const pendingApprovals = db.merchants.filter(m => m.status === 'submitted').length;
    const activeMerchants = db.merchants.filter(m => m.status === 'approved').length;
    const suspendedMerchants = db.merchants.filter(m => m.status === 'suspended').length;
    
    const allTxs = db.transactions;
    const successfulTxs = allTxs.filter(t => t.status === 'successful');
    const totalVolume = successfulTxs.reduce((sum, t) => sum + t.amount, 0);
    const successfulCount = successfulTxs.length;
    const failedCount = allTxs.filter(t => ['failed', 'cancelled', 'expired'].includes(t.status)).length;
    
    const openTickets = db.supportTickets.filter(t => t.status === 'open').length;

    res.json({
      metrics: {
        merchantsCount,
        pendingApprovals,
        activeMerchants,
        suspendedMerchants,
        totalTransactions: allTxs.length,
        successfulCount,
        failedCount,
        totalVolume,
        openTickets
      },
      systemSettings: db.systemSettings
    });
  });

  app.get('/api/admin/merchants', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    const results = db.merchants.map(m => {
      const profile = db.merchantProfiles.find(p => p.merchantId === m.id);
      const owner = db.users.find(u => u.id === m.ownerId);
      const txs = db.transactions.filter(t => t.merchantId === m.id && t.status === 'successful');
      const revenue = txs.reduce((sum, t) => sum + t.amount, 0);

      return {
        id: m.id,
        merchantCode: m.merchantCode,
        status: m.status,
        createdAt: m.createdAt,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'N/A',
        ownerEmail: owner?.email || 'N/A',
        businessName: profile?.businessName || 'No business name set',
        businessCategory: profile?.businessCategory || 'N/A',
        transactionCount: txs.length,
        revenue
      };
    });

    res.json({ merchants: results });
  });

  app.put('/api/admin/merchant/:id/status', requireAuth, requireRole(['admin']), (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const db = getDb();
    const idx = db.merchants.findIndex(m => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const previousStatus = db.merchants[idx].status;
    db.merchants[idx].status = status;
    db.merchants[idx].updatedAt = new Date().toISOString();

    const merchant = db.merchants[idx];
    const profile = db.merchantProfiles.find(p => p.merchantId === merchant.id);

    // Notify merchant owner
    db.notifications.push({
      id: 'ntf_' + Math.random().toString(36).substr(2, 9),
      userId: merchant.ownerId,
      title: `Merchant Status Update`,
      message: `Your PayHub merchant profile for ${profile?.businessName || 'your business'} status has been set to ${status.toUpperCase()}.`,
      isRead: false,
      type: status === 'approved' ? 'success' : status === 'suspended' ? 'alert' : 'warning',
      createdAt: new Date().toISOString()
    });

    // Audit log
    db.activityLogs.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'Merchant Approval Decision',
      details: `Updated status of merchant ${profile?.businessName || merchant.merchantCode} from ${previousStatus} to ${status}.`,
      ipAddress: '127.0.0.1',
      device: 'Admin Console',
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ message: `Merchant status updated successfully to ${status}` });
  });

  app.get('/api/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    const usersList = db.users.map(u => {
      let businessName = 'N/A';
      if (u.role === 'merchant') {
        const m = db.merchants.find(merch => merch.ownerId === u.id);
        if (m) {
          const prof = db.merchantProfiles.find(p => p.merchantId === m.id);
          businessName = prof?.businessName || 'Draft Profile';
        }
      } else if (u.role === 'staff') {
        const link = db.merchantStaff.find(s => s.userId === u.id);
        if (link) {
          const prof = db.merchantProfiles.find(p => p.merchantId === link.merchantId);
          businessName = `${prof?.businessName || 'Team'} (${link.role})`;
        }
      }
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        businessName,
        createdAt: u.createdAt
      };
    });
    res.json({ users: usersList });
  });

  app.put('/api/admin/user/:id/status', requireAuth, requireRole(['admin']), (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const db = getDb();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.users[idx].status = status;
    db.users[idx].updatedAt = new Date().toISOString();

    // Log action
    db.activityLogs.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'User Account Access Change',
      details: `Modified status of user ${db.users[idx].email} to ${status}`,
      ipAddress: '127.0.0.1',
      device: 'Admin Console',
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ message: `User status updated to ${status}` });
  });

  app.get('/api/admin/settings', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    res.json({ settings: db.systemSettings });
  });

  app.put('/api/admin/settings', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    db.systemSettings = {
      ...db.systemSettings,
      ...req.body
    };
    saveDb(db);
    res.json({ message: 'System settings saved', settings: db.systemSettings });
  });

  // FAQS API
  app.get('/api/admin/faqs', (req, res) => {
    const db = getDb();
    res.json({ faqs: db.faqs });
  });

  app.post('/api/admin/faqs', requireAuth, requireRole(['admin']), (req, res) => {
    const { question, answer, isPublished } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const db = getDb();
    const newFaq: FAQ = {
      id: 'faq_' + Math.random().toString(36).substr(2, 9),
      question,
      answer,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.faqs.push(newFaq);
    saveDb(db);
    res.json({ message: 'FAQ created successfully', faq: newFaq });
  });

  app.put('/api/admin/faqs/:id', requireAuth, requireRole(['admin']), (req, res) => {
    const { question, answer, isPublished } = req.body;
    const db = getDb();
    const idx = db.faqs.findIndex(f => f.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    db.faqs[idx] = {
      ...db.faqs[idx],
      question: question || db.faqs[idx].question,
      answer: answer || db.faqs[idx].answer,
      isPublished: isPublished !== undefined ? isPublished : db.faqs[idx].isPublished,
      updatedAt: new Date().toISOString()
    };
    saveDb(db);
    res.json({ message: 'FAQ updated successfully', faq: db.faqs[idx] });
  });

  app.delete('/api/admin/faqs/:id', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    const idx = db.faqs.findIndex(f => f.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    db.faqs.splice(idx, 1);
    saveDb(db);
    res.json({ message: 'FAQ deleted successfully' });
  });

  app.get('/api/admin/logs', requireAuth, requireRole(['admin']), (req, res) => {
    const db = getDb();
    res.json({ logs: db.activityLogs });
  });

  // ---------------------------------------------------------------------------
  // GLOBAL METADATA / NOTIFICATIONS & UTILITY ENDPOINTS
  // ---------------------------------------------------------------------------
  app.get('/api/merchant/notifications', requireAuth, (req, res) => {
    const db = getDb();
    const list = db.notifications.filter(n => n.userId === req.user!.id || n.userId === 'all');
    res.json({ notifications: list });
  });

  app.post('/api/merchant/notifications/:id/read', requireAuth, (req, res) => {
    const db = getDb();
    const idx = db.notifications.findIndex(n => n.id === req.params.id && (n.userId === req.user!.id || n.userId === 'all'));
    if (idx !== -1) {
      db.notifications[idx].isRead = true;
      saveDb(db);
    }
    res.json({ success: true });
  });

  app.get('/api/merchant/logs', requireAuth, (req, res) => {
    const db = getDb();
    const list = db.activityLogs.filter(log => log.userId === req.user!.id);
    res.json({ logs: list });
  });

  // ---------------------------------------------------------------------------
  // VITE DEV SERVER & PRODUCTION ASSETS ROUTER
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PayHub Server] API Engine & Payment Gateways running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error on server startup:', err);
});
