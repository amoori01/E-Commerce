import { describe, it, expect } from 'vitest';
import { validateCreateOrderDto, validateCreateRfqDto } from '@/dtos';
import { calculateConsignmentFreight } from '@/lib/freight-calculator';
import { getProductUnitPrice } from '@/lib/constants';

describe('DTO Validation Suite (OWASP ASVS v4.0)', () => {
  it('validates a correct CreateOrderDto payload', () => {
    const validOrder = {
      customerId: 'cust-123',
      fulfillmentBranchId: 'branch-addis',
      deliveryType: 'branch_pickup' as const,
      paymentMethod: 'telebirr' as const,
      items: [
        { productId: 'prod-001', quantity: 10, unitPriceEtb: 1450 },
      ],
    };
    const result = validateCreateOrderDto(validOrder);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an order with missing items or negative quantity', () => {
    const invalidOrder = {
      customerId: 'cust-123',
      fulfillmentBranchId: 'branch-addis',
      deliveryType: 'branch_pickup' as const,
      paymentMethod: 'telebirr' as const,
      items: [
        { productId: 'prod-001', quantity: 0, unitPriceEtb: 1450 },
      ],
    };
    const result = validateCreateOrderDto(invalidOrder);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Item 1: Quantity must be greater than zero');
  });

  it('requires delivery address when freight_delivery is selected', () => {
    const invalidFreightOrder = {
      customerId: 'cust-123',
      fulfillmentBranchId: 'branch-addis',
      deliveryType: 'freight_delivery' as const,
      paymentMethod: 'chapa' as const,
      items: [
        { productId: 'prod-001', quantity: 5, unitPriceEtb: 1450 },
      ],
      deliveryAddress: '   ',
    };
    const result = validateCreateOrderDto(invalidFreightOrder);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Delivery address is required for freight shipping');
  });

  it('validates Stream B CreateRfqQuoteDto correctly', () => {
    const validRfq = {
      customerId: 'cust-b2b-01',
      subsidiaryId: '11111111-1111-1111-1111-111111111111',
      projectTitle: 'Bishoftu Industrial Warehouse Framework',
      deliveryDestination: 'Bishoftu Zone',
      targetDeliveryDate: '2026-12-01',
      customerRequirements: 'Must withstand heavy seismic forces.',
      items: [
        {
          customProductName: 'Custom Pre-Engineered Rafter Beam',
          quantity: 24,
          unitMeasurement: 'pcs',
        },
      ],
    };
    const result = validateCreateRfqDto(validRfq);
    expect(result.isValid).toBe(true);
  });
});

describe('Commercial Logistics & Freight Engine (SRS 3.2)', () => {
  it('calculates ton-kilometer haulage rates accurately', () => {
    const estimate = calculateConsignmentFreight({
      originBranchId: 'branch-addis',
      originBranchName: 'Addis Ababa Central Hub',
      destinationCity: 'Adama',
      weightTons: 10, // 10 metric tons * 98km = 980 ton-km
      consignmentValueEtb: 500000,
    });

    expect(estimate.distanceKm).toBe(98);
    expect(estimate.tonKilometers).toBe(980);
    expect(estimate.baseHaulageEtb).toBe(14210); // 980 * 14.50 = 14,210
    expect(estimate.fuelSurchargeEtb).toBe(1208); // 8.5%
    expect(estimate.insuranceEtb).toBe(3750); // 0.75% of 500k
    expect(estimate.totalFreightEtb).toBe(19168);
    expect(estimate.carrierType).toBe('medium_flatbed_15t');
  });

  it('allocates 40t prime mover when consignment exceeds 15 tons', () => {
    const heavyEstimate = calculateConsignmentFreight({
      originBranchId: 'branch-addis',
      originBranchName: 'Addis Ababa Central Hub',
      destinationCity: 'Hawassa',
      weightTons: 32,
    });

    expect(heavyEstimate.carrierType).toBe('sinotruk_prime_mover_40t');
    expect(heavyEstimate.estimatedLeadTimeDays).toBeGreaterThanOrEqual(2);
  });
});

describe('Dynamic Volume Discount Matrix (SRS 4.3)', () => {
  it('applies tiered discounts correctly based on order quantities', () => {
    const productWithTiers = {
      id: 'prod-test',
      unitPriceEtb: 1000,
      volumePricing: [
        { minQuantity: 10, maxQuantity: 49, unitPriceEtb: 950, discountPercentage: 5 },
        { minQuantity: 50, maxQuantity: 199, unitPriceEtb: 900, discountPercentage: 10 },
        { minQuantity: 200, unitPriceEtb: 820, discountPercentage: 18 },
      ],
    } as any;

    expect(getProductUnitPrice(productWithTiers, 5)).toBe(1000);
    expect(getProductUnitPrice(productWithTiers, 10)).toBe(950);
    expect(getProductUnitPrice(productWithTiers, 75)).toBe(900);
    expect(getProductUnitPrice(productWithTiers, 250)).toBe(820);
  });
});
