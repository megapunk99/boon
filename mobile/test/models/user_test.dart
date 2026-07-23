import 'package:flutter_test/flutter_test.dart';
import 'package:boon_mobile_scanner/models/user.dart';

void main() {
  group('UserRole', () {
    test('fromString returns correct enum for valid values', () {
      expect(UserRole.fromString('admin'), UserRole.admin);
      expect(UserRole.fromString('operator'), UserRole.operator);
      expect(UserRole.fromString('viewer'), UserRole.viewer);
    });

    test('fromString returns viewer for unknown values', () {
      expect(UserRole.fromString('superadmin'), UserRole.viewer);
      expect(UserRole.fromString(''), UserRole.viewer);
      expect(UserRole.fromString('manager'), UserRole.viewer);
    });

    test('value returns correct string', () {
      expect(UserRole.admin.value, 'admin');
      expect(UserRole.operator.value, 'operator');
      expect(UserRole.viewer.value, 'viewer');
    });

    test('displayName returns correct human-readable name', () {
      expect(UserRole.admin.displayName, 'Administrator');
      expect(UserRole.operator.displayName, 'Operator');
      expect(UserRole.viewer.displayName, 'Viewer');
    });
  });

  group('User', () {
    const adminJson = {
      'id': 'usr-001',
      'username': 'admin',
      'email': 'admin@boon.local',
      'full_name': 'System Admin',
      'role': 'admin',
      'is_active': true,
      'created_at': '2026-01-15T10:30:00Z',
    };

    const operatorJson = {
      'id': 'usr-002',
      'username': 'op1',
      'email': 'op1@boon.local',
      'role': 'operator',
    };

    test('fromJson parses complete admin user', () {
      final user = User.fromJson(adminJson);

      expect(user.id, 'usr-001');
      expect(user.username, 'admin');
      expect(user.email, 'admin@boon.local');
      expect(user.fullName, 'System Admin');
      expect(user.role, UserRole.admin);
      expect(user.isActive, true);
      expect(user.createdAt, DateTime(2026, 1, 15, 10, 30, 0));
    });

    test('fromJson parses minimal operator user', () {
      final user = User.fromJson(operatorJson);

      expect(user.id, 'usr-002');
      expect(user.username, 'op1');
      expect(user.email, 'op1@boon.local');
      expect(user.fullName, isNull);
      expect(user.role, UserRole.operator);
      expect(user.isActive, true); // default
      expect(user.createdAt, isNull);
    });

    test('toJson serializes correctly', () {
      final user = User.fromJson(adminJson);
      final json = user.toJson();

      expect(json['id'], 'usr-001');
      expect(json['username'], 'admin');
      expect(json['email'], 'admin@boon.local');
      expect(json['full_name'], 'System Admin');
      expect(json['role'], 'admin');
      expect(json['is_active'], true);
    });

    test('role boolean getters work for admin', () {
      final user = User.fromJson(adminJson);

      expect(user.isAdmin, isTrue);
      expect(user.isOperator, isFalse);
      expect(user.isViewer, isFalse);
      expect(user.canScan, isTrue);
      expect(user.canManageUsers, isTrue);
    });

    test('role boolean getters work for operator', () {
      final user = User.fromJson(operatorJson);

      expect(user.isAdmin, isFalse);
      expect(user.isOperator, isTrue);
      expect(user.isViewer, isFalse);
      expect(user.canScan, isTrue);
      expect(user.canManageUsers, isFalse);
    });

    test('role boolean getters work for viewer', () {
      final user = User.fromJson({
        'id': 'usr-003',
        'username': 'viewer1',
        'email': 'viewer1@boon.local',
        'role': 'viewer',
      });

      expect(user.isAdmin, isFalse);
      expect(user.isOperator, isFalse);
      expect(user.isViewer, isTrue);
      expect(user.canScan, isFalse);
      expect(user.canManageUsers, isFalse);
    });

    test('displayName returns fullName when available', () {
      final user = User.fromJson(adminJson);
      expect(user.displayName, 'System Admin');
    });

    test('displayName returns username when fullName is null', () {
      final user = User.fromJson(operatorJson);
      expect(user.displayName, 'op1');
    });

    test('fromJson handles inactive user', () {
      final user = User.fromJson({
        'id': 'usr-004',
        'username': 'disabled',
        'email': 'disabled@boon.local',
        'role': 'operator',
        'is_active': false,
      });

      expect(user.isActive, isFalse);
    });

    test('fromJson handles unknown role gracefully', () {
      final user = User.fromJson({
        'id': 'usr-005',
        'username': 'unknown',
        'email': 'unknown@boon.local',
        'role': 'superadmin',
      });

      expect(user.role, UserRole.viewer); // falls back to viewer
    });
  });
}
