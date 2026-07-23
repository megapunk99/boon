import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../bloc/scan/scan_bloc.dart';
import '../bloc/scan/scan_event.dart';
import '../bloc/scan/scan_state.dart';
import '../models/qr_code.dart';

/// Main QR scanner screen using mobile_scanner package.
/// Handles camera, QR detection, and displays verification result.
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  MobileScannerController? _scannerController;
  bool _torchEnabled = false;
  bool _isScanning = true;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      torchEnabled: false,
    );
    context.read<ScanBloc>().add(const StartScanner());
  }

  @override
  void dispose() {
    _scannerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ScanBloc, ScanState>(
      listener: (context, state) {
        if (state is QRDetected || state is QRVerified) {
          setState(() => _isScanning = false);
        }
        if (state is ScanInitial || state is ScannerActive) {
          setState(() => _isScanning = true);
        }
        if (state is ScanError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: const Color(0xFFEF4444),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      },
      builder: (context, state) {
        return Column(
          children: [
            // Camera viewfinder
            Expanded(
              child: Stack(
                children: [
                  // Camera preview
                  MobileScanner(
                    controller: _scannerController,
                    onDetect: (capture) {
                      if (!_isScanning) return;
                      final barcode = capture.barcodes.firstOrNull;
                      if (barcode?.rawValue != null &&
                          barcode!.rawValue!.isNotEmpty) {
                        setState(() => _isScanning = false);
                        context.read<ScanBloc>().add(
                              QRCodeScanned(rawData: barcode.rawValue!),
                            );
                      }
                    },
                  ),

                  // Scan overlay frame
                  IgnorePointer(
                    child: Container(
                      color: Colors.black.withOpacity(0.3),
                      child: Center(
                        child: Container(
                          width: 260,
                          height: 260,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _isScanning
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFFF59E0B),
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF34D399).withOpacity(0.2),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: CustomPaint(
                            painter: _CornerPainter(
                              color: _isScanning
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFFF59E0B),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Top status overlay
                  Positioned(
                    top: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isScanning
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFFF59E0B),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isScanning ? 'Scanning...' : 'QR Detected',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Torch button
                  Positioned(
                    top: 16,
                    right: 16,
                    child: GestureDetector(
                      onTap: () {
                        _torchEnabled = !_torchEnabled;
                        _scannerController?.toggleTorch();
                      },
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          _torchEnabled ? Icons.flash_on : Icons.flash_off,
                          color: _torchEnabled
                              ? const Color(0xFFFBBF24)
                              : Colors.white,
                          size: 22,
                        ),
                      ),
                    ),
                  ),

                  // Scanning indicator
                  if (_isScanning)
                    Positioned(
                      bottom: 30,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '📷',
                                style: TextStyle(fontSize: 16),
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Point at a Boon QR code',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Result panel
            if (state is QRDetected || state is QRVerifying || state is QRVerified)
              _buildResultPanel(context, state),
            if (state is ScanError)
              _buildErrorPanel(context, state),
          ],
        );
      },
    );
  }

  Widget _buildResultPanel(BuildContext context, ScanState state) {
    QRCodeData? qrCode;
    bool isVerifying = false;
    bool isLogged = false;

    if (state is QRDetected) {
      qrCode = state.qrCode;
    } else if (state is QRVerifying) {
      qrCode = state.qrCode;
      isVerifying = true;
    } else if (state is QRVerified) {
      qrCode = state.qrCode;
      isLogged = state.autoLogged;
    }

    if (qrCode == null) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: const Border(
          top: BorderSide(color: Color(0xFF1E293B)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Status badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _statusColor(qrCode.verificationStatus).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _statusColor(qrCode.verificationStatus).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      isVerifying
                          ? '🔄'
                          : qrCode.verificationStatus.emoji,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isVerifying
                          ? 'Verifying...'
                          : qrCode.verificationStatus.displayMessage,
                      style: TextStyle(
                        color: _statusColor(qrCode.verificationStatus),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              if (isLogged) ...[
                const SizedBox(width: 8),
                const Text(
                  '✅ Auto-logged',
                  style: TextStyle(
                    color: Color(0xFF34D399),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),

          // Barcode
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF030712),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Text(
              qrCode.barcode,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 14,
                color: Color(0xFF34D399),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // QR Data fields
          if (qrCode.wasteType != null)
            _dataRow('Waste', qrCode.wasteType!),
          if (qrCode.category != null)
            _dataRow('Category', '${qrCode.category} ${qrCode.formattedCategory}'),
          if (qrCode.source != null)
            _dataRow('Facility', qrCode.source!),
          if (qrCode.weightKg != null)
            _dataRow('Weight', '${qrCode.weightKg!.toStringAsFixed(1)} kg'),
          if (qrCode.department != null)
            _dataRow('Department', qrCode.department!),

          const SizedBox(height: 16),

          // Action buttons
          Row(
            children: [
              // Scan Again
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.read<ScanBloc>().add(const ClearScanResult());
                  },
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Scan Again'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF94A3B8),
                    side: const BorderSide(color: Color(0xFF1E293B)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Log if not auto-logged
              if (!isLogged &&
                  qrCode.verificationStatus == QRVerificationStatus.authentic)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      context.read<ScanBloc>().add(LogScan(data: {
                        'barcode': qrCode.barcode,
                        'waste_type': qrCode.wasteType ?? 'general_biomedical',
                        'category': qrCode.category ?? 'yellow',
                        'weight_kg': qrCode.weightKg ?? 1.0,
                        'source_facility': qrCode.source ?? '',
                        'department': qrCode.department ?? 'General',
                        'container_type': qrCode.container ?? 'bag',
                        'scanned_by': 'Mobile Scanner',
                      }));
                    },
                    icon: const Icon(Icons.save, size: 18),
                    label: const Text('Log to System'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorPanel(BuildContext context, ScanError state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: const Border(
          top: BorderSide(color: Color(0xFF1E293B)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('❌', style: TextStyle(fontSize: 32)),
          const SizedBox(height: 12),
          Text(
            state.message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFFF87171), fontSize: 14),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              context.read<ScanBloc>().add(const ClearScanResult());
            },
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFFE2E8F0),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(QRVerificationStatus status) {
    switch (status) {
      case QRVerificationStatus.authentic:
        return const Color(0xFF34D399);
      case QRVerificationStatus.tampered:
        return const Color(0xFFEF4444);
      case QRVerificationStatus.expired:
        return const Color(0xFFF59E0B);
      case QRVerificationStatus.pending:
      case QRVerificationStatus.verifying:
        return const Color(0xFF60A5FA);
      case QRVerificationStatus.unknown:
        return const Color(0xFF94A3B8);
    }
  }
}

/// Custom painter for the scan frame corner decorations.
class _CornerPainter extends CustomPainter {
  final Color color;

  _CornerPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    const cornerLength = 24.0;

    // Top-left
    canvas.drawLine(
      const Offset(0, cornerLength),
      const Offset(0, 0),
      paint,
    );
    canvas.drawLine(
      const Offset(0, 0),
      const Offset(cornerLength, 0),
      paint,
    );

    // Top-right
    canvas.drawLine(
      Offset(size.width - cornerLength, 0),
      Offset(size.width, 0),
      paint,
    );
    canvas.drawLine(
      Offset(size.width, 0),
      Offset(size.width, cornerLength),
      paint,
    );

    // Bottom-left
    canvas.drawLine(
      const Offset(0, size.height - cornerLength),
      const Offset(0, size.height),
      paint,
    );
    canvas.drawLine(
      const Offset(0, size.height),
      const Offset(cornerLength, size.height),
      paint,
    );

    // Bottom-right
    canvas.drawLine(
      Offset(size.width - cornerLength, size.height),
      Offset(size.width, size.height),
      paint,
    );
    canvas.drawLine(
      Offset(size.width, size.height - cornerLength),
      Offset(size.width, size.height),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
