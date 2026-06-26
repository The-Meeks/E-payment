export type UserRole = 'admin' | 'merchant' | 'staff';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

export type MerchantStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface Merchant {
  id: string;
  ownerId: string;
  merchantCode: string;
  status: MerchantStatus;
  createdAt: string;
}

export type MpesaShortcodeType = 'paybill' | 'till';

export interface MerchantProfile {
  id: string;
  merchantId: string;
  businessName: string;
  businessCategory: string;
  businessType: string;
  description: string;
  county: string;
  city: string;
  physicalAddress: string;
  businessEmail: string;
  businessPhone: string;
  logoUrl: string | null;
  mpesaShortcode: string;
  mpesaType: MpesaShortcodeType;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  airtelMerchantId: string;
  airtelClientId: string;
  airtelClientSecret: string;
  themeColor: string;
  receiptFooter: string;
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'accountant' | 'viewer';
export type StaffStatus = 'active' | 'inactive';

export interface TeamMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  permissions: string[];
  status: StaffStatus;
  invitedAt: string;
  acceptedAt: string | null;
}

export type TransactionStatus = 'processing' | 'successful' | 'failed' | 'cancelled' | 'expired';
export type PaymentMethod = 'mpesa' | 'airtel';

export interface Transaction {
  id: string;
  merchantId: string;
  customerPhone: string;
  customerReference: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  receiptNumber: string | null;
  checkoutRequestId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'alert' | 'system';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  device: string;
  createdAt: string;
}

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  merchantId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  businessName?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
  createdAt: string;
}

export interface SystemSettings {
  platformName: string;
  platformLogo: string;
  supportEmail: string;
  supportPhone: string;
  defaultCountry: string;
  defaultCurrency: string;
  defaultTimezone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  merchantApprovalRequired: boolean;
  primaryColor: string;
  secondaryColor: string;
}
