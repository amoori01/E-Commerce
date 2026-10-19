// ====================================================================
// CAMERA BARCODE / QR SCANNER SERVICE (SRS 4.1 & R6.2)
// Decodes industrial product barcodes (EAN-13, SKU) and warehouse QR gate passes.
// ====================================================================

enum ScanType { productSku, gatePass, unknown }

class ScanResult {
  final String rawCode;
  final ScanType type;
  final String? sku;
  final String? gatePassNumber;

  ScanResult({
    required this.rawCode,
    required this.type,
    this.sku,
    this.gatePassNumber,
  });
}

class BarcodeScannerService {
  ScanResult parseScannedCode(String code) {
    final clean = code.trim();

    // Check if QR matches gate pass pattern (e.g. GATE-PASS-849201)
    if (RegExp(r'^GATE-PASS-\d{6}$', caseSensitive: false).hasMatch(clean)) {
      return ScanResult(
        rawCode: clean,
        type: ScanType.gatePass,
        gatePassNumber: clean,
      );
    }

    // Check if matches AMG SKU (e.g. AMG-ROOF-ET-040)
    if (clean.startsWith('AMG-')) {
      return ScanResult(
        rawCode: clean,
        type: ScanType.productSku,
        sku: clean,
      );
    }

    return ScanResult(
      rawCode: clean,
      type: ScanType.unknown,
    );
  }
}
