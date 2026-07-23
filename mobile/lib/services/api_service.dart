import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth.dart';
import '../models/scan_record.dart';
import '../models/user.dart';
import '../models/qr_code.dart';

import 'api_service_base.dart';

/// Singleton API service for all backend communication.
/// Handles JWT authentication, token refresh, and error handling.
class ApiService extends ApiServiceBase {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Token storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  // Backend URL — configurable
  String _baseUrl = 'http://10.0.2.2:8000'; // Android emulator default
  String get baseUrl => _baseUrl;
  set baseUrl(String url) => _baseUrl = url;

  // Auth state
  User? _currentUser;
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;
  bool get canScan => _currentUser?.canScan ?? false;

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    // Auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth header if available
        final token = await _storage.read(key: _accessTokenKey);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        // Prepend base URL
        options.path = '$_baseUrl$_apiPrefix${options.path}';
        handler.next(options);
      },
      onError: (error, handler) async {
        // Auto-refresh on 401
        if (error.response?.statusCode == 401) {
          final refreshed = await _tryRefreshToken();
          if (refreshed) {
            // Retry the original request with new token
            final opts = error.requestOptions;
            final token = await _storage.read(key: _accessTokenKey);
            opts.headers['Authorization'] = 'Bearer $token';
            try {
              final response = await _dio.fetch(opts);
              handler.resolve(response);
              return;
            } catch (_) {}
          }
        }
        handler.next(error);
      },
    ));
  }

  String get _apiPrefix => '/api/v1';

  // ── Token Management ──────────────────────────────────────────────────

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    _currentUser = null;
  }

  Future<bool> _tryRefreshToken() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final response = await Dio().post(
        '$_baseUrl$_apiPrefix/auth/refresh',
        data: {'refresh_token': refreshToken},
        options: Options(
          headers: {'Content-Type': 'application/json'},
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

      if (response.statusCode == 200) {
        final auth = AuthTokens.fromJson(response.data as Map<String, dynamic>);
        await saveTokens(auth.accessToken, auth.refreshToken);
        _currentUser = auth.user;
        return true;
      }
    } catch (_) {}
    return false;
  }

  // ── Authentication ────────────────────────────────────────────────────

  Future<AuthTokens> login(String username, String password) async {
    final response = await _dio.post(
      '/auth/login',
      data: LoginRequest(username: username, password: password).toJson(),
    );
    final auth = AuthTokens.fromJson(response.data as Map<String, dynamic>);
    await saveTokens(auth.accessToken, auth.refreshToken);
    _currentUser = auth.user;
    return auth;
  }

  Future<User> register(RegisterRequest request) async {
    final response = await _dio.post('/auth/register', data: request.toJson());
    return User.fromJson(response.data as Map<String, dynamic>);
  }

  Future<User> getMe() async {
    final response = await _dio.get('/auth/me');
    _currentUser = User.fromJson(response.data as Map<String, dynamic>);
    return _currentUser!;
  }

  Future<void> logout() async {
    await clearTokens();
  }

  Future<bool> checkAuth() async {
    try {
      await getMe();
      return true;
    } catch (_) {
      await clearTokens();
      return false;
    }
  }

  Future<String> getPublicKey() async {
    final response = await _dio.get('/auth/public-key');
    return (response.data as Map<String, dynamic>)['public_key_pem'] as String? ?? '';
  }

  // ── QR / Scanner ──────────────────────────────────────────────────────

  Future<Map<String, dynamic>> generateQR(Map<String, dynamic> data) async {
    final response = await _dio.post('/scanner/generate-qr', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyQR(String qrData) async {
    final response = await _dio.post('/scanner/verify-qr', data: {'qr_data': qrData});
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> logScan(Map<String, dynamic> data) async {
    final response = await _dio.post('/scanner/log-scan', data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<List<ScanRecord>> getScanHistory({int limit = 50, int offset = 0}) async {
    final response = await _dio.get('/scanner/history', queryParameters: {
      'limit': limit,
      'offset': offset,
    });
    final data = response.data as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => ScanRecord.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getScannerStats() async {
    final response = await _dio.get('/scanner/stats');
    return response.data as Map<String, dynamic>;
  }

  // ── Admin ─────────────────────────────────────────────────────────────

  Future<List<User>> getUsers() async {
    final response = await _dio.get('/admin/users');
    final data = response.data as Map<String, dynamic>;
    final users = data['users'] as List<dynamic>? ?? [];
    return users
        .map((e) => User.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> toggleUserActive(String userId) async {
    final response = await _dio.patch('/admin/users/$userId/toggle-active');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> changeUserRole(String userId, String newRole) async {
    final response = await _dio.patch(
      '/admin/users/$userId/role',
      queryParameters: {'new_role': newRole},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<List<ScanRecord>> getAllScans({int limit = 100, int offset = 0}) async {
    final response = await _dio.get('/admin/scans', queryParameters: {
      'limit': limit,
      'offset': offset,
    });
    final data = response.data as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => ScanRecord.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getSystemDiagnostics() async {
    final response = await _dio.get('/admin/system');
    return response.data as Map<String, dynamic>;
  }

  // ── Facilities / Data ─────────────────────────────────────────────────

  Future<List<String>> getFacilities() async {
    try {
      final response = await _dio.get('/waste/facilities');
      final data = response.data as Map<String, dynamic>;
      final facilities = data['facilities'] as List<dynamic>? ?? [];
      return facilities.map((e) => e['name'] as String? ?? '').toList();
    } catch (_) {
      return [];
    }
  }
}
