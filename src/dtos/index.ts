// ====================================================================
// AMG HOLDINGS ENTERPRISE E-COMMERCE & RFQ PLATFORM
// DATA TRANSFER OBJECTS (DTOS) & VALIDATORS
// ====================================================================

import { PaymentGateway, TransactionStream, UserRole } from '@/types';

export interface CreateOrderDto {
  customerId: string;
  fulfillmentBranchId: string;
  deliveryType: 'branch_pickup' | 'freight_delivery';
  deliveryAddress?: string;
  paymentMethod: PaymentGateway;
  items: {
    productId: string;
    quantity: number;
    unitPriceEtb: number;
  }[];
  notes?: string;
}

export function validateCreateOrderDto(data: Partial<CreateOrderDto>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.customerId) errors.push('Customer ID is required');
  if (!data.fulfillmentBranchId) errors.push('Fulfillment branch is required');
  if (!data.deliveryType) errors.push('Delivery type must be specified');
  if (data.deliveryType === 'freight_delivery' && !data.deliveryAddress?.trim()) {
    errors.push('Delivery address is required for freight shipping');
  }
  if (!data.items || data.items.length === 0) {
    errors.push('Order must contain at least one product item');
  } else {
    data.items.forEach((item, idx) => {
      if (item.quantity <= 0) errors.push(`Item ${idx + 1}: Quantity must be greater than zero`);
      if (item.unitPriceEtb <= 0) errors.push(`Item ${idx + 1}: Unit price must be greater than zero`);
    });
  }
  return { isValid: errors.length === 0, errors };
}

export interface CreateRfqQuoteDto {
  customerId: string;
  subsidiaryId: string;
  projectTitle: string;
  deliveryDestination: string;
  targetDeliveryDate?: string;
  customerRequirements: string;
  items: {
    productId?: string;
    customProductName: string;
    quantity: number;
    unitMeasurement: string;
    requestedSpecs?: Record<string, string | number>;
  }[];
}

export function validateCreateRfqDto(data: Partial<CreateRfqQuoteDto>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.customerId) errors.push('Customer identity is required');
  if (!data.subsidiaryId) errors.push('Target subsidiary division must be selected');
  if (!data.projectTitle || data.projectTitle.trim().length < 5) {
    errors.push('Project title must be at least 5 characters');
  }
  if (!data.deliveryDestination?.trim()) {
    errors.push('Delivery site destination is required');
  }
  if (!data.customerRequirements || data.customerRequirements.trim().length < 15) {
    errors.push('Please describe your technical requirements in at least 15 characters');
  }
  if (!data.items || data.items.length === 0) {
    errors.push('At least one item or structural assembly specification is required');
  }
  return { isValid: errors.length === 0, errors };
}

export interface IssueDraftQuoteDto {
  quoteId: string;
  agentId: string;
  finalQuotedTotalEtb: number;
  quoteValidUntil: string;
  agentNotes: string;
  itemPricings: {
    itemId: string;
    quotedUnitPriceEtb: number;
  }[];
}

export interface UpdateInventoryStockDto {
  productId: string;
  branchId: string;
  adjustmentQuantity: number;
  reason: 'stock_intake' | 'dispatch' | 'damage_writeoff' | 'reconciliation';
  adminId: string;
}

export interface AuthLoginDto {
  email: string;
  password?: string;
  roleHint?: UserRole;
}
