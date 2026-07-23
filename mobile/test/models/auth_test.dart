import 'package:flutter_test/flutter_test.dart';
import 'package:boon_mobile_scanner/models/auth.dart';
import 'package:boon_mobile_scanner/models/user.dart';

void main() {
  group('LoginRequest', () {
    test('toJson serializes correctly', () {
      final request = LoginRequest(
        username: 'admin',
        password: 'secret123',
      );

      final json = request.toJson();

      expect(json['username'], 'admin');
      expect(json['password'], 'secret123');
    });
  });

  group('RegisterRequest', () {
    test('toJson serializes with all fields', () {
      final request = RegisterRequest(
        username: 'newuser',
        email: 'new@boon.local',
        password: 'Pass1234!',
        fullName: 'New User',
        role: 'operator',
      );

      final json = request.toJson();

      expect(json['username'], 'newuser');
      expect(json['email'], 'new@boon.local');
      expect(json['password'], 'Pass1234!');
      expect(json['full_name'], 'New User');
      expect(json['role'], 'operator');
    });

    test('toJson serializes with defaults', () {
      final request = RegisterRequest(
        username: 'minimal',
        email: 'minimal@boon.local',
        password: 'MinPass1!',
      );

      final json = request.toJson();

      expect(json['username'], 'minimal');
      expect(json['email'], 'minimal@boon.local');
      expect(json['password'], 'MinPass1!');
      expect(json['full_name'], isNull);
      expect(json['role'], 'operator'); // default
    });
  });

  group('AuthTokens', () {
    const tokenJson = {
      'access_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxx',
      'refresh_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.yyy',
      'token_type': 'bearer',
      'expires_in': 86400,
      'user': {
        'id': 'usr-001',
        'username': 'admin',
        'email': 'admin@boon.local',
        'role': 'admin',
      },
    };

    test('fromJson parses complete token response', () {
      final tokens = AuthTokens.fromJson(tokenJson);

      expect(tokens.accessToken, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxx');
      expect(tokens.refreshToken, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.yyy');
      expect(tokens.tokenType, 'bearer');
      expect(tokens.expiresIn, 86400);
      expect(tokens.user.id, 'usr-001');
      expect(tokens.user.username, 'admin');
      expect(tokens.user.role, UserRole.admin);
    });

    test('fromJson uses defaults for optional fields', () {
      final tokens = AuthTokens.fromJson({
        'access_token': 'abc',
        'refresh_token': null,
        'user': {
          'id': 'usr-002',
          'username': 'op1',
          'email': 'op1@boon.local',
          'role': 'operator',
        },
      });

      expect(tokens.accessToken, 'abc');
      expect(tokens.refreshToken, ''); // null defaults to ''
      expect(tokens.tokenType, 'bearer'); // default
      expect(tokens.expiresIn, 86400); // default
    });

    test('AuthTokens round-trip preserves user data', () {
      final tokens = AuthTokens.fromJson(tokenJson);

      expect(tokens.user.isAdmin, isTrue);
      expect(tokens.user.canScan, isTrue);
      expect(tokens.user.displayName, 'admin');
    });
  });

  group('StoredAuth', () {
    test('toJson serializes correctly', () {
      final user = User(
        id: 'usr-001',
        username: 'admin',
        email: 'admin@boon.local',
        fullName: 'Admin User',
        role: UserRole.admin,
        isActive: true,
      );

      final stored = StoredAuth(
        accessToken: 'access123',
        refreshToken: 'refresh123',
        user: user,
      );

      final json = stored.toJson();

      expect(json['access_token'], 'access123');
      expect(json['refresh_token'], 'refresh123');
      expect(json['user_id'], 'usr-001');
      expect(json['username'], 'admin');
      expect(json['email'], 'admin@boon.local');
      expect(json['full_name'], 'Admin User');
      expect(json['role'], 'admin');
      expect(json['is_active'], true);
    });
  });
}
