import 'user.dart';

/// Login request sent to backend.
class LoginRequest {
  final String username;
  final String password;

  LoginRequest({required this.username, required this.password});

  Map<String, dynamic> toJson() => {
        'username': username,
        'password': password,
      };
}

/// Registration request (admin only).
class RegisterRequest {
  final String username;
  final String email;
  final String password;
  final String? fullName;
  final String role;

  RegisterRequest({
    required this.username,
    required this.email,
    required this.password,
    this.fullName,
    this.role = 'operator',
  });

  Map<String, dynamic> toJson() => {
        'username': username,
        'email': email,
        'password': password,
        'full_name': fullName,
        'role': role,
      };
}

/// Token response from backend.
class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;
  final User user;

  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    this.tokenType = 'bearer',
    required this.expiresIn,
    required this.user,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String? ?? '',
      tokenType: json['token_type'] as String? ?? 'bearer',
      expiresIn: json['expires_in'] as int? ?? 86400,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

/// Auth state persisted locally.
class StoredAuth {
  final String accessToken;
  final String refreshToken;
  final User user;

  StoredAuth({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  Map<String, dynamic> toJson() => {
        'access_token': accessToken,
        'refresh_token': refreshToken,
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.fullName,
        'role': user.role.value,
        'is_active': user.isActive,
      };
}
