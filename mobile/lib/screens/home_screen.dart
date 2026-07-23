import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/auth/auth_bloc.dart';
import '../bloc/auth/auth_event.dart';
import '../bloc/auth/auth_state.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import 'scan_screen.dart';
import 'history_screen.dart';
import 'admin_screen.dart';

/// Main home screen with role-based bottom navigation.
/// Admin sees: Scan, History, Admin
/// Operator sees: Scan, History
/// Viewer sees: History only
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const SizedBox.shrink();
        }

        final user = state.user;

        // Determine which screens are available based on role
        final screens = <Widget>[];
        final navItems = <BottomNavigationBarItem>[];

        // Scan tab (admin & operator only)
        if (user.canScan) {
          screens.add(const ScanScreen());
          navItems.add(const BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            activeIcon: Icon(Icons.qr_code_scanner),
            label: 'Scan',
          ));
        }

        // History tab (all roles)
        screens.add(const HistoryScreen());
        navItems.add(const BottomNavigationBarItem(
          icon: Icon(Icons.history),
          activeIcon: Icon(Icons.history),
          label: 'History',
        ));

        // Admin tab (admin only)
        if (user.isAdmin) {
          screens.add(const AdminScreen());
          navItems.add(const BottomNavigationBarItem(
            icon: Icon(Icons.admin_panel_settings),
            activeIcon: Icon(Icons.admin_panel_settings),
            label: 'Admin',
          ));
        }

        // Adjust index if out of bounds
        if (_currentIndex >= screens.length) {
          _currentIndex = 0;
        }

        return Scaffold(
          backgroundColor: const Color(0xFF030712),
          body: IndexedStack(
            index: _currentIndex,
            children: screens,
          ),
          bottomNavigationBar: Container(
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: Color(0xFF1E293B), width: 1),
              ),
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (i) => setState(() => _currentIndex = i),
              backgroundColor: const Color(0xFF0F172A),
              selectedItemColor: const Color(0xFF34D399),
              unselectedItemColor: const Color(0xFF64748B),
              type: BottomNavigationBarType.fixed,
              elevation: 0,
              items: navItems,
            ),
          ),
          // App bar with user info
          appBar: AppBar(
            backgroundColor: const Color(0xFF0F172A),
            elevation: 0,
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('🌿', style: TextStyle(fontSize: 18)),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Boon Scanner',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            actions: [
              // Role badge
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _roleColor(user.role).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _roleColor(user.role).withOpacity(0.3),
                  ),
                ),
                child: Text(
                  user.role.displayName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _roleColor(user.role),
                  ),
                ),
              ),
              // Logout
              IconButton(
                icon: const Icon(Icons.logout, color: Color(0xFF64748B), size: 22),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: const Color(0xFF111827),
                      title: const Text(
                        'Logout',
                        style: TextStyle(color: Colors.white),
                      ),
                      content: const Text(
                        'Are you sure you want to logout?',
                        style: TextStyle(color: Color(0xFF94A3B8)),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          child: const Text(
                            'Cancel',
                            style: TextStyle(color: Color(0xFF64748B)),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.of(ctx).pop();
                            context.read<AuthBloc>().add(const LogoutRequested());
                          },
                          child: const Text(
                            'Logout',
                            style: TextStyle(color: Color(0xFFEF4444)),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Color _roleColor(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return const Color(0xFFF59E0B);
      case UserRole.operator:
        return const Color(0xFF34D399);
      case UserRole.viewer:
        return const Color(0xFF60A5FA);
    }
  }
}
