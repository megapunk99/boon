import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/auth/auth_bloc.dart';
import '../bloc/auth/auth_event.dart';
import '../models/user.dart';
import '../services/api_service.dart';

/// Admin panel accessible only by admin role.
/// Features: user management, system diagnostics, all scans view.
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _api = ApiService();

  List<User> _users = [];
  Map<String, dynamic>? _diagnostics;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _api.getUsers(),
        _api.getSystemDiagnostics(),
      ]);

      if (!mounted) return;
      setState(() {
        _users = results[0] as List<User>;
        _diagnostics = results[1] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab bar
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              color: const Color(0xFF059669).withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            labelColor: const Color(0xFF34D399),
            unselectedLabelColor: const Color(0xFF64748B),
            labelStyle: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            tabs: const [
              Tab(text: 'Users'),
              Tab(text: 'System'),
              Tab(text: 'Register'),
            ],
          ),
        ),

        // Content
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF34D399)))
              : _error != null
                  ? _buildError()
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _buildUsersTab(),
                        _buildSystemTab(),
                        _buildRegisterTab(),
                      ],
                    ),
        ),
      ],
    );
  }

  // ── Users Tab ──────────────────────────────────────────────────────────

  Widget _buildUsersTab() {
    if (_users.isEmpty) {
      return const Center(
        child: Text(
          'No users found',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _users.length,
        itemBuilder: (context, index) => _buildUserCard(_users[index]),
      ),
    );
  }

  Widget _buildUserCard(User user) {
    final roleColors = {
      UserRole.admin: const Color(0xFFF59E0B),
      UserRole.operator: const Color(0xFF34D399),
      UserRole.viewer: const Color(0xFF60A5FA),
    };
    final dotColor = roleColors[user.role] ?? const Color(0xFF94A3B8);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: dotColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                user.displayName[0].toUpperCase(),
                style: TextStyle(
                  color: dotColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user.email,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // Role + Active toggle
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: dotColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  user.role.displayName,
                  style: TextStyle(
                    color: dotColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: user.isActive
                          ? const Color(0xFF34D399)
                          : const Color(0xFFEF4444),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    user.isActive ? 'Active' : 'Inactive',
                    style: TextStyle(
                      fontSize: 10,
                      color: user.isActive
                          ? const Color(0xFF34D399)
                          : const Color(0xFFEF4444),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── System Tab ─────────────────────────────────────────────────────────

  Widget _buildSystemTab() {
    if (_diagnostics == null) {
      return const Center(
        child: Text(
          'No diagnostics data',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
      );
    }

    final users = _diagnostics!['users'] as Map<String, dynamic>? ?? {};
    final db = _diagnostics!['database'] as Map<String, dynamic>? ?? {};
    final qr = _diagnostics!['qr_security'] as Map<String, dynamic>? ?? {};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF059669), Color(0xFF065F46)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('✅', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 8),
              const Text(
                'System Operational',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'v${_diagnostics!['version'] ?? '1.0.0'}',
                style: const TextStyle(
                  color: Color(0xFFA7F3D0),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Stats grid
        Row(
          children: [
            _statCard('Total Users', '${users['total'] ?? 0}', Icons.people),
            const SizedBox(width: 12),
            _statCard('Total Scans', '${db['total_scans'] ?? 0}', Icons.qr_code),
          ],
        ),
        const SizedBox(height: 12),

        // Users by role
        _sectionCard('Users by Role', () {
          final roles = users['by_role'] as Map<String, dynamic>? ?? {};
          return roles.entries.map((e) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    e.key,
                    style: const TextStyle(color: Color(0xFF94A3B8)),
                  ),
                  Text(
                    '${e.value}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            );
          }).toList();
        }),

        const SizedBox(height: 12),

        // QR Security
        _sectionCard('QR Security', () {
          return [
            _infoRow('Algorithm', qr['algorithm'] ?? 'RSA-2048'),
            _infoRow('Key Status', qr['key_status'] ?? 'Active'),
          ];
        }),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1E293B)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF34D399), size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard(String title, List<Widget> Function() builder) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          ...builder(),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8))),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // ── Register Tab ───────────────────────────────────────────────────────

  final _regFormKey = GlobalKey<FormState>();
  final _regUsernameCtrl = TextEditingController();
  final _regEmailCtrl = TextEditingController();
  final _regPasswordCtrl = TextEditingController();
  final _regNameCtrl = TextEditingController();
  String _regRole = 'operator';

  Widget _buildRegisterTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _regFormKey,
        child: Column(
          children: [
            const Text(
              'Register New User',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            _buildRegField('Username', _regUsernameCtrl,
                icon: Icons.person_outline),
            const SizedBox(height: 14),
            _buildRegField('Email', _regEmailCtrl,
                icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 14),
            _buildRegField('Full Name (optional)', _regNameCtrl,
                icon: Icons.badge_outlined),
            const SizedBox(height: 14),
            _buildRegField('Password', _regPasswordCtrl,
                icon: Icons.lock_outline, obscure: true),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _regRole,
              dropdownColor: const Color(0xFF111827),
              style: const TextStyle(color: Colors.white),
              decoration: _regInputDecoration('Role', Icons.shield_outlined),
              items: const [
                DropdownMenuItem(
                  value: 'operator',
                  child: Text('Operator'),
                ),
                DropdownMenuItem(
                  value: 'viewer',
                  child: Text('Viewer'),
                ),
                DropdownMenuItem(
                  value: 'admin',
                  child: Text('Administrator'),
                ),
              ],
              onChanged: (v) => _regRole = v ?? 'operator',
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _onRegister,
                icon: const Icon(Icons.person_add, size: 20),
                label: const Text('Register User'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegField(
    String label,
    TextEditingController controller, {
    IconData? icon,
    bool obscure = false,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: _regInputDecoration(label, icon),
      validator: (v) {
        if (v?.isEmpty ?? true) return 'Required';
        if (label == 'Password' && v!.length < 8) return 'Min 8 characters';
        if (label == 'Email' && !v!.contains('@')) return 'Invalid email';
        return null;
      },
    );
  }

  InputDecoration _regInputDecoration(String label, IconData? icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Color(0xFF64748B)),
      prefixIcon: icon != null
          ? Icon(icon, color: const Color(0xFF64748B), size: 20)
          : null,
      filled: true,
      fillColor: const Color(0xFF111827),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF1E293B)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF1E293B)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF059669), width: 2),
      ),
    );
  }

  void _onRegister() {
    if (!_regFormKey.currentState!.validate()) return;

    context.read<AuthBloc>().add(RegisterSubmitted(
          username: _regUsernameCtrl.text.trim(),
          email: _regEmailCtrl.text.trim(),
          password: _regPasswordCtrl.text,
          fullName: _regNameCtrl.text.trim().isEmpty
              ? null
              : _regNameCtrl.text.trim(),
          role: _regRole,
        ));

    // Clear form on success
    _regUsernameCtrl.clear();
    _regEmailCtrl.clear();
    _regPasswordCtrl.clear();
    _regNameCtrl.clear();
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🔌', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          const Text(
            'Failed to load admin data',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFFF87171),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
