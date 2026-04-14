# Development Build Guide for Physical Device

## Problem
Expo Go on Play Store doesn't support SDK 55 yet, causing "incompatible SDK version" error.

## Solution: Create Custom Development Build

### Prerequisites
- Android device with USB debugging enabled
- USB cable to connect device to PC
- Android SDK installed (via Android Studio)

### Step 1: Enable USB Debugging on Your Phone

1. **Enable Developer Options:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
   - Enable "Install via USB" (if available)
   - Enable "Verify apps over USB" (turn OFF if it causes issues)

3. **Connect Device:**
   - Connect phone to PC via USB
   - On phone, select "File Transfer" mode when prompted
   - Accept the "Allow USB debugging?" dialog
   - Verify connection:
     ```bash
     adb devices
     ```
   - You should see your device listed

### Step 2: Stop Conflicting Processes

The build may fail if port 8081 is in use. To fix:

```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace <PID> with the actual number shown)
taskkill /PID <PID> /F
```

### Step 3: Build Development APK

```bash
# Clean and build
npm run build:dev

# OR if you need to clear cache first
npm run build:dev:clean
```

**What this does:**
- Creates native Android project
- Builds debug APK with SDK 55
- Installs directly on your connected device
- Starts Metro bundler on available port

### Step 4: Verify Installation

After build completes:
1. Look for "Agro Mobile" or "agro_new_ver_mobile" in your app drawer
2. Open the app - it should load with a QR code or connect automatically
3. The app will try to connect to Metro bundler on your PC

### Step 5: Connect to Metro Bundler

**If app shows QR code:**
- The app is already running the development client
- It will automatically try to connect to Metro on your PC's IP

**If app doesn't connect:**
1. Shake your device or use 3-finger long press
2. Select "Settings"
3. Enter Metro URL: `http://<YOUR_PC_IP>:8081`
   - Find your PC IP: `ipconfig` (look for IPv4 Address)
   - Example: `http://192.168.1.100:8081`
4. Click "Connect"

## Troubleshooting

### "Gradle requires JVM 17" or "Java version" error

**✅ FIXED!** Installed Microsoft OpenJDK 17.

**Solution that worked:**
```powershell
# Install JDK 17
winget install Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements

# Set JAVA_HOME (automatic after install)
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $env:JAVA_HOME, "User")
```

**Don't use**: Android Studio's `jbr` directory (doesn't contain full JDK)

### "No devices found"
```bash
# Check if device is connected
adb devices

# If unauthorized, check your phone and accept the prompt
# If no devices, try:
adb kill-server
adb start-server
adb devices
```

### "Build failed" or "Gradle error"
```bash
# Clean build cache
npm run clean
npm install
npm run build:dev:clean
```

### "Port 8081 in use"
```powershell
# Find and kill the process
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### "App crashes on launch"
```bash
# Check logs
adb logcat | Select-String -Pattern "ReactNativeJS|FATAL"

# Rebuild
npm run build:dev:clean
```

### "App shows blank screen"
- Ensure Metro bundler is running
- Check Metro URL in dev client settings
- Make sure your PC and phone are on same WiFi network

### "Cannot connect to Metro"
1. Check firewall isn't blocking port 8081
2. Verify PC and phone are on same network
3. Try entering Metro URL manually in dev client settings
4. Check your PC's IP address: `ipconfig`

## Alternative: Build APK Without Auto-Install

If you want to manually install the APK:

```bash
# Build APK only (doesn't install automatically)
npx expo run:android --variant debug --no-install

# APK will be in:
# android/app/build/outputs/apk/debug/app-debug.apk

# Manually install
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Alternative: Wireless Debugging (No USB)

After initial USB setup:

```bash
# Enable wireless debugging
adb tcpip 5555

# Disconnect USB
# Connect via WiFi (replace with your phone's IP)
adb connect 192.168.1.XXX:5555

# Verify connection
adb devices
```

## Development Workflow

### Start Development Server
```bash
npm run dev
```

### Rebuild After Native Changes
If you modify app.json, add plugins, or change native dependencies:
```bash
npm run build:dev:clean
```

### Hot Reload
- Code changes auto-reload while developing
- Shake device to access dev menu
- Select "Reload" or "Enable Hot Reloading"

### Build for Production (Later)
When ready for app stores:
```bash
npm run build:production -- --platform android
```

## What's Different from Expo Go?

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| SDK Version | Play Store version (lagging) | Your exact SDK (55) |
| Custom Native Code | ❌ No | ✅ Yes |
| Debugging | Limited | Full |
| Installation | From Play Store | Built locally |
| Development | Basic | Complete |

## Need Help?

Check these resources:
- Expo Dev Client: https://docs.expo.dev/development/introduction/
- Android Debug Bridge: https://developer.android.com/studio/command-line/adb
- USB Debugging: https://developer.android.com/studio/debug/dev-options

## Common Commands

```bash
# Check connected devices
adb devices

# View app logs
adb logcat | Select-String -Pattern "ReactNativeJS"

# Restart ADB server
adb kill-server
adb start-server

# Uninstall app
adb uninstall com.agromobile.app

# List packages
adb shell pm list packages | Select-String "agro"
```
