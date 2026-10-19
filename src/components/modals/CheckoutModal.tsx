'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { BRANCHES } from '@/lib/constants';
import { PaymentGateway } from '@/types';
import { CheckCircle2, Building2, Truck, ShieldCheck, X, ArrowRight, CreditCard, Phone, Landmark } from 'lucide-react';

export function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, subtotal, tax, total, clearCart } = useCart();
  const { currentUser, activeRole, switchRole } = useAuth();

  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [deliveryType, setDeliveryType] = useState<'branch_pickup' | 'freight_delivery'>('branch_pickup');
  const [selectedBranchId, setSelectedBranchId] = useState(BRANCHES[0].id);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('Addis Ababa Metro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>('telebirr');
  const [telebirrPhone, setTelebirrPhone] = useState(currentUser.phone || '+251 91 123 4567');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic Freight calculation based on items total weight
  const totalWeightTons = Math.max(
    0.5,
    items.reduce((acc, i) => acc + (i.quantity * (i.product.technicalSpecs?.['Weight'] ? parseFloat(String(i.product.technicalSpecs['Weight'])) || 0.05 : 0.05)), 0)
  );

  const freightRate = deliveryType === 'freight_delivery'
    ? Math.max(4500, Math.round(totalWeightTons * 150 * 14.5 * 1.085))
    : 0;

  if (!isCheckoutOpen) return null;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    if (activeRole !== 'customer') {
      setErrorMessage(
        `Staff account detected (${activeRole.replace('_', ' ')}). Order placement is restricted to verified Customer accounts. Click "Switch to Customer" above to complete this order.`
      );
      setIsProcessing(false);
      return;
    }

    try {
      const payload = {
        customerId: currentUser.id,
        fulfillmentBranchId: selectedBranchId,
        deliveryType,
        deliveryAddress: deliveryType === 'freight_delivery' ? deliveryAddress : undefined,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPriceEtb: i.product.unitPriceEtb,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const orderNum = data.order?.orderNumber || data.data?.orderNumber || `AMG-ORD-${Date.now()}`;
      setConfirmedOrderNumber(orderNum);
      clearCart();
      setStep('confirmation');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing order';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    closeCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-300 shadow-modal rounded-sm overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amg-navy text-white border-b border-amg-navy-900">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-semibold tracking-wider uppercase bg-amg-red text-white rounded-sm">
              Stream A
            </span>
            <h2 className="text-lg font-bold tracking-tight">Direct Self-Service Checkout</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {/* Staff Mode Role Guard Banner */}
          {activeRole !== 'customer' && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 shadow-xs">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Staff Account Detected ({activeRole.replace('_', ' ')})</div>
                  <div className="text-[11px] text-amber-800">
                    Commercial order checkout is reserved for Customer buyers. Click below to switch to a verified Customer account and test checkout.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => switchRole('customer')}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xs text-[11px] shrink-0 transition-colors shadow-xs"
              >
                Switch to Customer (MIDROC)
              </button>
            </div>
          )}

          {step === 'details' && (
            <>
              {/* Order Summary Snapshot */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-2">
                <div className="flex justify-between items-center font-semibold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Selected Products ({items.length} line items)</span>
                  <span className="font-mono text-amg-navy">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-slate-600">
                  {items.map((i) => (
                    <div key={i.product.id} className="flex justify-between">
                      <span className="truncate max-w-[340px] font-medium text-slate-700">
                        {i.quantity}x {i.product.name}
                      </span>
                      <span className="font-mono">ETB {(i.product.unitPriceEtb * i.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery / Fulfillment Method */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('branch_pickup')}
                    className={`p-3.5 border text-left rounded-sm transition-all flex items-start space-x-3 ${
                      deliveryType === 'branch_pickup'
                        ? 'border-amg-navy bg-amg-navy-50 text-amg-navy'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-5 h-5 shrink-0 mt-0.5 text-amg-navy" />
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide">Branch Pickup</div>
                      <div className="text-xs text-slate-500 mt-0.5">Collect directly at regional plant depot</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('freight_delivery')}
                    className={`p-3.5 border text-left rounded-sm transition-all flex items-start space-x-3 ${
                      deliveryType === 'freight_delivery'
                        ? 'border-amg-navy bg-amg-navy-50 text-amg-navy'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Truck className="w-5 h-5 shrink-0 mt-0.5 text-amg-red" />
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide">Freight Delivery</div>
                      <div className="text-xs text-slate-500 mt-0.5">Dispatched via AMG Logistics fleet</div>
                    </div>
                  </button>
                </div>

                {deliveryType === 'branch_pickup' ? (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Select Fulfillment Branch:
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full border border-slate-300 bg-white px-3 py-2 text-xs rounded-sm focus:border-amg-navy outline-none"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city} - {b.address})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Site Delivery Destination Hub / City:
                      </label>
                      <select
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="w-full border border-slate-300 bg-white px-3 py-2 text-xs rounded-sm focus:border-amg-navy outline-none"
                      >
                        <option value="Addis Ababa Metro">Addis Ababa Metro (25 km)</option>
                        <option value="Adama">Adama Industrial Park (98 km)</option>
                        <option value="Hawassa">Hawassa Hub (275 km)</option>
                        <option value="Dire Dawa">Dire Dawa Free Trade Zone (452 km)</option>
                        <option value="Bahir Dar">Bahir Dar (565 km)</option>
                        <option value="Mekelle">Mekelle Depot (780 km)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Site Address / Gate Coordinates:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bishoftu Industrial Park Plot 12, Gate 4"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full border border-slate-300 bg-white px-3 py-2 text-xs rounded-sm focus:border-amg-navy outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-white border border-slate-200 rounded-sm space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-700 font-semibold">
                        <span>AMG Fleet Haulage (Estimated):</span>
                        <span className="font-mono text-amg-navy font-bold">
                          ETB {freightRate.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Carrier: Sinotruk Heavy Logistics</span>
                        <span>Est. Transit: 24-48 hrs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax & Financial Summary */}
              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">ETB {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ethiopian VAT (15%):</span>
                  <span className="font-mono">ETB {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-amg-red">ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </>
          )}

          {step === 'payment' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Select National Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Telebirr */}
                  <label
                    className={`flex items-start p-3.5 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'telebirr'
                        ? 'border-amg-navy bg-amg-navy-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'telebirr'}
                      onChange={() => setPaymentMethod('telebirr')}
                      className="mt-1 mr-2.5 text-amg-navy"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Telebirr SuperApp</div>
                      <div className="text-[11px] text-slate-500">Ethio Telecom Mobile Money API</div>
                    </div>
                  </label>

                  {/* CBE Birr */}
                  <label
                    className={`flex items-start p-3.5 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'cbe_birr'
                        ? 'border-amg-navy bg-amg-navy-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cbe_birr'}
                      onChange={() => setPaymentMethod('cbe_birr')}
                      className="mt-1 mr-2.5 text-amg-navy"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">CBE Birr</div>
                      <div className="text-[11px] text-slate-500">Commercial Bank of Ethiopia switch</div>
                    </div>
                  </label>

                  {/* Chapa */}
                  <label
                    className={`flex items-start p-3.5 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'chapa'
                        ? 'border-amg-navy bg-amg-navy-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'chapa'}
                      onChange={() => setPaymentMethod('chapa')}
                      className="mt-1 mr-2.5 text-amg-navy"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Chapa Gateway</div>
                      <div className="text-[11px] text-slate-500">Visa / Mastercard / Local Wallets</div>
                    </div>
                  </label>

                  {/* Direct Bank Wire */}
                  <label
                    className={`flex items-start p-3.5 border rounded-sm cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-amg-navy bg-amg-navy-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="mt-1 mr-2.5 text-amg-navy"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Corporate Bank Transfer</div>
                      <div className="text-[11px] text-slate-500">Awash / CBE / Dashen Direct Wire</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment Details Form */}
              {paymentMethod === 'telebirr' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                    <Phone className="w-4 h-4 text-amg-navy" />
                    <span>Telebirr Registered Mobile Number:</span>
                  </div>
                  <input
                    type="text"
                    value={telebirrPhone}
                    onChange={(e) => setTelebirrPhone(e.target.value)}
                    placeholder="+251 91 123 4567"
                    className="w-full border border-slate-300 px-3 py-2 text-xs rounded-sm focus:border-amg-navy outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    A secure push prompt will be sent to your Telebirr app for PIN authorization.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 font-semibold text-slate-800">
                    <Landmark className="w-4 h-4 text-amg-navy" />
                    <span>AMG Holdings Official Settlement Accounts:</span>
                  </div>
                  <div className="font-mono text-slate-700 space-y-0.5">
                    <div>Commercial Bank of Ethiopia (CBE): <strong className="text-slate-900">1000192837461</strong></div>
                    <div>Awash International Bank: <strong className="text-slate-900">01320492817200</strong></div>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Please reference Order Number on your transfer slip for automatic branch clearance.
                  </p>
                </div>
              )}

              {/* Total Summary */}
              <div className="p-3 bg-amg-navy-50 border border-amg-navy-200 rounded-sm flex justify-between items-center">
                <span className="text-xs font-semibold text-amg-navy">Total Authorized Amount:</span>
                <span className="font-mono font-bold text-base text-amg-navy">
                  ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                  <span className="font-bold">Order Error:</span> {errorMessage}
                </div>
              )}
            </div>
          )}

          {step === 'confirmation' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Payment Verified & Order Confirmed!</h3>
                <p className="text-xs text-slate-600">
                  Your order has been routed to the fulfillment branch management queue.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm inline-block max-w-md text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number:</span>
                  <span className="font-mono font-bold text-amg-navy">{confirmedOrderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-medium">{currentUser.fullName} ({currentUser.companyName || 'Retail'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fulfillment:</span>
                  <span className="font-medium capitalize">{deliveryType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-semibold">
                  <span>Paid Total:</span>
                  <span className="font-mono text-emerald-700">ETB {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                An electronic tax invoice complying with Ethiopian ERCA VAT regulations has been registered.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          {step === 'details' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-slate-300 bg-white text-xs font-semibold text-slate-700 rounded-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="px-5 py-2 bg-amg-navy text-white text-xs font-bold rounded-sm hover:bg-amg-navy-900 transition-colors flex items-center space-x-1.5"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-4 py-2 border border-slate-300 bg-white text-xs font-semibold text-slate-700 rounded-sm hover:bg-slate-50"
              >
                Back to Details
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePlaceOrder}
                className="px-6 py-2 bg-amg-red text-white text-xs font-bold rounded-sm hover:bg-red-800 transition-colors flex items-center space-x-2 disabled:opacity-75"
              >
                {isProcessing ? (
                  <span>Processing Payment Switch...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Confirm Order</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'confirmation' && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 bg-amg-navy text-white text-xs font-bold rounded-sm hover:bg-amg-navy-900 transition-colors"
            >
              Close & View Order in Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
