import 'package:equatable/equatable.dart';

import '../../models/qr_code.dart';
import '../../models/scan_record.dart';

abstract class ScanState extends Equatable {
  const ScanState();

  @override
  List<Object?> get props => [];
}

class ScanInitial extends ScanState {}

class ScannerStarting extends ScanState {}

class ScannerActive extends ScanState {
  final bool isScanning;

  const ScannerActive({this.isScanning = true});

  @override
  List<Object?> get props => [isScanning];
}

class ScannerStopped extends ScanState {}

class QRDetected extends ScanState {
  final QRCodeData qrCode;
  final bool isVerifying;

  const QRDetected({required this.qrCode, this.isVerifying = false});

  @override
  List<Object?> get props => [qrCode, isVerifying];
}

class QRVerifying extends ScanState {
  final QRCodeData qrCode;

  const QRVerifying({required this.qrCode});

  @override
  List<Object?> get props => [qrCode];
}

class QRVerified extends ScanState {
  final QRCodeData qrCode;
  final bool autoLogged;

  const QRVerified({required this.qrCode, this.autoLogged = false});

  @override
  List<Object?> get props => [qrCode, autoLogged];
}

class QRLogging extends ScanState {
  final QRCodeData qrCode;

  const QRLogging({required this.qrCode});

  @override
  List<Object?> get props => [qrCode];
}

class QRLogged extends ScanState {
  final QRCodeData qrCode;
  final ScanRecord? record;

  const QRLogged({required this.qrCode, this.record});

  @override
  List<Object?> get props => [qrCode, record];
}

class ScanError extends ScanState {
  final String message;

  const ScanError({required this.message});

  @override
  List<Object?> get props => [message];
}

class HistoryLoaded extends ScanState {
  final List<ScanRecord> records;
  final int total;

  const HistoryLoaded({required this.records, this.total = 0});

  @override
  List<Object?> get props => [records, total];
}

class StatsLoaded extends ScanState {
  final Map<String, dynamic> stats;

  const StatsLoaded({required this.stats});

  @override
  List<Object?> get props => [stats];
}

class CameraError extends ScanState {
  final String message;

  const CameraError({required this.message});

  @override
  List<Object?> get props => [message];
}
