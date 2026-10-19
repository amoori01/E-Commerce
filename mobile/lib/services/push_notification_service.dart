import 'dart:async';

// ====================================================================
// PUSH NOTIFICATION SERVICE (SRS 4.1 & R6.2)
// Listens to background and foreground notifications for order updates
// and agent quote revisions.
// ====================================================================

class PushNotificationMessage {
  final String title;
  final String body;
  final String? type; // 'ORDER_STATUS_CHANGED' | 'QUOTE_REVISION'
  final String? referenceId;
  final DateTime timestamp;

  PushNotificationMessage({
    required this.title,
    required this.body,
    this.type,
    this.referenceId,
    required this.timestamp,
  });
}

class PushNotificationService {
  final _messageController = StreamController<PushNotificationMessage>.broadcast();
  Stream<PushNotificationMessage> get onMessage => _messageController.stream;

  Future<void> initialize() async {
    // In production: FirebaseMessaging.instance.requestPermission()
  }

  void simulateIncomingNotification({
    required String title,
    required String body,
    String? type,
    String? referenceId,
  }) {
    _messageController.add(
      PushNotificationMessage(
        title: title,
        body: body,
        type: type,
        referenceId: referenceId,
        timestamp: DateTime.now(),
      ),
    );
  }

  void dispose() {
    _messageController.close();
  }
}
