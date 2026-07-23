import '../models/auth.dart';
import '../models/scan_record.dart';
import '../models/user.dart';

/// Abstract interface for the API service.
/// Allows injection of mock implementations in tests.
abstract class ApiServiceBase {
  // ── Configuration ──────────────────────────────────────────────────────
  String get baseUrl;
  set baseUrl(String url);

  // ── Auth State ─────────────────────────────────────────────────────────
  User? get currentUser;
  bool get isAuthenticated;
  bool get isAdmin;
  bool get canScan;

  Future<void> saveTokens(String accessToken, String refreshToken);
  Future<void> clearTokens();

  // ── Authentication ────────────────────────────────────────────────────
  Future<AuthTokens> login(String username, String password);
  Future<User> register(RegisterRequest request);
  Future<User> getMe();
  Future<void> logout();
  Future<bool> checkAuth();
  Future<String> getPublicKey();

  // ── QR / Scanner ──────────────────────────────────────────────────────
  Future<Map<String, dynamic>> generateQR(Map<String, dynamic> data);
  Future<Map<String, dynamic>> verifyQR(String qrData);
  Future<Map<String, dynamic>> logScan(Map<String, dynamic> data);
  Future<List<ScanRecord>> getScanHistory({int limit = 50, int offset = 0});
  Future<Map<String, dynamic>> getScannerStats();

  // ── Admin ─────────────────────────────────────────────────────────────
  Future<List<User>> getUsers();
  Future<Map<String, dynamic>> toggleUserActive(String userId);
  Future<Map<String, dynamic>> changeUserRole(
      String userId, String newRole);
  Future<List<ScanRecord>> getAllScans({int limit = 100, int offset = 0});
  Future<Map<String, dynamic>> getSystemDiagnostics();

  // ── Facilities / Data ─────────────────────────────────────────────────
  Future<List<String>> getFacilities();
}
