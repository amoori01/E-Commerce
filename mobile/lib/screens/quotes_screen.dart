import 'package:flutter/material.dart';
import '../models/quote.dart';

class QuotesScreen extends StatefulWidget {
  const QuotesScreen({super.key});

  @override
  State<QuotesScreen> createState() => _QuotesScreenState();
}

class _QuotesScreenState extends State<QuotesScreen> {
  final List<QuoteModel> _quotes = [
    QuoteModel(
      id: 'q1',
      quoteNumber: 'RFQ-2026-AMG-001',
      customerId: 'u4444444-4444-4444-4444-444444444444',
      projectTitle: 'Bishoftu Industrial Warehouse Framework (24m Clear Span)',
      subsidiaryName: 'AMG Heavy Structural Engineering',
      status: 'customer_review',
      currentVersion: 2,
      finalQuotedTotalEtb: 2450000.0,
      assignedAgentName: 'Eng. Solomon Bekele',
      createdAt: '2026-10-12T10:00:00Z',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('RFQ Quotes & Collaboration')),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _quotes.length,
        itemBuilder: (context, index) {
          final quote = _quotes[index];
          return Card(
            elevation: 0.5,
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(quote.quoteNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          border: Border.all(color: const Color(0xFFF59E0B)),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(
                          quote.status.toUpperCase().replaceAll('_', ' '),
                          style: const TextStyle(color: Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(quote.projectTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(quote.subsidiaryName, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  const SizedBox(height: 8),
                  if (quote.assignedAgentName != null)
                    Text('Assigned Engineer: ${quote.assignedAgentName}', style: const TextStyle(fontSize: 12)),
                  if (quote.finalQuotedTotalEtb != null)
                    Text('Quoted Amount (Rev ${quote.currentVersion}): ETB ${quote.finalQuotedTotalEtb!.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E2B58))),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.chat_bubble_outline, size: 16),
                        label: const Text('Agent Chat'),
                        onPressed: () {
                          _showChatModal(context, quote);
                        },
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF15803D),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Quote approved! Converting to active order...')),
                          );
                        },
                        child: const Text('Approve Quote'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showChatModal(BuildContext context, QuoteModel quote) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          top: 16,
          left: 16,
          right: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Negotiation with ${quote.assignedAgentName ?? "Sales Desk"}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
              child: const Text('Eng. Solomon: "I updated the structural coating tariff to 85-micron hot-dip galvanizing per ASTM A123."'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Type your reply or technical specification inquiry...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF1E2B58)),
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Message sent to assigned sales engineer!')),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
