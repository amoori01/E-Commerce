// ====================================================================
// AMG HOLDINGS ENTERPRISE E-COMMERCE & RFQ PLATFORM
// CORE TYPES & DOMAIN MODELS
// ====================================================================

export type UserRole = 'customer' | 'sales_agent' | 'branch_admin' | 'super_admin';

export type TransactionStream = 'direct_checkout' | 'assisted_quote';

export type OrderStatus =
  | 'cart_created'
  | 'checkout_initiated'
  | 'payment_pending'
  | 'payment_verified'
  | 'fulfillment_processing'
  | 'ready_for_pickup'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type QuoteStatus =
  | 'inquiry_submitted'
  | 'assigned_to_agent'
  | 'draft_quote_issued'
  | 'customer_review'
  | 'quote_approved'
  | 'payment_processing'
  | 'fulfilled'
  | 'rejected';

export type PaymentGateway = 'telebirr' | 'chapa' | 'cbe_birr' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'refunded';

export interface Subsidiary {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  subsidiaryId?: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  isHub: boolean;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  subsidiaryId?: string;
  subsidiaryName?: string;
  branchId?: string;
  branchName?: string;
  companyName?: string;
  tinNumber?: string;
  isVerified: boolean;
  clientPortfolio?: string;
  specialization?: string;
}

export interface Category {
  id: string;
  subsidiaryId: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}

export interface TechnicalSpecs {
  [key: string]: string | number;
}

export interface VolumePricingTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPriceEtb: number;
  discountPercentage: number;
}

export interface Product {
  id: string;
  subsidiaryId: string;
  subsidiaryCode: string;
  subsidiaryName: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  transactionStream: TransactionStream;
  fulfillmentStream?: 'DIRECT' | 'QUOTE';
  unitPriceEtb: number;
  currency: string;
  unitMeasurement: string;
  moq: number;
  technicalSpecs: TechnicalSpecs;
  datasheetUrl?: string;
  cadDownloadUrl?: string;
  imageUrl: string;
  galleryImages?: string[];
  isFeatured: boolean;
  volumePricing?: VolumePricingTier[];
  relatedProductIds?: string[];
  stockSummary?: {
    totalOnHand: number;
    branches: {
      branchName: string;
      city: string;
      quantity: number;
      leadTimeDays: number;
    }[];
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  appliedUnitPriceEtb?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceEtb: number;
  totalPriceEtb: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  fulfillmentBranchId: string;
  fulfillmentBranchName: string;
  status: OrderStatus;
  deliveryType: 'branch_pickup' | 'freight_delivery';
  deliveryAddress?: string;
  subtotalEtb: number;
  taxEtb: number;
  totalAmountEtb: number;
  paymentMethod?: PaymentGateway;
  createdAt: string;
  items: OrderItem[];
}

export interface QuoteMessage {
  id: string;
  quoteId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  productId?: string;
  customProductName: string;
  requestedSpecs: TechnicalSpecs;
  quantity: number;
  unitMeasurement: string;
  quotedUnitPriceEtb?: number;
  quotedTotalPriceEtb?: number;
}

export interface QuoteRevision {
  version: number;
  timestamp: string;
  quotedTotalEtb: number;
  validUntil: string;
  notes: string;
  status: 'draft' | 'revised' | 'approved' | 'rejected';
  changedBy: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  subsidiaryId: string;
  subsidiaryName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: QuoteStatus;
  currentVersion: number;
  revisions: QuoteRevision[];
  projectTitle: string;
  deliveryDestination: string;
  targetDeliveryDate?: string;
  estimatedTotalEtb?: number;
  finalQuotedTotalEtb?: number;
  quoteValidUntil?: string;
  customerRequirements: string;
  agentQuotationNotes?: string;
  createdAt: string;
  items: QuoteItem[];
  messages: QuoteMessage[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  subsidiaryName: string;
  branchId: string;
  branchName: string;
  quantityOnHand: number;
  quantityReserved: number;
  safetyStockThreshold: number;
  updatedAt: string;
}

export interface ProformaInvoice {
  proformaNumber: string;
  issueDate: string;
  validUntil: string;
  seller: {
    companyName: string;
    tin: string;
    vatRegNumber: string;
    address: string;
    phone: string;
    email: string;
    bankAccounts: {
      bank: string;
      accountNumber: string;
      branch: string;
    }[];
  };
  buyer: {
    companyName: string;
    contactName: string;
    tin: string;
    address: string;
    phone: string;
  };
  lineItems: {
    itemNumber: number;
    description: string;
    specifications?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  vat15: number;
  grandTotal: number;
  totalInWords: string;
  deliveryTerms: string;
  paymentTerms: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  title: string; // e.g. "Addis Factory Gate 1", "Bishoftu Site"
  recipientName: string;
  phone: string;
  city: string;
  subcity?: string;
  detailedAddress: string;
  isDefault: boolean;
}

export interface CouponDiscount {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_etb';
  discountValue: number;
  minOrderValueEtb: number;
  maxDiscountEtb?: number;
  validUntil: string;
  eligibleSubsidiaryId?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  companyName?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  isVerifiedBuyer: boolean;
  astmComplianceVerified?: boolean;
  createdAt: string;
}

export interface ErpSyncMessage {
  id: string;
  event: 'ORDER_SYNC' | 'INVENTORY_RECONCILE' | 'CUSTOMER_UPSERT';
  entityId: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSED' | 'FAILED_RETRYING' | 'DEAD_LETTER';
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  errorMessage?: string;
}

