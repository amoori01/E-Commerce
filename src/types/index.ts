// ====================================================================
// AMG HOLDINGS ENTERPRISE E-COMMERCE & RFQ PLATFORM
// CORE TYPES & DOMAIN MODELS
// ====================================================================

export type UserRole = 'customer' | 'sales_agent' | 'branch_admin' | 'finance' | 'super_admin';

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

export type PaymentGateway = 'cbe_transfer' | 'telebirr' | 'chapa' | 'cbe_birr' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'rejected' | 'refunded';

export interface Subsidiary {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  imageUrl?: string;
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
  customerType?: 'b2b' | 'b2c' | 'individual';
  subsidiaryId?: string;
  subsidiaryName?: string;
  branchId?: string;
  branchName?: string;
  companyName?: string;
  tinNumber?: string;
  isVerified: boolean;
  isActive?: boolean;
  clientPortfolio?: string;
  specialization?: string;
  vatNumber?: string;
  tradeLicense?: string;
  creditTier?: string;
  creditLimitEtb?: number;
  twoFactorEnabled?: boolean;
  deliveryCity?: string;
  deliveryAddress?: string;
  subcity?: string;
  notifySms?: boolean;
  notifyEmail?: boolean;
  notifyGatePass?: boolean;
}

export interface Category {
  id: string;
  subsidiaryId: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  imageUrl?: string;
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
  discountEtb?: number;
  couponCode?: string;
  taxEtb: number;
  totalAmountEtb: number;
  paymentMethod?: PaymentGateway;
  cbeFtReference?: string;
  cbePayerAccount?: string;
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  paymentRejectionReason?: string;
  reservationExpiresAt?: string;
  gatePassCode?: string;
  dispatchedAt?: string;
  driverName?: string;
  truckPlate?: string;
  pickingStatus?: 'pending' | 'picked' | 'staged';
  stagingDock?: string;
  stagedAt?: string;
  pickedAt?: string;
  pickedBy?: string;
  batchAllocated?: string;
  weighbridgeTicket?: WeighbridgeTicket;
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

export interface CounterOfferDetails {
  targetPriceEtb: number;
  originalPriceEtb: number;
  discountPercent: number;
  savingsEtb: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
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
  pendingCounterOffer?: CounterOfferDetails;
  createdAt: string;
  items: QuoteItem[];
  messages: QuoteMessage[];
}

export interface WeighbridgeTicket {
  ticketNumber: string;
  orderNumber: string;
  gatePassCode: string;
  timestamp: string;
  gateNumber: string;
  truckPlate: string;
  driverName: string;
  tareWeightKg: number;
  grossWeightKg: number;
  netWeightKg: number;
  declaredWeightKg: number;
  weightVarianceKg: number;
  isOverloaded: boolean;
  weighmasterName: string;
}

export interface GoodsReceivedNote {
  grnNumber: string;
  date: string;
  depotId: string;
  depotName: string;
  supplierName: string;
  supplierWaybillNumber: string;
  truckPlate: string;
  driverName: string;
  driverPhone?: string;
  items: {
    sku: string;
    productName: string;
    quantityReceived: number;
    unit: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate?: string;
    millTestCert?: string;
  }[];
  qualityInspectionPassed: boolean;
  receivedBy: string;
  notes?: string;
}

export interface StockMovementAudit {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  depotId: string;
  depotName: string;
  movementType: 'GRN_INTAKE' | 'DISPATCH_FULFILLMENT' | 'PICK_STAGING' | 'CYCLE_ADJUSTMENT' | 'DAMAGE_WRITE_OFF';
  referenceNumber: string;
  quantityChange: number;
  balanceAfter: number;
  performedBy: string;
  notes?: string;
  batchNumber?: string;
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
  bayLocation?: string;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  millTestCert?: string;
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
  isActive?: boolean;
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

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  action: 'PAYMENT_KILL_SWITCH' | 'TAX_POLICY_UPDATE' | 'USER_GOVERNANCE' | 'COUPON_MANAGEMENT' | 'PRODUCT_CATALOG' | 'MAINTENANCE_TOGGLE' | 'DEPOT_TRANSFER';
  details: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface InterDepotTransfer {
  transferNumber: string;
  date: string;
  sku: string;
  productName: string;
  sourceBranchId: string;
  sourceBranchName: string;
  destBranchId: string;
  destBranchName: string;
  quantity: number;
  status: 'IN_TRANSIT' | 'RECEIVED' | 'PENDING_DISPATCH';
  dispatchedBy: string;
  truckPlate: string;
}

export interface FinancialSettlementBatch {
  batchId: string;
  date: string;
  gateway: 'cbe_transfer' | 'telebirr' | 'cbe_birr' | 'chapa';
  gatewayName: string;
  grossAmountEtb: number;
  feeAmountEtb: number;
  netDisbursedEtb: number;
  transactionCount: number;
  status: 'SETTLED' | 'PENDING_CLEARANCE';
  payoutAccount: string;
}

export interface WebhookHealthStatus {
  serviceName: string;
  endpoint: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  lastPing: string;
  successRate: number;
}


