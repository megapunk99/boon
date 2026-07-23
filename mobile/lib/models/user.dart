/// User model reflecting the backend User schema with role-based access.
class User {
  final String id;
  final String username;
  final String email;
  final String? fullName;
  final UserRole role;
  final bool isActive;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    required this.role,
    this.isActive = true,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String?,
      role: UserRole.fromString(json['role'] as String? ?? 'operator'),
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'full_name': fullName,
        'role': role.value,
        'is_active': isActive,
      };

  bool get isAdmin => role == UserRole.admin;
  bool get isOperator => role == UserRole.operator;
  bool get isViewer => role == UserRole.viewer;
  bool get canScan => isAdmin || isOperator;
  bool get canManageUsers => isAdmin;

  String get displayName => fullName ?? username;
}

enum UserRole {
  admin('admin'),
  operator('operator'),
  viewer('viewer');

  final String value;
  const UserRole(this.value);

  static UserRole fromString(String s) {
    return UserRole.values.firstWhere(
      (r) => r.value == s,
      orElse: () => UserRole.viewer,
    );
  }

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Administrator';
      case UserRole.operator:
        return 'Operator';
      case UserRole.viewer:
        return 'Viewer';
    }
  }
}
