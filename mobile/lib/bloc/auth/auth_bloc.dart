import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/auth.dart';
import '../../models/user.dart';
import '../../services/api_service_base.dart';
import '../../services/crashlytics_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// BLoC for all authentication-related business logic.
/// Manages login, registration, auto-auth check, and logout flows.
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiServiceBase _api;

  AuthBloc({ApiServiceBase? apiService})
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
      CrashlyticsService.setUserIdentifier(auth.user.id ?? auth.user.username);
      CrashlyticsService.log(
        'User logged in: ${auth.user.username} (${auth.user.role})',
      );
      CrashlyticsService.setCustomKey('role', auth.user.role ?? 'unknown');
      emit(AuthAuthenticated(user: auth.user));
    } catch (e) {
      CrashlyticsService.recordError(e, StackTrace.current,
          reason: 'login_failed');
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
      CrashlyticsService.log(
        'New user registered: ${event.username} (${event.role})',
      );
      emit(const AuthRegisterSuccess());
    } catch (e) {
      CrashlyticsService.recordError(e, StackTrace.current,
          reason: 'register_failed');
      emit(AuthError(message: _extractError(e)));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    CrashlyticsService.log('User logged out');
    await _api.logout();
    emit(const AuthUnauthenticated(message: 'Logged out successfully'));
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final isAuthenticated = await _api.checkAuth();
      if (isAuthenticated && _api.currentUser != null) {
        final user = _api.currentUser!;
        CrashlyticsService.setUserIdentifier(user.id ?? user.username);
        CrashlyticsService.setCustomKey('role', user.role ?? 'unknown');
        CrashlyticsService.log('Session restored: ${user.username}');
        emit(AuthAuthenticated(user: user));
      } else {
        emit(const AuthUnauthenticated());
      }
    } catch (e) {
      CrashlyticsService.recordError(e, StackTrace.current,
          reason: 'auth_check_failed');
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
