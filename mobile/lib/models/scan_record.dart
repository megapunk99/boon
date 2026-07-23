/// Scan record model representing a QR scan logged to the backend.
class ScanRecord {
  final String id;
  final String barcode;
  final String wasteType;
  final String category;
  final double weightKg;
  final String sourceFacility;
  final String department;
  final String containerType;
  final String scannedBy;
  final String? notes;
  final double? gpsLat;
  final double? gpsLng;
  final DateTime? scannedAt;
  final String status;
  final bool syncedToMain;

  ScanRecord({
    required this.id,
    required this.barcode,
    required this.wasteType,
    required this.category,
    required this.weightKg,
    required this.sourceFacility,
    required this.department,
    required this.containerType,
    required this.scannedBy,
    this.notes,
    this.gpsLat,
    this.gpsLng,
    this.scannedAt,
    this.status = 'logged',
    this.syncedToMain = true,
  });

  factory ScanRecord.fromJson(Map<String, dynamic> json) {
    return ScanRecord(
      id: json['id'] as String? ?? '',
      barcode: json['barcode'] as String? ?? '',
      wasteType: json['waste_type'] as String? ?? 'unknown',
      category: json['category'] as String? ?? 'yellow',
      weightKg: (json['weight_kg'] as num?)?.toDouble() ?? 0.0,
      sourceFacility: json['source_facility'] as String? ?? '',
      department: json['department'] as String? ?? '',
      containerType: json['container_type'] as String? ?? 'bag',
      scannedBy: json['scanned_by'] as String? ?? '',
      notes: json['notes'] as String?,
      gpsLat: (json['gps_lat'] as num?)?.toDouble(),
      gpsLng: (json['gps_lng'] as num?)?.toDouble(),
      scannedAt: json['scanned_at'] != null
          ? DateTime.tryParse(json['scanned_at'] as String)
          : null,
      status: json['status'] as String? ?? 'logged',
      syncedToMain: json['synced_to_main'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'barcode': barcode,
        'waste_type': wasteType,
        'category': category,
        'weight_kg': weightKg,
        'source_facility': sourceFacility,
        'department': department,
        'container_type': containerType,
        'scanned_by': scannedBy,
        'notes': notes,
        'gps_lat': gpsLat,
        'gps_lng': gpsLng,
      };

  /// Category display color (matches the web app).
  String get categoryEmoji {
    switch (category) {
      case 'yellow':
        return '🟡';
      case 'red':
        return '🔴';
      case 'white':
        return '⚪';
      case 'blue':
        return '🔵';
      default:
        return '⚪';
    }
  }

  String get formattedWeight => '${weightKg.toStringAsFixed(1)} kg';

  String get formattedDate =>
      scannedAt != null ? '${scannedAt!.day}/${scannedAt!.month}/${scannedAt!.year}' : '';
}
