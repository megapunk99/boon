import 'package:flutter_test/flutter_test.dart';
import 'package:boon_mobile_scanner/models/scan_record.dart';

void main() {
  group('ScanRecord.fromJson', () {
    const fullJson = {
      'id': 'SCN-20260723-001',
      'barcode': 'BWN-2026-0000001',
      'waste_type': 'infectious_waste',
      'category': 'yellow',
      'weight_kg': 12.5,
      'source_facility': 'AIIMS Delhi',
      'department': 'Surgery Ward',
      'container_type': 'yellow_bag',
      'scanned_by': 'admin',
      'notes': 'Routine scan',
      'gps_lat': 28.5678,
      'gps_lng': 77.1234,
      'scanned_at': '2026-07-23T10:30:00Z',
      'status': 'logged',
      'synced_to_main': true,
    };

    test('parses full JSON correctly', () {
      final record = ScanRecord.fromJson(fullJson);

      expect(record.id, 'SCN-20260723-001');
      expect(record.barcode, 'BWN-2026-0000001');
      expect(record.wasteType, 'infectious_waste');
      expect(record.category, 'yellow');
      expect(record.weightKg, 12.5);
      expect(record.sourceFacility, 'AIIMS Delhi');
      expect(record.department, 'Surgery Ward');
      expect(record.containerType, 'yellow_bag');
      expect(record.scannedBy, 'admin');
      expect(record.notes, 'Routine scan');
      expect(record.gpsLat, 28.5678);
      expect(record.gpsLng, 77.1234);
      expect(record.scannedAt, DateTime(2026, 7, 23, 10, 30));
      expect(record.status, 'logged');
      expect(record.syncedToMain, isTrue);
    });

    test('parses minimal JSON with defaults', () {
      final record = ScanRecord.fromJson({});

      expect(record.id, '');
      expect(record.barcode, '');
      expect(record.wasteType, 'unknown');
      expect(record.category, 'yellow');
      expect(record.weightKg, 0.0);
      expect(record.sourceFacility, '');
      expect(record.syncedToMain, isTrue);
      expect(record.status, 'logged');
    });

    test('parses JSON with nullables', () {
      final record = ScanRecord.fromJson({
        'id': 'SCN-002',
        'barcode': 'BWN-002',
        'waste_type': 'general',
        'category': 'blue',
        'weight_kg': 5.0,
        'source_facility': 'Hospital',
        'department': 'ER',
        'container_type': 'bag',
        'scanned_by': 'op1',
      });

      expect(record.notes, isNull);
      expect(record.gpsLat, isNull);
      expect(record.gpsLng, isNull);
      expect(record.scannedAt, isNull);
    });
  });

  group('ScanRecord.toJson', () {
    test('serializes correctly', () {
      final record = ScanRecord(
        id: 'SCN-001',
        barcode: 'BWN-001',
        wasteType: 'infectious_waste',
        category: 'yellow',
        weightKg: 10.0,
        sourceFacility: 'AIIMS',
        department: 'ICU',
        containerType: 'bag',
        scannedBy: 'admin',
        notes: 'Test scan',
        gpsLat: 28.5,
        gpsLng: 77.1,
      );

      final json = record.toJson();

      expect(json['barcode'], 'BWN-001');
      expect(json['waste_type'], 'infectious_waste');
      expect(json['category'], 'yellow');
      expect(json['weight_kg'], 10.0);
      expect(json['source_facility'], 'AIIMS');
      expect(json['department'], 'ICU');
      expect(json['container_type'], 'bag');
      expect(json['scanned_by'], 'admin');
      expect(json['notes'], 'Test scan');
      expect(json['gps_lat'], 28.5);
      expect(json['gps_lng'], 77.1);
    });

    test('toJson does not include id or scan metadata', () {
      final record = ScanRecord(
        id: 'SCN-001',
        barcode: 'BWN-001',
        wasteType: 'sharps',
        category: 'red',
        weightKg: 3.0,
        sourceFacility: 'Hospital',
        department: 'Lab',
        containerType: 'bin',
        scannedBy: 'admin',
        scannedAt: DateTime(2026, 7, 23),
        status: 'verified',
        syncedToMain: false,
      );

      final json = record.toJson();

      // id, scannedAt, status, syncedToMain should NOT be in toJson
      expect(json.containsKey('id'), isFalse);
      expect(json.containsKey('scanned_at'), isFalse);
      expect(json.containsKey('status'), isFalse);
      expect(json.containsKey('synced_to_main'), isFalse);
    });
  });

  group('ScanRecord formatters', () {
    test('categoryEmoji returns correct emoji', () {
      expect(ScanRecord(
        id: '1', barcode: '', wasteType: '', category: 'yellow',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).categoryEmoji, '🟡');

      expect(ScanRecord(
        id: '2', barcode: '', wasteType: '', category: 'red',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).categoryEmoji, '🔴');

      expect(ScanRecord(
        id: '3', barcode: '', wasteType: '', category: 'white',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).categoryEmoji, '⚪');

      expect(ScanRecord(
        id: '4', barcode: '', wasteType: '', category: 'blue',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).categoryEmoji, '🔵');
    });

    test('categoryEmoji defaults to white circle for unknown', () {
      expect(ScanRecord(
        id: '5', barcode: '', wasteType: '', category: 'green',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).categoryEmoji, '⚪');
    });

    test('formattedWeight formats correctly', () {
      expect(ScanRecord(
        id: '1', barcode: '', wasteType: '', category: '',
        weightKg: 12.5, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).formattedWeight, '12.5 kg');

      expect(ScanRecord(
        id: '2', barcode: '', wasteType: '', category: '',
        weightKg: 0.0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).formattedWeight, '0.0 kg');
    });

    test('formattedDate returns empty string when scannedAt is null', () {
      expect(ScanRecord(
        id: '1', barcode: '', wasteType: '', category: '',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
      ).formattedDate, '');
    });

    test('formattedDate formats correctly', () {
      expect(ScanRecord(
        id: '1', barcode: '', wasteType: '', category: '',
        weightKg: 0, sourceFacility: '', department: '', containerType: '',
        scannedBy: '',
        scannedAt: DateTime(2026, 7, 23),
      ).formattedDate, '23/7/2026');
    });
  });
}
