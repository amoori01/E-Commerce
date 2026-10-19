class Product {
  final String id;
  final String subsidiaryId;
  final String subsidiaryName;
  final String sku;
  final String name;
  final String description;
  final String transactionStream; // 'direct_checkout' or 'assisted_quote'
  final String fulfillmentStream; // 'DIRECT' or 'QUOTE'
  final double unitPriceEtb;
  final String unitMeasurement;
  final int moq;
  final Map<String, dynamic> technicalSpecs;
  final String imageUrl;

  Product({
    required this.id,
    required this.subsidiaryId,
    required this.subsidiaryName,
    required this.sku,
    required this.name,
    required this.description,
    required this.transactionStream,
    required this.fulfillmentStream,
    required this.unitPriceEtb,
    required this.unitMeasurement,
    required this.moq,
    required this.technicalSpecs,
    required this.imageUrl,
  });

  bool get isDirectCheckout =>
      transactionStream == 'direct_checkout' || fulfillmentStream == 'DIRECT';

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      subsidiaryId: json['subsidiaryId'] ?? '',
      subsidiaryName: json['subsidiaryName'] ?? 'AMG Holdings',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      transactionStream: json['transactionStream'] ?? 'direct_checkout',
      fulfillmentStream: json['fulfillmentStream'] ??
          (json['transactionStream'] == 'direct_checkout' ? 'DIRECT' : 'QUOTE'),
      unitPriceEtb: (json['unitPriceEtb'] as num?)?.toDouble() ?? 0.0,
      unitMeasurement: json['unitMeasurement'] ?? 'pcs',
      moq: json['moq'] ?? 1,
      technicalSpecs: Map<String, dynamic>.from(json['technicalSpecs'] ?? {}),
      imageUrl: json['imageUrl'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'subsidiaryId': subsidiaryId,
      'subsidiaryName': subsidiaryName,
      'sku': sku,
      'name': name,
      'description': description,
      'transactionStream': transactionStream,
      'fulfillmentStream': fulfillmentStream,
      'unitPriceEtb': unitPriceEtb,
      'unitMeasurement': unitMeasurement,
      'moq': moq,
      'technicalSpecs': technicalSpecs,
      'imageUrl': imageUrl,
    };
  }
}
