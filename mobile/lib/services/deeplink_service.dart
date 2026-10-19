import 'dart:async';

// ====================================================================
// MOBILE DEEP-LINK CALLBACK SERVICE (SRS 4.4 & R4.4)
// Listens to wallet scheme returns (e.g. amg://checkout/confirm?tx_ref=...)
// and navigates to the confirmation screen.
// ====================================================================

class DeepLinkCallback {
  final String orderNumber;
  final String? transactionReference;
  final String status;

  DeepLinkCallback({
    required this.orderNumber,
    this.transactionReference,
    required this.status,
  });
}

class DeepLinkService {
  final _callbackController = StreamController<DeepLinkCallback>.broadcast();
  Stream<DeepLinkCallback> get onCallback => _callbackController.stream;

  void handleIncomingUri(Uri uri) {
    if (uri.scheme == 'amg' && uri.host == 'checkout' && uri.path == '/confirm') {
      final orderNumber = uri.queryParameters['orderNumber'] ?? uri.queryParameters['orderId'] ?? '';
      final txRef = uri.queryParameters['tx_ref'] ?? uri.queryParameters['tradeNo'];
      final status = uri.queryParameters['status'] ?? 'verified';

      _callbackController.add(
        DeepLinkCallback(
          orderNumber: orderNumber,
          transactionReference: txRef,
          status: status,
        ),
      );
    }
  }

  void dispose() {
    _callbackController.close();
  }
}
