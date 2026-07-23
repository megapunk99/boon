import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:boon_mobile_scanner/bloc/scan/scan_bloc.dart';
import 'package:boon_mobile_scanner/bloc/scan/scan_event.dart';
import 'package:boon_mobile_scanner/bloc/scan/scan_state.dart';
import 'package:boon_mobile_scanner/models/qr_code.dart';
import 'package:boon_mobile_scanner/models/scan_record.dart';
import 'package:boon_mobile_scanner/models/user.dart';
import 'package:boon_mobile_scanner/services/api_service_base.dart';

// ── Mock ──────────────────────────────────────────────────────────────────
class MockApiService extends Mock implements ApiServiceBase {}

void main() {
  late MockApiService mockApi;

  setUp(() {
    mockApi = MockApiService();
    // Default: currentUser returns something so auto-log can attempt
    when(() => mockApi.currentUser).thenReturn(
      User(
        id: 'usr-001',
        username: 'admin',
        email: 'admin@boon.local',
        role: UserRole.admin,
      ),
    );
  });

  group('ScanBloc', () {
    test('initial state is ScanInitial', () {
      final bloc = ScanBloc(apiService: mockApi);
      expect(bloc.state, const ScanInitial());
    });

    // ── QR Code Scanned ──────────────────────────────────────────────────
    group('QRCodeScanned', () {
      blocTest<ScanBloc, ScanState>(
        'parses QR and emits QRDetected, then auto-verifies',
        build: () {
          // Auto-verify will be called, make it return authentic
          when(() => mockApi.verifyQR(any())).thenAnswer((_) async => {
            'verified': true,
            'tampered': false,
            'message': 'Authentic',
          });
          // Auto-log will be attempted
          when(() => mockApi.logScan(any())).thenAnswer((_) async => {
            'scan_entry': {
              'id': 'SCN-001',
              'barcode': 'BWN-001',
              'waste_type': 'infectious',
              'category': 'yellow',
              'weight_kg': 1.0,
              'source_facility': 'Unknown',
              'department': 'General',
              'container_type': 'bag',
              'scanned_by': 'admin',
            },
          });
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const QRCodeScanned(
          rawData: '{"barcode":"BWN-001","system":"Boon"}',
        )),
        expect: () => [
          isA<QRDetected>(),
          isA<QRVerifying>(),
          isA<QRVerified>(),
        ],
      );

      blocTest<ScanBloc, ScanState>(
        'handles plain text QR codes',
        build: () {
          when(() => mockApi.verifyQR(any())).thenAnswer((_) async => {
            'verified': false,
            'tampered': false,
            'expired': false,
            'message': 'Unknown QR format',
          });
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const QRCodeScanned(
          rawData: 'plain-barcode-text',
        )),
        expect: () => [
          isA<QRDetected>(),
          isA<QRVerifying>(),
          isA<QRVerified>(),
        ],
      );
    });

    // ── Verify QR Code ───────────────────────────────────────────────────
    group('VerifyQRCode', () {
      blocTest<ScanBloc, ScanState>(
        'emits QRVerified with authentic status when server verifies',
        build: () {
          when(() => mockApi.verifyQR(any())).thenAnswer((_) async => {
            'verified': true,
            'tampered': false,
            'message': 'Authentic',
          });
          when(() => mockApi.logScan(any())).thenAnswer((_) async => {
            'scan_entry': {
              'id': 'SCN-001',
              'barcode': 'BWN-001',
              'waste_type': 'general_biomedical',
              'category': 'yellow',
              'weight_kg': 1.0,
              'source_facility': 'Unknown',
              'department': 'General',
              'container_type': 'bag',
              'scanned_by': 'admin',
            },
          });
          return ScanBloc(apiService: mockApi);
        },
        seed: () => QRDetected(
          qrCode: QRCodeData.fromRaw('{"barcode":"BWN-001"}'),
        ),
        act: (bloc) => bloc.add(const VerifyQRCode(
          rawData: '{"barcode":"BWN-001"}',
        )),
        expect: () => [
          isA<QRVerifying>(),
          isA<QRVerified>(),
        ],
      );

      blocTest<ScanBloc, ScanState>(
        'emits QRVerified with tampered status when signature mismatch',
        build: () {
          when(() => mockApi.verifyQR(any())).thenAnswer((_) async => {
            'verified': false,
            'tampered': true,
            'message': 'Signature mismatch',
          });
          return ScanBloc(apiService: mockApi);
        },
        seed: () => QRDetected(
          qrCode: QRCodeData.fromRaw('{"barcode":"BWN-001"}'),
        ),
        act: (bloc) => bloc.add(const VerifyQRCode(
          rawData: '{"barcode":"BWN-001"}',
        )),
        expect: () => [
          isA<QRVerifying>(),
          isA<QRVerified>(),
        ],
        verify: (_) {
          final states = _.state;
          if (states is QRVerified) {
            expect(
              states.qrCode.verificationStatus,
              QRVerificationStatus.tampered,
            );
          }
        },
      );

      blocTest<ScanBloc, ScanState>(
        'emits ScanError on network failure',
        build: () {
          when(() => mockApi.verifyQR(any()))
              .thenThrow(Exception('SocketException: Connection refused'));
          return ScanBloc(apiService: mockApi);
        },
        seed: () => QRDetected(
          qrCode: QRCodeData.fromRaw('{"barcode":"BWN-001"}'),
        ),
        act: (bloc) => bloc.add(const VerifyQRCode(
          rawData: '{"barcode":"BWN-001"}',
        )),
        expect: () => [
          isA<QRVerifying>(),
          isA<ScanError>(),
        ],
      );
    });

    // ── Log Scan ─────────────────────────────────────────────────────────
    group('LogScan', () {
      final scanData = {
        'barcode': 'BWN-001',
        'waste_type': 'infectious_waste',
        'category': 'yellow',
        'weight_kg': 12.5,
      };

      blocTest<ScanBloc, ScanState>(
        'emits [QRLogging, QRLogged] on success',
        build: () {
          when(() => mockApi.logScan(any())).thenAnswer((_) async => {
            'scan_entry': {
              'id': 'SCN-001',
              'barcode': 'BWN-001',
              'waste_type': 'infectious_waste',
              'category': 'yellow',
              'weight_kg': 12.5,
              'source_facility': '',
              'department': '',
              'container_type': 'bag',
              'scanned_by': '',
            },
          });
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(LogScan(data: scanData)),
        expect: () => [
          isA<QRLogging>(),
          isA<QRLogged>(),
        ],
      );

      blocTest<ScanBloc, ScanState>(
        'emits ScanError on failure',
        build: () {
          when(() => mockApi.logScan(any()))
              .thenThrow(Exception('401'));
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(LogScan(data: scanData)),
        expect: () => [
          isA<QRLogging>(),
          isA<ScanError>(),
        ],
      );
    });

    // ── Load History ─────────────────────────────────────────────────────
    group('LoadHistory', () {
      blocTest<ScanBloc, ScanState>(
        'emits HistoryLoaded on success',
        build: () {
          when(() => mockApi.getScanHistory(limit: any(named: 'limit'),
              offset: any(named: 'offset')))
              .thenAnswer((_) async => [
                ScanRecord(
                  id: 'SCN-001',
                  barcode: 'BWN-001',
                  wasteType: 'infectious',
                  category: 'yellow',
                  weightKg: 10.0,
                  sourceFacility: 'AIIMS',
                  department: 'ICU',
                  containerType: 'bag',
                  scannedBy: 'admin',
                ),
              ]);
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const LoadHistory(limit: 10, offset: 0)),
        expect: () => [
          isA<HistoryLoaded>(),
        ],
        verify: (_) {
          verify(() => mockApi.getScanHistory(limit: 10, offset: 0)).called(1);
        },
      );

      blocTest<ScanBloc, ScanState>(
        'emits ScanError on failure',
        build: () {
          when(() => mockApi.getScanHistory(
              limit: any(named: 'limit'), offset: any(named: 'offset')))
              .thenThrow(Exception('404'));
          return ScanBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const LoadHistory()),
        expect: () => [
          isA<ScanError>(),
        ],
      );
    });

    // ── Scanner Controls ─────────────────────────────────────────────────
    group('Scanner controls', () {
      blocTest<ScanBloc, ScanState>(
        'StartScanner emits ScannerActive',
        build: () => ScanBloc(apiService: mockApi),
        act: (bloc) => bloc.add(StartScanner()),
        expect: () => [
          const ScannerActive(),
        ],
      );

      blocTest<ScanBloc, ScanState>(
        'StopScanner emits ScannerStopped',
        build: () => ScanBloc(apiService: mockApi),
        act: (bloc) => bloc.add(StopScanner()),
        expect: () => [
          const ScannerStopped(),
        ],
      );

      blocTest<ScanBloc, ScanState>(
        'ClearScanResult emits ScanInitial',
        build: () => ScanBloc(apiService: mockApi),
        seed: () => QRDetected(
          qrCode: QRCodeData.fromRaw('{"barcode":"BWN-001"}'),
        ),
        act: (bloc) => bloc.add(ClearScanResult()),
        expect: () => [
          const ScanInitial(),
        ],
      );
    });
  });
}
