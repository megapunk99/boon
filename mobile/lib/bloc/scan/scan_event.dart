import 'package:equatable/equatable.dart';

abstract class ScanEvent extends Equatable {
  const ScanEvent();

  @override
  List<Object?> get props => [];
}

/// A QR code was scanned by the camera.
class QRCodeScanned extends ScanEvent {
  final String rawData;

  const QRCodeScanned({required this.rawData});

  @override
  List<Object?> get props => [rawData];
}

/// Verify the scanned QR's RSA digital signature with the server.
class VerifyQRCode extends ScanEvent {
  final String rawData;

  const VerifyQRCode({required this.rawData});

  @override
  List<Object?> get props => [rawData];
}

/// Log the scanned item to the backend.
class LogScan extends ScanEvent {
  final Map<String, dynamic> data;

  const LogScan({required this.data});

  @override
  List<Object?> get props => [data];
}

/// Load scan history from backend.
class LoadHistory extends ScanEvent {
  final int limit;
  final int offset;

  const LoadHistory({this.limit = 50, this.offset = 0});

  @override
  List<Object?> get props => [limit, offset];
}

/// Load scanner statistics.
class LoadStats extends ScanEvent {}

/// Reset the current scan result (clear for next scan).
class ClearScanResult extends ScanEvent {}

/// Start the camera scanner.
class StartScanner extends ScanEvent {}

/// Stop the camera scanner.
class StopScanner extends ScanEvent {}
