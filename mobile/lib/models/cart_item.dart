import 'product.dart';

class CartItem {
  final Product product;
  int quantity;
  double? appliedUnitPriceEtb;

  CartItem({
    required this.product,
    required this.quantity,
    this.appliedUnitPriceEtb,
  });

  double get unitPrice => appliedUnitPriceEtb ?? product.unitPriceEtb;
  double get totalPrice => unitPrice * quantity;

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      product: Product.fromJson(json['product'] ?? {}),
      quantity: json['quantity'] ?? 1,
      appliedUnitPriceEtb: (json['appliedUnitPriceEtb'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product': product.toJson(),
      'quantity': quantity,
      'appliedUnitPriceEtb': appliedUnitPriceEtb,
    };
  }
}
