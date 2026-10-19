class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String sku;
  final int quantity;
  final double unitPriceEtb;
  final double totalPriceEtb;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.sku,
    required this.quantity,
    required this.unitPriceEtb,
    required this.totalPriceEtb,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      productName: json['productName'] ?? '',
      sku: json['sku'] ?? '',
      quantity: json['quantity'] ?? 1,
      unitPriceEtb: (json['unitPriceEtb'] as num?)?.toDouble() ?? 0.0,
      totalPriceEtb: (json['totalPriceEtb'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final String customerName;
  final String status;
  final String deliveryType;
  final double subtotalEtb;
  final double taxEtb;
  final double totalAmountEtb;
  final String? paymentMethod;
  final String createdAt;
  final List<OrderItem> items;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.customerName,
    required this.status,
    required this.deliveryType,
    required this.subtotalEtb,
    required this.taxEtb,
    required this.totalAmountEtb,
    this.paymentMethod,
    required this.createdAt,
    required this.items,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      customerId: json['customerId'] ?? '',
      customerName: json['customerName'] ?? '',
      status: json['status'] ?? 'checkout_initiated',
      deliveryType: json['deliveryType'] ?? 'branch_pickup',
      subtotalEtb: (json['subtotalEtb'] as num?)?.toDouble() ?? 0.0,
      taxEtb: (json['taxEtb'] as num?)?.toDouble() ?? 0.0,
      totalAmountEtb: (json['totalAmountEtb'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: json['paymentMethod'],
      createdAt: json['createdAt'] ?? '',
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => OrderItem.fromJson(i))
              .toList() ??
          [],
    );
  }
}
