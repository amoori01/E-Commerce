import 'package:flutter/material.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import '../services/api_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ApiService _apiService = ApiService();

  // Initial cart items
  final List<CartItem> _items = [
    CartItem(
      product: Product(
        id: 'p1',
        subsidiaryId: '222',
        subsidiaryName: 'AMG Ethio & Adama Roofing',
        sku: 'AMG-ROOF-ET-040',
        name: 'Ethio Tile Pre-Painted Roofing Sheet (0.40mm)',
        description: 'Galvanized corrugated steel roofing tile.',
        transactionStream: 'direct_checkout',
        fulfillmentStream: 'DIRECT',
        unitPriceEtb: 1850.0,
        unitMeasurement: 'sheet',
        moq: 10,
        technicalSpecs: {},
        imageUrl: '',
      ),
      quantity: 50,
      appliedUnitPriceEtb: 1760.0, // Volume discounted price
    ),
  ];

  double get _subtotal => _items.reduce((sum, i) => sum + i.totalPrice, 0.0);
  double get _tax => _subtotal * 0.15; // 15% Ethiopian VAT
  double get _total => _subtotal + _tax;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync with Web Server',
            onPressed: () async {
              final synced = await _apiService.syncCartWithServer(_items);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cart synchronized with AMG server!')),
              );
            },
          ),
        ],
      ),
      body: _items.isEmpty
          ? const Center(child: Text('Your shopping cart is empty'))
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return Card(
                        elevation: 0.5,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    Text('SKU: ${item.product.sku}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                    const SizedBox(height: 4),
                                    Text('ETB ${item.unitPrice.toStringAsFixed(2)} / ${item.product.unitMeasurement}'),
                                  ],
                                ),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    onPressed: () {
                                      setState(() {
                                        if (item.quantity > 1) {
                                          item.quantity -= 1;
                                        } else {
                                          _items.removeAt(index);
                                        }
                                      });
                                    },
                                  ),
                                  Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, size: 20),
                                    onPressed: () => setState(() => item.quantity += 1),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Footer
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Subtotal:'),
                          Text('ETB ${_subtotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('VAT (15%):'),
                          Text('ETB ${_tax.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('ETB ${_total.toStringAsFixed(2)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E2B58))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E2B58),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CheckoutScreen(
                                  items: _items,
                                  subtotal: _subtotal,
                                  tax: _tax,
                                  total: _total,
                                ),
                              ),
                            );
                          },
                          child: const Text('Proceed to Checkout', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
