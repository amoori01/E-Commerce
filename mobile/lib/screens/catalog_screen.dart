import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/barcode_scanner_service.dart';
import 'checkout_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final ApiService _apiService = ApiService();
  final BarcodeScannerService _scannerService = BarcodeScannerService();
  String _selectedStream = 'ALL'; // 'ALL', 'STREAM_A', 'STREAM_B'
  String _searchQuery = '';

  // Sample client-side catalog cache
  final List<Product> _products = [
    Product(
      id: 'p1',
      subsidiaryId: '222',
      subsidiaryName: 'AMG Ethio & Adama Roofing',
      sku: 'AMG-ROOF-ET-040',
      name: 'Ethio Tile Pre-Painted Roofing Sheet (0.40mm)',
      description: 'Galvanized corrugated steel roofing tile engineered for tropical weather resistance.',
      transactionStream: 'direct_checkout',
      fulfillmentStream: 'DIRECT',
      unitPriceEtb: 1850.0,
      unitMeasurement: 'sheet',
      moq: 10,
      technicalSpecs: {'Thickness': '0.40mm', 'Coating': 'Z120'},
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
    ),
    Product(
      id: 'p2',
      subsidiaryId: '111',
      subsidiaryName: 'AMG Heavy Structural Engineering',
      sku: 'AMG-STEEL-RB-16MM',
      name: 'Grade 60 Deformed High-Yield Rebar (16mm x 12m)',
      description: 'ASTM A615 Grade 60 hot-rolled reinforcing steel bar.',
      transactionStream: 'direct_checkout',
      fulfillmentStream: 'DIRECT',
      unitPriceEtb: 4120.0,
      unitMeasurement: 'piece',
      moq: 20,
      technicalSpecs: {'Diameter': '16mm', 'Yield': '420 MPa'},
      imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400',
    ),
    Product(
      id: 'p3',
      subsidiaryId: '333',
      subsidiaryName: 'AMG Commercial Transport & Logistics',
      sku: 'AMG-VEH-HOWO-6X4',
      name: 'Sinotruk HOWO 6x4 Prime Mover with BPW Semi-Trailer',
      description: 'Euro-III 420HP commercial tractor truck paired with custom 13m 3-axle trailer.',
      transactionStream: 'assisted_quote',
      fulfillmentStream: 'QUOTE',
      unitPriceEtb: 0.0,
      unitMeasurement: 'unit',
      moq: 1,
      technicalSpecs: {'Engine': '420 HP Turbo', 'Payload': '45 Tons'},
      imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400',
    ),
    Product(
      id: 'p4',
      subsidiaryId: '111',
      subsidiaryName: 'AMG Heavy Structural Engineering',
      sku: 'AMG-STEEL-PEB-S355',
      name: 'Custom Pre-Engineered Steel Columns & Beam Rafters',
      description: 'Welded H-section columns and tapered rafters for industrial warehouses.',
      transactionStream: 'assisted_quote',
      fulfillmentStream: 'QUOTE',
      unitPriceEtb: 0.0,
      unitMeasurement: 'ton',
      moq: 5,
      technicalSpecs: {'Steel': 'S355JR', 'Clear Span': 'Up to 48m'},
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=400',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _products.where((p) {
      if (_selectedStream == 'STREAM_A' && !p.isDirectCheckout) return false;
      if (_selectedStream == 'STREAM_B' && p.isDirectCheckout) return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        return p.name.toLowerCase().contains(q) || p.sku.toLowerCase().contains(q);
      }
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('AMG Holdings Catalog', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Scan Barcode / QR',
            onPressed: () => _showScanDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search products by name, SKU, or specs...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(4)),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _filterChip('ALL', 'All Products'),
                    const SizedBox(width: 8),
                    _filterChip('STREAM_A', 'Direct Checkout'),
                    const SizedBox(width: 8),
                    _filterChip('STREAM_B', 'Request Quote'),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Product List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final product = filtered[index];
                return _buildProductCard(context, product);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String stream, String label) {
    final isSelected = _selectedStream == stream;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : Colors.black87)),
      selected: isSelected,
      selectedColor: const Color(0xFF1E2B58),
      onSelected: (_) => setState(() => _selectedStream = stream),
    );
  }

  Widget _buildProductCard(BuildContext context, Product product) {
    return Card(
      elevation: 0.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(4),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(Icons.factory, color: Colors.grey),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: product.isDirectCheckout
                              ? const Color(0xFF1E2B58)
                              : const Color(0xFF971E21),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(
                          product.isDirectCheckout ? 'STREAM A: INSTANT CHECKOUT' : 'STREAM B: RFQ QUOTE',
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text('SKU: ${product.sku}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(product.description, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  product.isDirectCheckout
                      ? 'ETB ${product.unitPriceEtb.toStringAsFixed(2)} / ${product.unitMeasurement}'
                      : 'Custom Pricing on Spec',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: product.isDirectCheckout ? const Color(0xFF0F172A) : const Color(0xFF971E21),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: product.isDirectCheckout
                        ? const Color(0xFF1E2B58)
                        : const Color(0xFF971E21),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  ),
                  onPressed: () {
                    if (product.isDirectCheckout) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Added ${product.name} to mobile cart!')),
                      );
                    } else {
                      _showRfqDialog(context, product);
                    }
                  },
                  child: Text(
                    product.isDirectCheckout ? 'Add to Cart' : 'Request Quote',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showScanDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Camera Barcode / QR Scanner'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.qr_code, size: 64, color: Color(0xFF1E2B58)),
            const SizedBox(height: 12),
            const Text('Scan product SKU or warehouse truck gate pass.'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final result = _scannerService.parseScannedCode('AMG-ROOF-ET-040');
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Scanned SKU: ${result.sku}')),
                );
              },
              child: const Text('Simulate Scan (AMG-ROOF-ET-040)'),
            ),
          ],
        ),
      ),
    );
  }

  void _showRfqDialog(BuildContext context, Product product) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Request Quote: ${product.name}', style: const TextStyle(fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Subsidiary: ${product.subsidiaryName}'),
            const SizedBox(height: 8),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Target Delivery Destination',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            const TextField(
              decoration: InputDecoration(
                labelText: 'Technical Specs / Quantity Inquiries',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF971E21), foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('RFQ inquiry dispatched to sales engineering desk!')),
              );
            },
            child: const Text('Submit RFQ'),
          ),
        ],
      ),
    );
  }
}
