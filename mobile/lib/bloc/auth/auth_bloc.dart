import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/auth.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// BLoC for all authentication-related business logic.
/// Manages login, registration, auto-auth check, and logout flows.
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiService _api;

  AuthBloc({ApiService? apiService})
      : _api = apiService ?? ApiService(),
        super(const AuthInitial()) {
    on<LoginSubmitted>(_onLoginSubmitted);
    on<RegisterSubmitted>(_onRegisterSubmitted);
    on<LogoutRequested>(_onLogoutRequested);
    on<AuthCheckRequested>(_onAuthCheckRequested);
  }

  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final auth = await _api.login(event.username, event.password);
      emit(AuthAuthenticated(user: auth.user));
    } catch (e) {
      emit(AuthError(message: _extractError(e)));
    }
  }

  Future<void> _onRegisterSubmitted(
    RegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      await _api.register(RegisterRequest(
        username: event.username,
        email: event.email,
        password: event.password,
        fullName: event.fullName,
        role: event.role,
      ));
      emit(const AuthRegisterSuccess());
    } catch (e) {
      emit(AuthError(message: _extractError(e)));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await _api.logout();
    emit(const AuthUnauthenticated(message: 'Logged out successfully'));
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final isAuthenticated = await _api.checkAuth();
    if (isAuthenticated && _api.currentUser != null) {
      emit(AuthAuthenticated(user: _api.currentUser!));
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  String _extractError(Object e) {
    final errorStr = e.toString();
    if (errorStr.contains('401')) return 'Invalid credentials';
    if (errorStr.contains('409')) return 'Username or email already exists';
    if (errorStr.contains('Connection refused') ||
        errorStr.contains('SocketException')) {
      return 'Cannot connect to server. Check your connection.';
    }
    if (errorStr.contains('timeout')) {
      return 'Request timed out. Server may be offline.';
    }
    return 'An error occurred. Please try again.';
  }
}
