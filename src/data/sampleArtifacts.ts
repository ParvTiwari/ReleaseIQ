export interface SampleArtifactInfo {
  id: "android-manifest" | "ios-plist";
  platform: "Android" | "iOS";
  fileName: string;
  title: string;
  badge: string;
  description: string;
  targetSdkOrDeployment: string;
  keyHighlights: Array<{ label: string; tone: "danger" | "warning" | "success" | "neutral" }>;
  rawContent: string;
}

export const SAMPLE_ANDROID_MANIFEST_XML = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pulsefit.mobile"
    android:versionCode="240"
    android:versionName="2.4.0">

    <!-- Target SDK & Minimum Support Requirements -->
    <uses-sdk
        android:minSdkVersion="26"
        android:targetSdkVersion="34" />

    <!-- Core App Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Sensitive & Hardware Permissions (Audited by ReleaseIQ) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.BODY_SENSORS" />
    <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />

    <!-- Hardware Feature Declarations -->
    <uses-feature
        android:name="android.hardware.camera"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.sensor.heartrate"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.type.watch"
        android:required="false" />

    <application
        android:name=".PulseFitApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PulseFit"
        android:usesCleartextTraffic="false">

        <!-- Android Auto / Automotive Extension Descriptor -->
        <meta-data
            android:name="com.google.android.gms.car.application"
            android:resource="@xml/automotive_app_desc" />

        <!-- Wear OS Standalone Capability Descriptor -->
        <meta-data
            android:name="com.google.android.wearable.standalone"
            android:value="true" />

        <!-- Foreground Service Declaration (Android 14+ Requirement) -->
        <service
            android:name=".services.LiveWorkoutTrackingService"
            android:exported="false"
            android:foregroundServiceType="location|health" />

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.PulseFit.Splash">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

export const SAMPLE_IOS_INFO_PLIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Application Bundle Identification -->
    <key>CFBundleIdentifier</key>
    <string>com.medtrack.ios</string>
    <key>CFBundleName</key>
    <string>MedTrack</string>
    <key>CFBundleDisplayName</key>
    <string>MedTrack Health</string>
    <key>CFBundleShortVersionString</key>
    <string>3.8.1</string>
    <key>CFBundleVersion</key>
    <string>3810</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>MinimumOSVersion</key>
    <string>17.0</string>

    <!-- Apple App Store Privacy & Purpose Usage Strings (§5.1.1) -->
    <key>NSCameraUsageDescription</key>
    <string>MedTrack needs camera access to scan prescription barcodes and medication labels.</string>

    <key>NSPhotoLibraryUsageDescription</key>
    <string>Allow access to select medication prescription receipts from your photo library.</string>

    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Your location is used to locate nearby 24/7 pharmacies and emergency medical centers.</string>

    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Continuous location is used to alert you when entering your designated home medication zone.</string>

    <key>NSFaceIDUsageDescription</key>
    <string>Authenticate with Face ID to securely unlock your confidential health records.</string>

    <key>NSHealthShareUsageDescription</key>
    <string>MedTrack reads step count and heart rate metrics from Apple HealthKit for wellness tracking.</string>

    <key>NSHealthUpdateUsageDescription</key>
    <string>MedTrack saves water intake and workout logs to your Apple HealthKit profile.</string>

    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>Connects via Bluetooth Low Energy to authorized glucose meters and blood pressure monitors.</string>

    <!-- App Tracking Transparency (ATT) Framework (§5.1.2) -->
    <key>NSUserTrackingUsageDescription</key>
    <string>Your data will be used to measure advertising effectiveness and deliver relevant health tips.</string>

    <!-- App Transport Security (ATS) Policy -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
    </dict>

    <!-- Export Compliance (§5.1.3) -->
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>

    <!-- Background Execution Capabilities -->
    <key>UIBackgroundModes</key>
    <array>
        <string>location</string>
        <string>remote-notification</string>
        <string>fetch</string>
        <string>processing</string>
    </array>

    <!-- CarPlay & WatchKit Capabilities -->
    <key>CPTemplateApplicationSceneDelegate</key>
    <string>CarPlaySceneDelegate</string>
    <key>WKCompanionAppBundleIdentifier</key>
    <string>com.medtrack.ios.watchkitapp</string>
</dict>
</plist>`;

export const SAMPLE_ARTIFACTS: Record<"android-manifest" | "ios-plist", SampleArtifactInfo> = {
  "android-manifest": {
    id: "android-manifest",
    platform: "Android",
    fileName: "AndroidManifest.xml",
    title: "Android Manifest (Google Play Ready)",
    badge: "Target SDK 34 (Android 14+)",
    description: "Production Android Manifest with Target SDK 34, background location, camera, foreground services, Wear OS, and Android Auto descriptors.",
    targetSdkOrDeployment: "Android 14 (API 34)",
    keyHighlights: [
      { label: "Target SDK 34", tone: "success" },
      { label: "Background Location (Justification Required)", tone: "danger" },
      { label: "Camera & Audio Sensors", tone: "warning" },
      { label: "Foreground Service Type Declared", tone: "success" },
      { label: "No Cleartext HTTP (TLS Enforced)", tone: "success" },
      { label: "Android Auto & Wear OS Tags", tone: "neutral" },
    ],
    rawContent: SAMPLE_ANDROID_MANIFEST_XML,
  },
  "ios-plist": {
    id: "ios-plist",
    platform: "iOS",
    fileName: "Info.plist",
    title: "Apple iOS Info.plist (App Store Ready)",
    badge: "iOS 17.0+ / iOS 18 Ready",
    description: "Production Apple iOS Property List featuring App Store Guideline 5.1.1 Purpose Strings, ATT Tracking prompt description, HealthKit keys, ATS security, and background modes.",
    targetSdkOrDeployment: "iOS 17.0+ / Xcode 16",
    keyHighlights: [
      { label: "App Store Guideline 5.1.1 Purpose Strings", tone: "success" },
      { label: "App Tracking Transparency (ATT) Key", tone: "warning" },
      { label: "HealthKit & FaceID Keys", tone: "neutral" },
      { label: "App Transport Security (ATS) Enforced", tone: "success" },
      { label: "Background Location & Processing Modes", tone: "warning" },
      { label: "Export Encryption Compliance Declared", tone: "success" },
    ],
    rawContent: SAMPLE_IOS_INFO_PLIST_XML,
  },
};
