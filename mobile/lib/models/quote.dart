class QuoteModel {
  final String id;
  final String quoteNumber;
  final String customerId;
  final String projectTitle;
  final String subsidiaryName;
  final String status;
  final int currentVersion;
  final double? finalQuotedTotalEtb;
  final String? assignedAgentName;
  final String createdAt;

  QuoteModel({
    required this.id,
    required this.quoteNumber,
    required this.customerId,
    required this.projectTitle,
    required this.subsidiaryName,
    required this.status,
    required this.currentVersion,
    this.finalQuotedTotalEtb,
    this.assignedAgentName,
    required this.createdAt,
  });

  factory QuoteModel.fromJson(Map<String, dynamic> json) {
    return QuoteModel(
      id: json['id'] ?? '',
      quoteNumber: json['quoteNumber'] ?? '',
      customerId: json['customerId'] ?? '',
      projectTitle: json['projectTitle'] ?? 'Custom Engineering Inquiry',
      subsidiaryName: json['subsidiaryName'] ?? 'AMG Industrial Division',
      status: json['status'] ?? 'inquiry_submitted',
      currentVersion: json['currentVersion'] ?? 1,
      finalQuotedTotalEtb: (json['finalQuotedTotalEtb'] as num?)?.toDouble(),
      assignedAgentName: json['assignedAgentName'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}
