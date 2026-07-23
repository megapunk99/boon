import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/scan/scan_bloc.dart';
import '../bloc/scan/scan_event.dart';
import '../models/qr_code.dart';
import '../models/scan_record.dart';
import '../bloc/scan/scan_state.dart';

/// Full-screen result view showing the QR code's verification status,
/// digital signature details, and scanned data.
class QRResultScreen extends StatelessWidget {
  final QRCodeData qrCode;

  const QRResultScreen({super.key, required this.qrCode});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'QR Verification',
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Status Hero ──────────────────────────────────
            Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _statusColor(context, qrCode.verificationStatus)
                          .withOpacity(0.15),
                    ),
                    child: Center(
                      child: Text(
                        qrCode.verificationStatus.emoji,
                        style: const TextStyle(fontSize: 40),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _statusTitle(qrCode.verificationStatus),
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: _statusColor(context, qrCode.verificationStatus),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    qrCode.verificationStatus.displayMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // ── QR Data ──────────────────────────────────────
            _sectionTitle('Scanned Data'),
            const SizedBox(height: 8),
            _infoCard([
              _infoRow('Barcode', qrCode.barcode, true),
              if (qrCode.wasteType != null)
                _infoRow('Waste Type', qrCode.wasteType!),
              if (qrCode.category != null)
                _infoRow('Category', qrCode.category!),
              if (qrCode.source != null)
                _infoRow('Facility', qrCode.source!),
              if (qrCode.weightKg != null)
                _infoRow('Weight', '${qrCode.weightKg!.toStringAsFixed(1)} kg'),
              if (qrCode.department != null)
                _infoRow('Department', qrCode.department!),
              if (qrCode.container != null)
                _infoRow('Container', qrCode.container!),
              if (qrCode.createdAt != null)
                _infoRow('Created', qrCode.createdAt!),
            ]),

            const SizedBox(height: 24),

            // ── Digital Certificate ──────────────────────────
            _sectionTitle('Digital Certificate'),
            const SizedBox(height: 8),
            _infoCard([
              _infoRow('Has Signature', qrCode.hasDigitalSignature ? '✅ Yes' : '❌ No'),
              _infoRow('Algorithm', 'RSA-2048 PSS SHA-256'),
              if (qrCode.hash != null)
                _infoRow('Payload Hash', qrCode.hash!.substring(0, 24) + '...', true),
              if (qrCode.signature != null)
                _infoRow(
                  'Signature',
                  qrCode.signature!.substring(0, 32) + '...',
                  true,
                ),
              _infoRow('System', qrCode.isBoonQR ? '✅ Boon' : '❓ Unknown'),
            ]),

            if (qrCode.expired == true && qrCode.daysOld != null) ...[
              const SizedBox(height: 24),
              _sectionTitle('⚠️ Expired QR'),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFF59E0B).withOpacity(0.3),
                  ),
                ),
                child: Text(
                  'This QR code is ${qrCode.daysOld} days old. '
                  'QR codes expire after 365 days for security. '
                  'Please generate a new one.',
                  style: const TextStyle(
                    color: Color(0xFFFBBF24),
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),

            // ── Action Buttons ───────────────────────────────
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.arrow_back, size: 18),
                    label: const Text('Back to Scanner'),
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
                if (qrCode.verificationStatus == QRVerificationStatus.authentic) ...[
                  const SizedBox(width: 12),
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
                          'notes': 'RSA-verified authentic QR',
                        }));
                        Navigator.of(context).pop();
                      },
                      icon: const Icon(Icons.save, size: 18),
                      label: const Text('Log & Continue'),
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
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF94A3B8),
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _infoCard(List<Widget> rows) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(children: rows),
    );
  }

  Widget _infoRow(String label, String value, [bool mono = false]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: const Color(0xFFE2E8F0),
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontFamily: mono ? 'monospace' : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _statusTitle(QRVerificationStatus status) {
    switch (status) {
      case QRVerificationStatus.authentic:
        return 'Authentic QR Code';
      case QRVerificationStatus.tampered:
        return '⚠️ Tampered QR Code';
      case QRVerificationStatus.expired:
        return '⏰ Expired QR Code';
      case QRVerificationStatus.unknown:
        return '❓ Unknown QR Code';
      case QRVerificationStatus.pending:
        return '⏳ Verifying...';
      case QRVerificationStatus.verifying:
        return '🔄 Verifying...';
    }
  }

  Color _statusColor(BuildContext context, QRVerificationStatus status) {
    switch (status) {
      case QRVerificationStatus.authentic:
        return const Color(0xFF34D399);
      case QRVerificationStatus.tampered:
        return const Color(0xFFEF4444);
      case QRVerificationStatus.expired:
        return const Color(0xFFF59E0B);
      case QRVerificationStatus.unknown:
        return const Color(0xFF94A3B8);
      case QRVerificationStatus.pending:
      case QRVerificationStatus.verifying:
        return const Color(0xFF60A5FA);
    }
  }
}
