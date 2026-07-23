import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:boon_mobile_scanner/bloc/auth/auth_bloc.dart';
import 'package:boon_mobile_scanner/bloc/auth/auth_event.dart';
import 'package:boon_mobile_scanner/bloc/auth/auth_state.dart';
import 'package:boon_mobile_scanner/models/auth.dart';
import 'package:boon_mobile_scanner/models/user.dart';
import 'package:boon_mobile_scanner/services/api_service_base.dart';

// ── Mock ──────────────────────────────────────────────────────────────────
class MockApiService extends Mock implements ApiServiceBase {}

// ── Fixtures ───────────────────────────────────────────────────────────────
final mockUser = User(
  id: 'usr-001',
  username: 'admin',
  email: 'admin@boon.local',
  fullName: 'Admin User',
  role: UserRole.admin,
  isActive: true,
  createdAt: DateTime(2026, 7, 23),
);

final mockTokens = AuthTokens(
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  tokenType: 'bearer',
  expiresIn: 86400,
  user: mockUser,
);

final operatorUser = User(
  id: 'usr-002',
  username: 'op1',
  email: 'op1@boon.local',
  role: UserRole.operator,
);

void main() {
  late MockApiService mockApi;

  setUp(() {
    mockApi = MockApiService();
  });

  group('AuthBloc', () {
    test('initial state is AuthInitial', () {
      final bloc = AuthBloc(apiService: mockApi);
      expect(bloc.state, const AuthInitial());
    });

    group('LoginSubmitted', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthAuthenticated] on successful login',
        build: () {
          when(() => mockApi.login('admin', 'pass123'))
              .thenAnswer((_) async => mockTokens);
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(const LoginSubmitted(username: 'admin', password: 'pass123')),
        expect: () => [
          const AuthLoading(),
          AuthAuthenticated(user: mockUser),
        ],
        verify: (_) {
          verify(() => mockApi.login('admin', 'pass123')).called(1);
        },
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthError] on failed login',
        build: () {
          when(() => mockApi.login(any(), any()))
              .thenThrow(Exception('401'));
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(const LoginSubmitted(username: 'admin', password: 'wrong')),
        expect: () => [
          const AuthLoading(),
          const AuthError(message: 'Invalid credentials'),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'handles connection refused error',
        build: () {
          when(() => mockApi.login(any(), any()))
              .thenThrow(Exception('Connection refused'));
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(const LoginSubmitted(username: 'admin', password: 'pass')),
        expect: () => [
          const AuthLoading(),
          const AuthError(
              message: 'Cannot connect to server. Check your connection.'),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'handles timeout error',
        build: () {
          when(() => mockApi.login(any(), any()))
              .thenThrow(Exception('timeout'));
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) =>
            bloc.add(const LoginSubmitted(username: 'admin', password: 'pass')),
        expect: () => [
          const AuthLoading(),
          const AuthError(message: 'Request timed out. Server may be offline.'),
        ],
      );
    });

    group('RegisterSubmitted', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthRegisterSuccess] on success',
        build: () {
          when(() => mockApi.register(any()))
              .thenAnswer((_) async => operatorUser);
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const RegisterSubmitted(
          username: 'newop',
          email: 'new@boon.local',
          password: 'Pass1234!',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthRegisterSuccess(),
        ],
        verify: (_) {
          verify(() => mockApi.register(any())).called(1);
        },
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthError] on conflict (409)',
        build: () {
          when(() => mockApi.register(any()))
              .thenThrow(Exception('409'));
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(const RegisterSubmitted(
          username: 'exists',
          email: 'exists@boon.local',
          password: 'Pass1234!',
        )),
        expect: () => [
          const AuthLoading(),
          const AuthError(
              message: 'Username or email already exists'),
        ],
      );
    });

    group('LogoutRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits AuthUnauthenticated on logout',
        build: () {
          when(() => mockApi.logout()).thenAnswer((_) async {});
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(LogoutRequested()),
        expect: () => [
          const AuthUnauthenticated(message: 'Logged out successfully'),
        ],
        verify: (_) {
          verify(() => mockApi.logout()).called(1);
        },
      );
    });

    group('AuthCheckRequested', () {
      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthAuthenticated] when logged in',
        build: () {
          when(() => mockApi.checkAuth()).thenAnswer((_) async => true);
          when(() => mockApi.currentUser).thenReturn(mockUser);
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          AuthAuthenticated(user: mockUser),
        ],
      );

      blocTest<AuthBloc, AuthState>(
        'emits [AuthLoading, AuthUnauthenticated] when not logged in',
        build: () {
          when(() => mockApi.checkAuth()).thenAnswer((_) async => false);
          when(() => mockApi.currentUser).thenReturn(null);
          return AuthBloc(apiService: mockApi);
        },
        act: (bloc) => bloc.add(AuthCheckRequested()),
        expect: () => [
          const AuthLoading(),
          const AuthUnauthenticated(),
        ],
      );
    });
  });
}
