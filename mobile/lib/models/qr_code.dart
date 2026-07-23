import 'dart:convert';

/// Represents a scanned QR code with its digital certificate verification status.
class QRCodeData {
  final String rawData;
  final Map<String, dynamic> payload;

  // Digital certificate fields
  final String? signature;
  final String? hash;
  final String? createdAt;

  // Verification result
  final QRVerificationStatus verificationStatus;
  final String verificationMessage;
  final bool? expired;
  final int? daysOld;

  // Core fields extracted from payload
  final String barcode;
  final String? wasteType;
  final String? category;
  final String? source;
  final double? weightKg;
  final String? department;
  final String? container;

  QRCodeData({
    required this.rawData,
    required this.payload,
    this.signature,
    this.hash,
    this.createdAt,
    this.verificationStatus = QRVerificationStatus.pending,
    this.verificationMessage = 'Verification pending...',
    this.expired,
    this.daysOld,
    required this.barcode,
    this.wasteType,
    this.category,
    this.source,
    this.weightKg,
    this.department,
    this.container,
  });

  /// Create from raw scanned QR code text.
  factory QRCodeData.fromRaw(String rawData) {
    Map<String, dynamic> payload = {};

    try {
      final decoded = jsonDecode(rawData);
      if (decoded is Map<String, dynamic>) {
        payload = decoded;
      }
    } catch (_) {
      // Not JSON — treat as plain barcode
      payload = {'raw_text': rawData};
    }

    return QRCodeData(
      rawData: rawData,
      payload: payload,
      signature: payload['qr_signature'] as String?,
      hash: payload['qr_hash'] as String?,
      createdAt: payload['qr_created_at'] as String?,
      barcode: (payload['barcode'] as String?) ?? rawData,
      wasteType: _normalizeWasteType(payload['waste_type'] as String?),
      category: payload['category'] as String?,
      source: payload['source'] as String? ?? payload['source_facility'] as String?,
      weightKg: (payload['weight_kg'] as num?)?.toDouble(),
      department: payload['department'] as String?,
      container: payload['container'] as String?,
    );
  }

  /// Create from server verification response.
  factory QRCodeData.fromServerVerification(
    String rawData,
    Map<String, dynamic> payload,
    Map<String, dynamic> verificationResult,
  ) {
    final verified = verificationResult['verified'] as bool? ?? false;
    final tampered = verificationResult['tampered'] as bool? ?? false;
    final expired = verificationResult['expired'] as bool? ?? false;

    QRVerificationStatus status;
    if (verified && !tampered) {
      status = QRVerificationStatus.authentic;
    } else if (tampered) {
      status = QRVerificationStatus.tampered;
    } else if (expired) {
      status = QRVerificationStatus.expired;
    } else {
      status = QRVerificationStatus.unknown;
    }

    return QRCodeData(
      rawData: rawData,
      payload: payload,
      signature: payload['qr_signature'] as String?,
      hash: payload['qr_hash'] as String?,
      createdAt: payload['qr_created_at'] as String?,
      verificationStatus: status,
      verificationMessage: verificationResult['message'] as String? ?? '',
      expired: expired,
      daysOld: verificationResult['days_old'] as int?,
      barcode: (payload['barcode'] as String?) ?? rawData,
      wasteType: _normalizeWasteType(payload['waste_type'] as String?),
      category: payload['category'] as String?,
      source: payload['source'] as String? ?? payload['source_facility'] as String?,
      weightKg: (payload['weight_kg'] as num?)?.toDouble(),
      department: payload['department'] as String?,
      container: payload['container'] as String?,
    );
  }

  bool get isBoonQR => payload['system'] == 'Boon' || signature != null;
  bool get hasDigitalSignature => signature != null && signature!.isNotEmpty;

  String get formattedCategory => category ?? 'Unknown';

  static String? _normalizeWasteType(String? wt) {
    if (wt == null) return null;
    return wt.replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');
  }
}

enum QRVerificationStatus {
  pending('⏳', 'Verification pending...'),
  verifying('🔄', 'Verifying with server...'),
  authentic('✅', 'Authentic — RSA signature verified'),
  tampered('❌', 'TAMPERED — Signature mismatch'),
  expired('⏰', 'Expired — QR code is too old'),
  unknown('❓', 'Unknown QR — not from Boon system');

  final String emoji;
  final String displayMessage;
  const QRVerificationStatus(this.emoji, this.displayMessage);
}
