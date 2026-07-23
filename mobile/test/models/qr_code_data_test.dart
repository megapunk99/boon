import 'package:flutter_test/flutter_test.dart';
import 'package:boon_mobile_scanner/models/qr_code.dart';

void main() {
  group('QRCodeData.fromRaw', () {
    test('parses valid Boon QR JSON', () {
      final raw = '''{
        "barcode": "BWN-2026-0000001",
        "waste_type": "infectious_waste",
        "category": "yellow",
        "source": "AIIMS Delhi",
        "weight_kg": 12.5,
        "department": "Surgery Ward",
        "container": "yellow_bag",
        "system": "Boon",
        "qr_signature": "abc123sig",
        "qr_hash": "sha256hash",
        "qr_created_at": "2026-07-23T10:00:00Z"
      }''';

      final qr = QRCodeData.fromRaw(raw);

      expect(qr.barcode, 'BWN-2026-0000001');
      expect(qr.wasteType, 'Infectious Waste'); // normalized
      expect(qr.category, 'yellow');
      expect(qr.source, 'AIIMS Delhi');
      expect(qr.weightKg, 12.5);
      expect(qr.department, 'Surgery Ward');
      expect(qr.container, 'yellow_bag');
      expect(qr.isBoonQR, isTrue);
      expect(qr.hasDigitalSignature, isTrue);
      expect(qr.signature, 'abc123sig');
      expect(qr.hash, 'sha256hash');
      expect(qr.createdAt, '2026-07-23T10:00:00Z');
    });

    test('parses minimal QR with just raw text', () {
      final qr = QRCodeData.fromRaw('plain-barcode-text');

      expect(qr.barcode, 'plain-barcode-text');
      expect(qr.rawData, 'plain-barcode-text');
      expect(qr.wasteType, isNull);
      expect(qr.category, isNull);
      expect(qr.source, isNull);
      expect(qr.isBoonQR, isFalse);
      expect(qr.hasDigitalSignature, isFalse);
      expect(qr.payload, {'raw_text': 'plain-barcode-text'});
    });

    test('parses QR with source_facility as source fallback', () {
      final raw = '''{
        "barcode": "BWN-0002",
        "waste_type": "general_waste",
        "source_facility": "Fortis Hospital"
      }''';

      final qr = QRCodeData.fromRaw(raw);
      expect(qr.source, 'Fortis Hospital');
    });

    test('normalizes waste_type to title case', () {
      final qr = QRCodeData.fromRaw('{"waste_type": "sharps_metal_discs"}');
      expect(qr.wasteType, 'Sharps Metal Discs');
    });

    test('handles null waste_type', () {
      final qr = QRCodeData.fromRaw('{}');
      expect(qr.wasteType, isNull);
    });
  });

  group('QRCodeData.fromServerVerification', () {
    const payload = {
      'barcode': 'BWN-2026-0000001',
      'waste_type': 'infectious_waste',
      'qr_signature': 'abc',
      'qr_hash': 'def',
      'qr_created_at': '2026-07-23T10:00:00Z',
    };

    test('returns authentic for verified=true, tampered=false', () {
      final qr = QRCodeData.fromServerVerification(
        'raw',
        payload,
        {'verified': true, 'tampered': false, 'message': 'Authentic'},
      );

      expect(qr.verificationStatus, QRVerificationStatus.authentic);
      expect(qr.verificationMessage, 'Authentic');
      expect(qr.expired, isFalse);
    });

    test('returns tampered for tampered=true', () {
      final qr = QRCodeData.fromServerVerification(
        'raw',
        payload,
        {
          'verified': false,
          'tampered': true,
          'message': 'Signature mismatch',
        },
      );

      expect(qr.verificationStatus, QRVerificationStatus.tampered);
      expect(qr.expired, isFalse);
    });

    test('returns expired for expired=true', () {
      final qr = QRCodeData.fromServerVerification(
        'raw',
        payload,
        {
          'verified': false,
          'tampered': false,
          'expired': true,
          'message': 'QR expired',
          'days_old': 95,
        },
      );

      expect(qr.verificationStatus, QRVerificationStatus.expired);
      expect(qr.expired, isTrue);
      expect(qr.daysOld, 95);
    });

    test('returns unknown for no flags set', () {
      final qr = QRCodeData.fromServerVerification(
        'raw',
        payload,
        {'verified': false, 'tampered': false, 'expired': false},
      );

      expect(qr.verificationStatus, QRVerificationStatus.unknown);
    });

    test('extracts payload fields from verification', () {
      final qr = QRCodeData.fromServerVerification(
        'raw',
        payload,
        {'verified': true, 'tampered': false},
      );

      expect(qr.barcode, 'BWN-2026-0000001');
      expect(qr.signature, 'abc');
      expect(qr.hash, 'def');
      expect(qr.wasteType, 'Infectious Waste');
    });
  });

  group('QRVerificationStatus', () {
    test('pending has correct display values', () {
      expect(QRVerificationStatus.pending.emoji, '⏳');
      expect(QRVerificationStatus.pending.displayMessage,
          'Verification pending...');
    });

    test('authentic has correct display values', () {
      expect(QRVerificationStatus.authentic.emoji, '✅');
      expect(QRVerificationStatus.authentic.displayMessage,
          'Authentic — RSA signature verified');
    });

    test('tampered has correct display values', () {
      expect(QRVerificationStatus.tampered.emoji, '❌');
      expect(QRVerificationStatus.tampered.displayMessage,
          'TAMPERED — Signature mismatch');
    });
  });

  group('QRCodeData.boon QR detection', () {
    test('detects Boon system QR', () {
      final qr =
          QRCodeData.fromRaw('{"system": "Boon", "barcode": "BWN-001"}');
      expect(qr.isBoonQR, isTrue);
    });

    test('detects signed QR even without system field', () {
      final qr = QRCodeData.fromRaw(
          '{"barcode": "BWN-001", "qr_signature": "sig123"}');
      expect(qr.isBoonQR, isTrue);
    });

    test('non-Boon QR is not detected', () {
      final qr = QRCodeData.fromRaw('{"barcode": "BWN-001"}');
      expect(qr.isBoonQR, isFalse);
    });
  });
}
