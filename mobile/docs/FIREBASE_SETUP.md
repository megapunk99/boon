# Firebase Crashlytics Setup

## Prerequisites

- A Google account with access to [Firebase Console](https://console.firebase.google.com)
- Flutter SDK installed on your development machine

## Step 1: Install the FlutterFire CLI

```bash
dart pub global activate flutterfire_cli
```

## Step 2: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** (or select an existing one)
3. Follow the wizard — you do **not** need Google Analytics for Crashlytics

## Step 3: Register your Android app

During `flutterfire configure`, the CLI will:
- Register your app's Android package name: `com.boon.boon_mobile_scanner`
- Register iOS bundle ID: `com.boon.boon_mobile_scanner`
- Download `google-services.json` → `android/app/`
- Overwrite `lib/firebase_options.dart` with real config values
- Update Gradle files automatically

Run:

```bash
cd mobile

# Add Android support (required for Firebase)
flutterfire configure \
  --project=YOUR_FIREBASE_PROJECT_ID \
  --android-package-name=com.boon.boon_mobile_scanner \
  --ios-bundle-id=com.boon.boon_mobile_scanner \
  --platforms=android,ios
```

Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID.

## Step 4: Enable Crashlytics in Firebase Console

1. In the Firebase Console, go to **Crashlytics**
2. Click **Get Started** and follow the prompts
3. Enable Crashlytics for both Android and iOS

## Step 5: Verify the integration

Build a test APK and force a crash to verify:

```dart
// Temporarily add this to test:
FirebaseCrashlytics.instance.crash();
```

Run the app, then check the Firebase Console → Crashlytics dashboard.
The crash should appear within a few minutes.

## Without Firebase (Development / CI)

The app **works fine without Firebase**. `CrashlyticsService.initialize()` wraps
everything in a `try/catch` — if Firebase isn't configured, it silently falls
back to a no-op logger. No crashes at startup, no build failures.

In CI, the `firebase_ci_setup.sh` script auto-detects whether
`google-services.json` exists and adjusts the Gradle plugin accordingly:

| `google-services.json` | Gradle plugin | Crashlytics |
|------------------------|---------------|-------------|
| Present                | Applied       | ✅ Full     |
| Missing                | `apply false` | ⚪ No-op    |

## Architecture

```
main()
 ├── CrashlyticsService.initialize()
 │    ├── Firebase.initializeApp(options: DefaultFirebaseOptions...)
 │    ├── FlutterError.onError → Crashlytics
 │    ├── PlatformDispatcher.onError → Crashlytics
 │    └── everything wrapped in try/catch
 │
 └── runApp()
      └── AuthBloc
           ├── on login → setUserIdentifier + log
           ├── on auth check → setUserIdentifier + log
           └── on error → recordError
```

## Uninstalling

If you want to remove Firebase entirely:

1. Delete `lib/firebase_options.dart`
2. Remove `firebase_core` and `firebase_crashlytics` from `pubspec.yaml`
3. Revert `android/build.gradle` (remove Google Services classpath)
4. Delete `android/app/google-services.json` (if present)
5. Run `flutter pub get`
