# Flutter ProGuard Rules
# Keep Flutter engine classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep Kotlin metadata
-keepclassmembers class * {
    @kotlin.Metadata <fields>;
}

# Keep model classes for JSON serialization
-keep class com.boon.boon_mobile_scanner.** { *; }
