import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import '../firebase_options.dart';

/// Unified crash-reporting service wrapping Firebase Crashlytics.
///
/// Gracefully falls back to a no-op logger when Firebase is not configured
/// (e.g. local dev, CI without google-services.json, or unit tests).
///
/// Usage:
/// ```dart
/// await CrashlyticsService.initialize();
/// CrashlyticsService.log('User tapped scan');
/// CrashlyticsService.recordError(error, stack);
/// CrashlyticsService.setUserIdentifier('operator-42');
/// ```
class CrashlyticsService {
  CrashlyticsService._();

  static bool _initialized = false;

  /// Whether Firebase Crashlytics is active.
  static bool get isAvailable => _initialized;

  // ---------------------------------------------------------------------------
  // Initialization — must be called from main() after WidgetsFlutterBinding
  // ---------------------------------------------------------------------------

  /// Initialize Firebase and wire up global error handlers.
  ///
  /// This is safe to call even when Firebase is not configured — it will
  /// silently fall back to a no-op logger.
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );

      // ── Fatal Flutter framework errors ──────────────────────────────
      FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

      // ── Unhandled async errors ──────────────────────────────────────
      PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true; // Prevent the default error dialog.
      };

      // Enable crash data collection from the start.
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);

      _initialized = true;
      debugPrint('[Crashlytics] Initialized successfully.');
    } catch (e) {
      // Firebase not configured — silently fall back to no-op.
      debugPrint('[Crashlytics] Not available (Firebase not configured): $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Log a breadcrumb visible in the Firebase Crashlytics console.
  static void log(String message) {
    if (!_initialized) return;
    FirebaseCrashlytics.instance.log(message);
  }

  /// Record a non-fatal or fatal error with an optional reason tag.
  ///
  /// The [reason] field appears in the Firebase Crashlytics console as
  /// a searchable key, making it easy to group crashes by category
  /// (e.g. `verify_failed`, `qr_tampered`, `log_scan_failed`).
  static void recordError(
    Object error,
    StackTrace stack, {
    bool fatal = false,
    String? reason,
  }) {
    if (!_initialized) return;
    FirebaseCrashlytics.instance.recordError(
      error,
      stack,
      fatal: fatal,
      reason: reason,
    );
  }

  /// Associate the current session with a user (e.g. operator ID, email).
  static void setUserIdentifier(String identifier) {
    if (!_initialized) return;
    FirebaseCrashlytics.instance.setUserIdentifier(identifier);
  }

  /// Add a custom key/value pair to crash reports for filtering.
  static void setCustomKey(String key, String value) {
    if (!_initialized) return;
    FirebaseCrashlytics.instance.setCustomKey(key, value);
  }
}
