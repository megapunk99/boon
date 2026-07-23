import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginSubmitted extends AuthEvent {
  final String username;
  final String password;

  const LoginSubmitted({required this.username, required this.password});

  @override
  List<Object?> get props => [username, password];
}

class RegisterSubmitted extends AuthEvent {
  final String username;
  final String email;
  final String password;
  final String? fullName;
  final String role;

  const RegisterSubmitted({
    required this.username,
    required this.email,
    required this.password,
    this.fullName,
    this.role = 'operator',
  });

  @override
  List<Object?> get props => [username, email, password, fullName, role];
}

class LogoutRequested extends AuthEvent {}

class AuthCheckRequested extends AuthEvent {}
