import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/order.dart';
import '../models/quote.dart';

// ====================================================================
// AMG MOBILE API SERVICE (SRS 4.1)
// Connects cross-platform mobile client to unified backend endpoints,
// syncing carts server-side and initiating idempotent payment flows.
// ====================================================================

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000', // Default Android emulator host loopback
  );

  String? _accessToken;
  String? _userId;

  void setAuth(String token, String userId) {
    _accessToken = token;
    _userId = userId;
  }

  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  // 1. Fetch Products
  Future<List<Product>> fetchProducts() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/api/products'), headers: _headers);
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final list = (data['products'] as List<dynamic>?) ?? [];
        return list.map((p) => Product.fromJson(p)).toList();
      }
    } catch (_) {
      // Fallback or network error
    }
    return [];
  }

  // 2. Server-Side Cart Synchronization (R6.3)
  Future<List<CartItem>> syncCartWithServer(List<CartItem> localItems) async {
    if (_userId == null) return localItems;
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/cart'),
        headers: _headers,
        body: json.encode({
          'userId': _userId,
          'items': localItems.map((i) => i.toJson()).toList(),
        }),
      );
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final items = (data['items'] as List<dynamic>?) ?? [];
        return items.map((i) => CartItem.fromJson(i)).toList();
      }
    } catch (_) {}
    return localItems;
  }

  // 3. Initiate Payment with Idempotency Key (R4)
  Future<Map<String, dynamic>> initiatePayment({
    required String orderNumber,
    required double amountEtb,
    required String gateway,
    required String customerEmail,
  }) async {
    final idempotencyKey = 'mob-idemp-${DateTime.now().millisecondsSinceEpoch}-${orderNumber}';

    final res = await http.post(
      Uri.parse('$baseUrl/api/payments/initiate'),
      headers: {
        ..._headers,
        'Idempotency-Key': idempotencyKey,
      },
      body: json.encode({
        'orderNumber': orderNumber,
        'amountEtb': amountEtb,
        'gateway': gateway,
        'customerEmail': customerEmail,
        'deepLinkCallbackUrl': 'amg://checkout/confirm',
      }),
    );

    return json.decode(res.body);
  }

  // 4. Submit Stream B Custom RFQ (R2 & R3)
  Future<Map<String, dynamic>> submitRfq({
    required String projectTitle,
    required String subsidiaryId,
    required String deliveryDestination,
    required String requirements,
    required List<Map<String, dynamic>> items,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/quotes'),
      headers: _headers,
      body: json.encode({
        'customerId': _userId ?? 'u4444444-4444-4444-4444-444444444444',
        'subsidiaryId': subsidiaryId,
        'projectTitle': projectTitle,
        'deliveryDestination': deliveryDestination,
        'customerRequirements': requirements,
        'items': items,
      }),
    );
    return json.decode(res.body);
  }
}
