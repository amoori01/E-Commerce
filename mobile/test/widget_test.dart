import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:amg_mobile/main.dart';

void main() {
  testWidgets('AMG Holdings Mobile Shell loads navigation and tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const AmgHoldingsApp());

    // Verify app shell title or bottom navigation exists
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Catalog'), findsOneWidget);
    expect(find.text('Cart'), findsOneWidget);
    expect(find.text('Inquiries'), findsOneWidget);
  });
}
