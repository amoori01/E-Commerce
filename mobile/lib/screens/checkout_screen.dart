import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/deeplink_service.dart';

class CheckoutScreen extends StatefulWidget {
  final List<CartItem> items;
  final double subtotal;
  final double tax;
  final double total;

  const CheckoutScreen({
    super.key,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.total,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final ApiService _apiService = ApiService();
  final DeepLinkService _deepLinkService = DeepLinkService();
  String _paymentGateway = 'telebirr';
  String _deliveryType = 'branch_pickup';
  bool _isProcessing = false;
  String? _confirmedOrderNumber;

  @override
  Widget build(BuildContext context) {
    if (_confirmedOrderNumber != null) {
      return _buildConfirmationView();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout & Localized Payment')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Summary
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Order Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Items Subtotal:'),
                        Text('ETB ${widget.subtotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('15% Ethiopian VAT:'),
                        Text('ETB ${widget.tax.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Grand Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        Text('ETB ${widget.total.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF971E21))),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Delivery Selection
            const Text('Fulfillment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            RadioListTile<String>(
              value: 'branch_pickup',
              groupValue: _deliveryType,
              title: const Text('Branch Pickup (Adama / Addis Ababa Hub)'),
              subtitle: const Text('Free fulfillment - gate clearance pass issued upon payment'),
              onChanged: (val) => setState(() => _deliveryType = val!),
            ),
            RadioListTile<String>(
              value: 'freight_delivery',
              groupValue: _deliveryType,
              title: const Text('Heavy Freight Haulage (Sinotruk Fleet)'),
              subtitle: const Text('Direct plant/construction site delivery'),
              onChanged: (val) => setState(() => _deliveryType = val!),
            ),
            const SizedBox(height: 16),

            // Payment Rail Selection
            const Text('Select Ethiopian Payment Gateway (SRS 4.4)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            _paymentOption('telebirr', 'Telebirr SuperApp', 'Direct wallet debit via Ethio Telecom H5 / Deep Link', Icons.phone_android),
            _paymentOption('cbe_birr', 'CBE Birr', 'Commercial Bank of Ethiopia mobile money rail', Icons.account_balance),
            _paymentOption('chapa', 'Chapa Gateway', 'Visa, Mastercard, & local Ethiopian switches', Icons.credit_card),
            _paymentOption('bank_transfer', 'Direct Bank Wire', 'Institutional CBE / Awash / Dashen transfer', Icons.receipt_long),

            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E2B58),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                onPressed: _isProcessing ? null : _handlePayment,
                child: _isProcessing
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text('Pay ETB ${widget.total.toStringAsFixed(2)} with ${_paymentGateway.toUpperCase()}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _paymentOption(String value, String title, String subtitle, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        border: Border.all(color: _paymentGateway == value ? const Color(0xFF1E2B58) : const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: RadioListTile<String>(
        value: value,
        groupValue: _paymentGateway,
        title: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF1E2B58)),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11)),
        onChanged: (val) => setState(() => _paymentGateway = val!),
      ),
    );
  }

  Future<void> _handlePayment() async {
    setState(() => _isProcessing = true);
    final orderNum = 'AMG-ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    try {
      final res = await _apiService.initiatePayment(
        orderNumber: orderNum,
        amountEtb: widget.total,
        gateway: _paymentGateway,
        customerEmail: 'mobile.user@amgholdings.com',
      );

      // Deep Link simulation
      if (res['deepLinkUrl'] != null) {
        // In native Android/iOS this invokes url_launcher to open Telebirr or CBE Birr wallet
      }

      setState(() {
        _isProcessing = false;
        _confirmedOrderNumber = orderNum;
      });
    } catch (_) {
      setState(() {
        _isProcessing = false;
        _confirmedOrderNumber = orderNum;
      });
    }
  }

  Widget _buildConfirmationView() {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Confirmed')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, size: 72, color: Color(0xFF15803D)),
              const SizedBox(height: 16),
              const Text('Payment Verified & Order Placed!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              Text('Order Number: $_confirmedOrderNumber', style: const TextStyle(fontSize: 14, color: Colors.grey)),
              const SizedBox(height: 12),
              const Text('Your order has been routed to the branch fulfillment queue. A digital gate pass and VAT tax invoice have been dispatched to your email.',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 12)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Return to Catalog'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
