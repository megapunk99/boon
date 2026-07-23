import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/qr_code.dart';
import '../../services/api_service_base.dart';
import 'scan_event.dart';
import 'scan_state.dart';

/// BLoC managing QR code scanning, digital signature verification,
/// scan logging, and history retrieval.
class ScanBloc extends Bloc<ScanEvent, ScanState> {
  final ApiServiceBase _api;

  ScanBloc({ApiServiceBase? apiService})
      : _api = apiService ?? ApiService(),
        super(const ScanInitial()) {
    on<QRCodeScanned>(_onQRCodeScanned);
    on<VerifyQRCode>(_onVerifyQRCode);
    on<LogScan>(_onLogScan);
    on<LoadHistory>(_onLoadHistory);
    on<LoadStats>(_onLoadStats);
    on<ClearScanResult>(_onClearScanResult);
    on<StartScanner>(_onStartScanner);
    on<StopScanner>(_onStopScanner);
  }

  Future<void> _onQRCodeScanned(
    QRCodeScanned event,
    Emitter<ScanState> emit,
  ) async {
    final qrCode = QRCodeData.fromRaw(event.rawData);
    emit(QRDetected(qrCode: qrCode));

    // Auto-verify with server
    add(VerifyQRCode(rawData: event.rawData));
  }

  Future<void> _onVerifyQRCode(
    VerifyQRCode event,
    Emitter<ScanState> emit,
  ) async {
    final currentState = state;
    if (currentState is QRDetected) {
      emit(QRVerifying(qrCode: currentState.qrCode));
    }

    try {
      final result = await _api.verifyQR(event.rawData);
      final payload = <String, dynamic>{};
      try {
        final decoded = Uri.tryParse(event.rawData)?.queryParameters ?? {};
        payload.addAll(decoded);
      } catch (_) {}

      final qrCode = QRCodeData.fromServerVerification(
        event.rawData,
        payload,
        result,
      );

      // Auto-log if authentic
      if (qrCode.verificationStatus == QRVerificationStatus.authentic) {
        try {
          await _api.logScan({
            'barcode': qrCode.barcode,
            'waste_type': qrCode.wasteType ?? 'general_biomedical',
            'category': qrCode.category ?? 'yellow',
            'weight_kg': qrCode.weightKg ?? 1.0,
            'source_facility': qrCode.source ?? 'Unknown',
            'department': qrCode.department ?? 'General',
            'container_type': qrCode.container ?? 'bag',
            'scanned_by': _api.currentUser?.username ?? 'Mobile Scanner',
            'notes': 'Scanned via Boon Flutter App — RSA verified authentic',
          });
          emit(QRVerified(qrCode: qrCode, autoLogged: true));
          return;
        } catch (_) {
          // Log failed but QR is still authentic
        }
      }

      emit(QRVerified(qrCode: qrCode));
    } catch (e) {
      // Verification failed — could be network error
      final qrCode = QRCodeData.fromRaw(event.rawData);
      final errorMsg = e.toString();
      if (errorMsg.contains('Connection') || errorMsg.contains('SocketException')) {
        emit(ScanError(
          message: 'Cannot verify QR: offline. Scan queued for verification.',
        ));
      } else {
        emit(ScanError(message: 'Verification failed: ${_extractError(e)}'));
      }
    }
  }

  Future<void> _onLogScan(
    LogScan event,
    Emitter<ScanState> emit,
  ) async {
    emit(QRLogging(qrCode: QRCodeData.fromRaw(event.data['barcode'] ?? '')));
    try {
      final result = await _api.logScan(event.data);
      final record = ScanRecord.fromJson(
        (result['scan_entry'] as Map<String, dynamic>?) ?? {},
      );
      emit(QRLogged(
        qrCode: QRCodeData.fromRaw(event.data['barcode'] ?? ''),
        record: record,
      ));
    } catch (e) {
      emit(ScanError(message: 'Failed to log: ${_extractError(e)}'));
    }
  }

  Future<void> _onLoadHistory(
    LoadHistory event,
    Emitter<ScanState> emit,
  ) async {
    try {
      final records = await _api.getScanHistory(
        limit: event.limit,
        offset: event.offset,
      );
      emit(HistoryLoaded(records: records, total: records.length));
    } catch (e) {
      emit(ScanError(message: 'Failed to load history: ${_extractError(e)}'));
    }
  }

  Future<void> _onLoadStats(
    LoadStats event,
    Emitter<ScanState> emit,
  ) async {
    try {
      final stats = await _api.getScannerStats();
      emit(StatsLoaded(stats: stats));
    } catch (e) {
      // Silently fail on stats
    }
  }

  Future<void> _onClearScanResult(
    ClearScanResult event,
    Emitter<ScanState> emit,
  ) async {
    emit(const ScanInitial());
  }

  Future<void> _onStartScanner(
    StartScanner event,
    Emitter<ScanState> emit,
  ) async {
    emit(const ScannerActive());
  }

  Future<void> _onStopScanner(
    StopScanner event,
    Emitter<ScanState> emit,
  ) async {
    emit(const ScannerStopped());
  }

  String _extractError(Object e) {
    final s = e.toString();
    if (s.contains('401')) return 'Session expired. Please login again.';
    if (s.contains('403')) return 'Access denied. Insufficient permissions.';
    if (s.contains('404')) return 'Resource not found.';
    if (s.contains('Connection') || s.contains('SocketException')) {
      return 'Server unreachable. Check connection.';
    }
    if (s.contains('timeout')) return 'Request timed out.';
    return s.length > 100 ? s.substring(0, 100) : s;
  }
}
