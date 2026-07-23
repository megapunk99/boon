import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/api_service.dart';

/// Settings screen for configuring the backend server URL.
/// Accessed from the HomeScreen app bar or LoginScreen.
/// Persists the URL so it survives app restarts.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _urlController = TextEditingController();
  final FocusNode _urlFocusNode = FocusNode();

  final _api = ApiService();

  bool _isTesting = false;
  bool _isSaving = false;
  String? _connectionStatus;
  bool? _connectionSuccess;
  bool _hasChanges = false;

  // Quick presets
  static const _presets = [
    _Preset('Android Emulator', 'http://10.0.2.2:8000', Icons.phone_android),
    _Preset('iOS Simulator', 'http://localhost:8000', Icons.phone_iphone),
    _Preset('Real Device (USB)', 'http://192.168.1.100:8000', Icons.wifi),
  ];

  @override
  void initState() {
    super.initState();
    _urlController.text = _api.baseUrl;
    _urlController.addListener(_onUrlChanged);
  }

  @override
  void dispose() {
    _urlController.removeListener(_onUrlChanged);
    _urlController.dispose();
    _urlFocusNode.dispose();
    super.dispose();
  }

  void _onUrlChanged() {
    // Sanitize: strip trailing slash before comparing with stored URL
    var input = _urlController.text.trim();
    if (input.endsWith('/') && input.length > 7) {
      input = input.substring(0, input.length - 1);
    }
    final changed = input != _api.baseUrl;
    if (changed != _hasChanges) {
      setState(() => _hasChanges = changed);
    }
  }

  Future<void> _testConnection({String? url}) async {
    setState(() {
      _isTesting = true;
      _connectionStatus = null;
      _connectionSuccess = null;
    });

    final result = await _api.testConnection(url: url ?? _urlController.text.trim());

    if (!mounted) return;
    setState(() {
      _isTesting = false;
      _connectionSuccess = result['success'] as bool;
      _connectionStatus = result['message'] as String?;
    });
  }

  Future<void> _saveUrl() async {
    final url = _urlController.text.trim();
    if (!_isValidUrl(url)) {
      _showSnackBar('Please enter a valid URL (e.g., http://192.168.1.5:8000)');
      return;
    }

    setState(() => _isSaving = true);

    _api.baseUrl = url;
    await _api.saveBaseUrl();
    _hasChanges = false;

    if (!mounted) return;
    setState(() => _isSaving = false);
    _showSnackBar('Server URL saved successfully');
  }

  bool _isValidUrl(String url) {
    final trimmed = url.trim().toLowerCase();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return false;
    }
    final uri = Uri.tryParse(trimmed);
    return uri != null && uri.host.isNotEmpty;
  }

  void _applyPreset(String url) {
    _urlController.text = url;
    _hasChanges = true;
    _connectionStatus = null;
    _connectionSuccess = null;
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: const Text(
          'Server Settings',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF94A3B8)),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ──────────────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.dns_outlined,
                      color: Color(0xFF34D399),
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Server Connection',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Enter the URL of your Boon backend server.\n'
                    'Your device and server must be on the same network.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: const Color(0xFF94A3B8),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── URL Input ───────────────────────────────────────────
            const Text(
              'Server URL',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _urlController,
              focusNode: _urlFocusNode,
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'monospace',
                fontSize: 14,
              ),
              decoration: InputDecoration(
                hintText: 'http://192.168.1.100:8000',
                hintStyle: const TextStyle(
                  color: Color(0xFF475569),
                  fontFamily: 'monospace',
                ),
                prefixIcon: const Icon(
                  Icons.link,
                  color: Color(0xFF64748B),
                  size: 20,
                ),
                suffixIcon: _urlController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Color(0xFF64748B), size: 18),
                        onPressed: () {
                          _urlController.clear();
                          _urlFocusNode.requestFocus();
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFF111827),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
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
              ),
              keyboardType: TextInputType.url,
              textInputAction: TextInputAction.go,
              onSubmitted: (_) => _testConnection(),
            ),

            const SizedBox(height: 12),

            // ── Quick Presets ───────────────────────────────────────
            const Text(
              'Quick Select',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: _presets.map((preset) {
                final isActive = _urlController.text.trim() == preset.url;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: preset == _presets.last ? 0 : 8.0,
                    ),
                    child: GestureDetector(
                      onTap: () => _applyPreset(preset.url),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFF059669).withOpacity(0.15)
                              : const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isActive
                                ? const Color(0xFF059669).withOpacity(0.5)
                                : const Color(0xFF1E293B),
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              preset.icon,
                              color: isActive
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF64748B),
                              size: 20,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              preset.label,
                              style: TextStyle(
                                color: isActive
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF94A3B8),
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // ── Action Buttons ──────────────────────────────────────
            Row(
              children: [
                // Test Connection
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: _isTesting ? null : () => _testConnection(),
                      icon: _isTesting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Color(0xFF34D399),
                              ),
                            )
                          : Icon(
                              _connectionSuccess == true
                                  ? Icons.check_circle
                                  : Icons.wifi_find,
                              size: 18,
                              color: _connectionSuccess == true
                                  ? const Color(0xFF34D399)
                                  : _connectionSuccess == false
                                      ? const Color(0xFFEF4444)
                                      : null,
                            ),
                      label: Text(
                        _isTesting ? 'Testing...' : 'Test Connection',
                        style: const TextStyle(fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF94A3B8),
                        side: BorderSide(
                          color: _connectionSuccess == true
                              ? const Color(0xFF059669)
                              : _connectionSuccess == false
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF1E293B),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Save
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: (_isSaving || !_hasChanges) ? null : _saveUrl,
                      icon: _isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.save, size: 18),
                      label: Text(_isSaving ? 'Saving...' : 'Save URL'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor:
                            const Color(0xFF059669).withOpacity(0.3),
                        disabledForegroundColor: Colors.white38,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // ── Connection Status ───────────────────────────────────
            if (_connectionStatus != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: (_connectionSuccess == true
                          ? const Color(0xFF059669)
                          : const Color(0xFFEF4444))
                      .withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: (_connectionSuccess == true
                            ? const Color(0xFF059669)
                            : const Color(0xFFEF4444))
                        .withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _connectionSuccess == true
                          ? Icons.check_circle
                          : Icons.error_outline,
                      color: _connectionSuccess == true
                          ? const Color(0xFF34D399)
                          : const Color(0xFFF87171),
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _connectionStatus!,
                        style: TextStyle(
                          color: _connectionSuccess == true
                              ? const Color(0xFFA7F3D0)
                              : const Color(0xFFFCA5A5),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 32),

            // ── Tips Section ────────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb_outline,
                          color: Color(0xFFFBBF24), size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'Connection Tips',
                        style: TextStyle(
                          color: Color(0xFFFBBF24),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _tipItem(
                    Icons.phone_android,
                    'Android Emulator',
                    'Use http://10.0.2.2:8000 (maps to host localhost)',
                  ),
                  const SizedBox(height: 10),
                  _tipItem(
                    Icons.phone_iphone,
                    'iOS Simulator',
                    'Use http://localhost:8000',
                  ),
                  const SizedBox(height: 10),
                  _tipItem(
                    Icons.wifi,
                    'Real Android Device',
                    'Find your computer\'s local IP (ipconfig) and use http://YOUR_IP:8000',
                  ),
                  const SizedBox(height: 10),
                  _tipItem(
                    Icons.security,
                    'Firewall',
                    'Ensure port 8000 is open on your computer\'s firewall',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Current Server Info ─────────────────────────────────
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF111827),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _connectionSuccess == true
                            ? const Color(0xFF34D399)
                            : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Current: ${_api.baseUrl}',
                      style: TextStyle(
                        color: _connectionSuccess == true
                            ? const Color(0xFF34D399)
                            : const Color(0xFF64748B),
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _tipItem(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF64748B), size: 16),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFFE2E8F0),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                description,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Quick-preset data class for common server configurations.
class _Preset {
  final String label;
  final String url;
  final IconData icon;

  const _Preset(this.label, this.url, this.icon);
}
