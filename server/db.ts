import fs from 'fs';
import path from 'path';
import { 
  User, Merchant, MerchantProfile, MerchantStaff, Transaction, 
  Notification, ActivityLog, SupportTicket, TicketMessage, FAQ, SystemSettings 
} from './types';

const DB_FILE = path.join(process.cwd(), 'payhub_db.json');

export interface DatabaseSchema {
  users: User[];
  merchants: Merchant[];
  merchantProfiles: MerchantProfile[];
  merchantStaff: MerchantStaff[];
  transactions: Transaction[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  supportTickets: SupportTicket[];
  ticketMessages: TicketMessage[];
  faqs: FAQ[];
  systemSettings: SystemSettings;
}

// Simple in-memory fallback + persistence helper
let dbCached: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbCached) return dbCached;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCached = JSON.parse(content);
      return dbCached!;
    } catch (err) {
      console.error('Error reading database file, resetting to seed data...', err);
    }
  }

  // If file doesn't exist or failed to load, initialize seed data
  dbCached = getSeedData();
  saveDb(dbCached);
  return dbCached;
}

export function saveDb(data: DatabaseSchema): void {
  dbCached = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to database file', err);
  }
}

function getSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  
  // Create beautiful, realistic historical date strings
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  const users: User[] = [
    {
      id: 'usr_admin',
      email: 'admin@payhub.co.ke',
      passwordHash: 'admin123', // Clean hash or plain text for easy testing
      firstName: 'Dominic',
      lastName: 'Kiprop',
      role: 'admin',
      status: 'active',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: 'usr_merchant_abc',
      email: 'merchant@payhub.co.ke',
      passwordHash: 'merchant123',
      firstName: 'Nelly',
      lastName: 'Mutua',
      role: 'merchant',
      status: 'active',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
    {
      id: 'usr_merchant_xyz',
      email: 'fashion@payhub.co.ke',
      passwordHash: 'fashion123',
      firstName: 'Brian',
      lastName: 'Ondego',
      role: 'merchant',
      status: 'active',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: 'usr_staff_cashier',
      email: 'cashier@abcelectronics.co.ke',
      passwordHash: 'cashier123',
      firstName: 'John',
      lastName: 'Kamau',
      role: 'staff',
      status: 'active',
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    }
  ];

  const merchants: Merchant[] = [
    {
      id: 'mer_abc',
      ownerId: 'usr_merchant_abc',
      merchantCode: 'ABC',
      status: 'approved',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(14),
    },
    {
      id: 'mer_xyz',
      ownerId: 'usr_merchant_xyz',
      merchantCode: 'XYZ',
      status: 'submitted',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    }
  ];

  const merchantProfiles: MerchantProfile[] = [
    {
      id: 'prof_abc',
      merchantId: 'mer_abc',
      businessName: 'ABC Electronics Ltd',
      businessCategory: 'Electronics & IT',
      businessType: 'Retailer',
      description: 'Your premium partner for high-end electronic gadgets, computer accessories, and mobile hardware solutions in Nairobi.',
      county: 'Nairobi',
      city: 'Nairobi',
      physicalAddress: 'Luthuli Avenue, Junction Plaza Shop 14G',
      businessEmail: 'info@abcelectronics.co.ke',
      businessPhone: '+254712345678',
      logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&auto=format&fit=crop&q=80',
      mpesaShortcode: '174379', // standard sandbox paybill
      mpesaType: 'till',
      mpesaConsumerKey: 'gA0vWbZ592Vb0a9rL6r8fO7xW8rG6vQ9',
      mpesaConsumerSecret: '9Z9v7A8b7R6yT5uI',
      mpesaPasskey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      airtelMerchantId: '987654321',
      airtelClientId: 'client_abc_987',
      airtelClientSecret: 'secret_abc_123_xyz',
      themeColor: '#16A34A',
      receiptFooter: 'Thank you for shopping with ABC Electronics! PayHub Direct Settlement.',
      createdAt: daysAgo(15),
      updatedAt: daysAgo(14),
    },
    {
      id: 'prof_xyz',
      merchantId: 'mer_xyz',
      businessName: 'XYZ Boutique & Fashion House',
      businessCategory: 'Clothing & Apparel',
      businessType: 'Sole Proprietor',
      description: 'Handcrafted African designer wear, modern urban collections, and custom tailors in Mombasa.',
      county: 'Mombasa',
      city: 'Mombasa',
      physicalAddress: 'Nyali Center, 1st Floor Shop 3B',
      businessEmail: 'sales@xyzboutique.co.ke',
      businessPhone: '+254722334455',
      logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=128&auto=format&fit=crop&q=80',
      mpesaShortcode: '174380',
      mpesaType: 'paybill',
      mpesaConsumerKey: 'key_xyz_998',
      mpesaConsumerSecret: 'sec_xyz_776',
      mpesaPasskey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      airtelMerchantId: '11223344',
      airtelClientId: 'client_xyz_221',
      airtelClientSecret: 'secret_xyz_887',
      themeColor: '#4F46E5',
      receiptFooter: 'Style speaks! Thank you for buying from XYZ Boutique.',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    }
  ];

  const merchantStaff: MerchantStaff[] = [
    {
      id: 'stf_abc_owner',
      merchantId: 'mer_abc',
      userId: 'usr_merchant_abc',
      role: 'owner',
      permissions: ['all_permissions'],
      status: 'active',
      invitedAt: daysAgo(15),
      acceptedAt: daysAgo(15),
    },
    {
      id: 'stf_abc_cashier',
      merchantId: 'mer_abc',
      userId: 'usr_staff_cashier',
      role: 'cashier',
      permissions: ['view_transactions', 'receive_payments'],
      status: 'active',
      invitedAt: daysAgo(10),
      acceptedAt: daysAgo(10),
    }
  ];

  // Beautiful real transactions for ABC Electronics
  const transactions: Transaction[] = [
    {
      id: 'tx_001',
      merchantId: 'mer_abc',
      customerPhone: '254711223344',
      customerReference: 'INV-2026-001',
      amount: 1500,
      paymentMethod: 'mpesa',
      status: 'successful',
      receiptNumber: 'SLK9A8F5H1',
      checkoutRequestId: 'ws_CO_260620261122334455',
      merchantRequestId: '12345-67890-11',
      responseDescription: 'Success',
      callbackResponse: { ResultCode: 0, ResultDesc: 'The service request is processed successfully.' },
      createdAt: daysAgo(6),
      completedAt: daysAgo(6),
    },
    {
      id: 'tx_002',
      merchantId: 'mer_abc',
      customerPhone: '254722334455',
      customerReference: 'INV-2026-002',
      amount: 4500,
      paymentMethod: 'mpesa',
      status: 'successful',
      receiptNumber: 'SLK9D8C2S8',
      checkoutRequestId: 'ws_CO_260620262233445566',
      merchantRequestId: '12345-67890-12',
      responseDescription: 'Success',
      callbackResponse: { ResultCode: 0, ResultDesc: 'Success' },
      createdAt: daysAgo(5),
      completedAt: daysAgo(5),
    },
    {
      id: 'tx_003',
      merchantId: 'mer_abc',
      customerPhone: '254712345678',
      customerReference: 'INV-2026-003',
      amount: 12000,
      paymentMethod: 'airtel',
      status: 'successful',
      receiptNumber: 'AM12345678',
      checkoutRequestId: 'airtel_chk_8829910',
      merchantRequestId: null,
      responseDescription: 'Success',
      callbackResponse: { status: 'SUCCESS' },
      createdAt: daysAgo(4),
      completedAt: daysAgo(4),
    },
    {
      id: 'tx_004',
      merchantId: 'mer_abc',
      customerPhone: '254788776655',
      customerReference: 'INV-2026-004',
      amount: 3200,
      paymentMethod: 'mpesa',
      status: 'failed',
      receiptNumber: null,
      checkoutRequestId: 'ws_CO_260620263344556677',
      merchantRequestId: '12345-67890-13',
      responseDescription: 'Request cancelled by user',
      callbackResponse: { ResultCode: 1032, ResultDesc: 'Request cancelled by user' },
      createdAt: daysAgo(3),
      completedAt: daysAgo(3),
    },
    {
      id: 'tx_005',
      merchantId: 'mer_abc',
      customerPhone: '254799887766',
      customerReference: 'INV-2026-005',
      amount: 9500,
      paymentMethod: 'mpesa',
      status: 'successful',
      receiptNumber: 'SLK3K8D2K0',
      checkoutRequestId: 'ws_CO_260620264455667788',
      merchantRequestId: '12345-67890-14',
      responseDescription: 'Success',
      callbackResponse: { ResultCode: 0, ResultDesc: 'Success' },
      createdAt: daysAgo(2),
      completedAt: daysAgo(2),
    },
    {
      id: 'tx_006',
      merchantId: 'mer_abc',
      customerPhone: '254711223344',
      customerReference: 'INV-2026-006',
      amount: 500,
      paymentMethod: 'mpesa',
      status: 'successful',
      receiptNumber: 'SLK4X8M2T7',
      checkoutRequestId: 'ws_CO_260620265566778899',
      merchantRequestId: '12345-67890-15',
      responseDescription: 'Success',
      callbackResponse: { ResultCode: 0, ResultDesc: 'Success' },
      createdAt: daysAgo(1),
      completedAt: daysAgo(1),
    },
    {
      id: 'tx_007',
      merchantId: 'mer_abc',
      customerPhone: '254722556677',
      customerReference: 'INV-2026-007',
      amount: 150,
      paymentMethod: 'airtel',
      status: 'successful',
      receiptNumber: 'AM29837190',
      checkoutRequestId: 'airtel_chk_8821038',
      merchantRequestId: null,
      responseDescription: 'Success',
      callbackResponse: { status: 'SUCCESS' },
      createdAt: daysAgo(0),
      completedAt: daysAgo(0),
    },
    {
      id: 'tx_008',
      merchantId: 'mer_abc',
      customerPhone: '254712332211',
      customerReference: 'INV-2026-008',
      amount: 8000,
      paymentMethod: 'mpesa',
      status: 'processing',
      receiptNumber: null,
      checkoutRequestId: 'ws_CO_260620266677889900',
      merchantRequestId: '12345-67890-16',
      responseDescription: 'Initiated',
      callbackResponse: null,
      createdAt: now,
      completedAt: null,
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'ntf_1',
      userId: 'usr_merchant_abc',
      title: 'Merchant Approved',
      message: 'Congratulations! Your merchant profile for ABC Electronics Ltd has been approved. You are now live and can receive payments.',
      isRead: false,
      type: 'success',
      createdAt: daysAgo(14),
    },
    {
      id: 'ntf_2',
      userId: 'usr_merchant_abc',
      title: 'Payment Received',
      message: 'You have received a payment of KES 9,500 via M-Pesa. Customer Reference: INV-2026-005.',
      isRead: false,
      type: 'info',
      createdAt: daysAgo(2),
    },
    {
      id: 'ntf_3',
      userId: 'all',
      title: 'PayHub Platform Upgrade',
      message: 'We will be conducting brief infrastructure maintenance on Sunday 2 AM to 3 AM UTC. There will be minimal downtime.',
      isRead: false,
      type: 'system',
      createdAt: daysAgo(1),
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'act_1',
      userId: 'usr_merchant_abc',
      userEmail: 'merchant@payhub.co.ke',
      action: 'Business Profile Updates',
      details: 'Updated business logo and email address.',
      ipAddress: '197.237.12.18',
      device: 'Mac OS / Chrome Browser',
      createdAt: daysAgo(14),
    },
    {
      id: 'act_2',
      userId: 'usr_merchant_abc',
      userEmail: 'merchant@payhub.co.ke',
      action: 'Payment Configuration Changes',
      details: 'Saved M-Pesa Daraja Credentials and Airtel merchant codes.',
      ipAddress: '197.237.12.18',
      device: 'Mac OS / Chrome Browser',
      createdAt: daysAgo(14),
    }
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'tkt_001',
      merchantId: 'mer_abc',
      subject: 'Clarification regarding Daraja Sandbox limits',
      description: 'Hi support team, is there a transaction amount limit on the Daraja sandbox? We are receiving error 500 when pushing transactions above KES 150,000.',
      status: 'open',
      priority: 'medium',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(4),
    }
  ];

  const ticketMessages: TicketMessage[] = [
    {
      id: 'tmsg_1',
      ticketId: 'tkt_001',
      senderId: 'usr_merchant_abc',
      senderName: 'Nelly Mutua',
      senderRole: 'merchant',
      message: 'Hi support team, is there a transaction amount limit on the Daraja sandbox? We are receiving error 500 when pushing transactions above KES 150,000.',
      createdAt: daysAgo(5),
    },
    {
      id: 'tmsg_2',
      ticketId: 'tkt_001',
      senderId: 'usr_admin',
      senderName: 'Dominic Kiprop',
      senderRole: 'admin',
      message: 'Hello Nelly, yes, Safaricom Daraja Sandbox caps transaction amounts to KES 70,000 per transaction and a daily limit of KES 300,000. Please test with smaller values such as KES 10, 50, or 100.',
      createdAt: daysAgo(4),
    }
  ];

  const faqs: FAQ[] = [
    {
      id: 'faq_1',
      question: 'What is the Direct Settlement Model?',
      answer: 'The Direct Settlement Model means customer payments go directly from their phone into your registered M-Pesa shortcode (Till or PayBill) or Airtel Money account. PayHub only facilitates the initiation and callback tracking. We NEVER hold your money, ensuring instant liquidity.',
      isPublished: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: 'faq_2',
      question: 'What M-Pesa credentials do I need for live payments?',
      answer: 'To receive payments via M-Pesa, you will need a Daraja developer account. You will then input your Shortcode, Shortcode Type (Till or PayBill), Consumer Key, Consumer Secret, and Passkey into the PayHub payment configurations panel.',
      isPublished: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: 'faq_3',
      question: 'Does PayHub have access to our customers\' mobile money PINs?',
      answer: 'Absolutely not. PayHub triggers an STK Push (Simulated SIM Tool Kit) payment. The prompt to enter a mobile money PIN is generated natively on the customer\'s handset by Safaricom or Airtel. Customers should NEVER enter their PINs on any web page.',
      isPublished: true,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: 'faq_4',
      question: 'What is the transaction flow for Airtel Money payments?',
      answer: 'When a customer selects Airtel Money, PayHub initiates an Airtel Money Payment API push request. The customer receives an overlay prompt on their phone to enter their Airtel PIN, settling funds instantly into your Airtel Merchant Account.',
      isPublished: true,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    }
  ];

  const systemSettings: SystemSettings = {
    platformName: 'PayHub Kenya',
    platformLogo: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=128&auto=format&fit=crop&q=80',
    supportEmail: 'support@payhub.co.ke',
    supportPhone: '+254 700 000 000',
    defaultCountry: 'Kenya',
    defaultCurrency: 'KES',
    defaultTimezone: 'EAT (GMT+3)',
    maintenanceMode: false,
    registrationEnabled: true,
    merchantApprovalRequired: true,
    primaryColor: '#16A34A',
    secondaryColor: '#0F172A',
  };

  return {
    users,
    merchants,
    merchantProfiles,
    merchantStaff,
    transactions,
    notifications,
    activityLogs,
    supportTickets,
    ticketMessages,
    faqs,
    systemSettings,
  };
}
