# How to Install Development APK on Physical Phone

## Quick Summary

Once the build completes, the APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 1: Direct Install via USB (Recommended)

### Prerequisites
1. **Enable Developer Mode:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - See "You are now a developer!"

2. **Enable USB Debugging:**
   - Settings → Developer Options
   - Enable "USB Debugging"
   - Enable "Install via USB" (if available)

3. **Connect Phone:**
   - Use USB cable
   - Select "File Transfer" mode
   - Accept USB debugging prompt on phone

### Install Command
```powershell
# Check if phone is connected
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# If already installed, reinstall
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 2: Manual Transfer

### Step 1: Copy APK to Phone
```powershell
# Via ADB
adb push android/app/build/outputs/apk/debug/app-debug.apk /storage/emulated/0/Download/

# OR manually copy the file:
# Location: C:\Users\panal\Documents\projects\agro_new_ver_mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### Step 2: Install on Phone
1. Open **File Manager** on phone
2. Go to **Downloads**
3. Tap `app-debug.apk`
4. Tap **Install**
5. If prompted, allow **"Install from Unknown Sources"**

### Enable Unknown Sources (If Needed)
**Android 8+:**
- Settings → Apps → Special Access → Install unknown apps
- Allow for your File Manager app

**Android 7 and below:**
- Settings → Security → Unknown Sources (enable)

## Method 3: WiFi Transfer (No Cable)

### Enable Wireless Debugging
**Android 11+:**
1. Settings → Developer Options → Wireless debugging
2. Turn ON
3. Tap "Pair device with pairing code"
4. Note the IP and port (e.g., 192.168.1.100:5555)

**Android 10 and below:**
```powershell
# First connect via USB
adb tcpip 5555
# Disconnect USB
adb connect 192.168.1.XXX:5555  # Your phone's IP
```

### Install via WiFi
```powershell
# Connect to phone
adb connect 192.168.1.XXX:5555

# Verify connection
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 4: Share via Cloud/Email

1. Copy APK to:
   - Google Drive
   - Dropbox
   - OneDrive
   - Email attachment
   - WhatsApp/Telegram (as document)

2. On phone, download and tap to install

## Method 5: Local HTTP Server

```powershell
# Go to APK directory
cd android/app/build/outputs/apk/debug

# Start server
python -m http.server 8000

# On phone browser, go to:
# http://YOUR_PC_IP:8000/app-debug.apk
# Find PC IP: ipconfig
```

## Connect Development Build to Metro

After installing the APK on your phone:

### Option 1: Automatic Connection
If phone and PC are on same WiFi:
1. Open the app on phone
2. It should auto-connect to Metro on PC

### Option 2: Manual Connection
1. Open the app on phone
2. Enter Metro URL when prompted:
   ```
   http://YOUR_PC_IP:8081
   ```
3. Tap **Connect**

### Find Your PC IP
```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

### Option 3: Shake Device
1. Shake your phone (or 3-finger long press)
2. Tap **Settings**
3. Enter Metro URL
4. Tap **Connect**

## Troubleshooting

### "App not installed"
- Uninstall old version first: `adb uninstall com.agromobile.app`
- Check storage space on phone
- Enable "Install from Unknown Sources"

### "Connection refused" or can't connect to Metro
- Ensure phone and PC are on same WiFi network
- Check Windows Firewall isn't blocking port 8081
- Try entering Metro URL manually
- Restart Metro: `npm run dev`

### "ADB device not found"
```powershell
# Restart ADB
adb kill-server
adb start-server
adb devices

# Check USB cable and connection mode
```

### APK Not Found Error
Wait for build to complete. Check if APK exists:
```powershell
Test-Path android/app/build/outputs/apk/debug/app-debug.apk
```

## Useful ADB Commands

```powershell
# List connected devices
adb devices

# Install APK
adb install app-debug.apk

# Reinstall (update)
adb install -r app-debug.apk

# Uninstall app
adb uninstall com.agromobile.app

# View app logs
adb logcat | Select-String -Pattern "ReactNativeJS"

# Clear app data
adb shell pm clear com.agromobile.app

# Check if app is installed
adb shell pm list packages | Select-String "agro"
```

## Development Workflow for Physical Device

### First Time Setup
1. Enable USB debugging
2. Connect via USB
3. Run: `npm run build:dev`
4. APK builds and installs automatically
5. App opens and connects to Metro

### Daily Development
1. Connect phone via USB or WiFi
2. Start Metro: `npm run dev`
3. Open app on phone
4. Code changes auto-reload

### After Native Code Changes
If you modify `app.json`, add plugins, or native dependencies:
```powershell
npm run build:dev:clean
```

## Quick Reference

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**App Package Name:**
```
com.agromobile.app
```

**Connect to Metro:**
```
http://YOUR_PC_IP:8081
```

**Build Commands:**
```powershell
npm run build:dev          # Build and install
npm run build:dev:clean    # Clean build
npm run dev                # Start Metro only
```

## Next Steps After APK Installation

1. ✅ APK installed on phone
2. ✅ Open app - it will show development client
3. ✅ Connect to Metro on your PC
4. ✅ Start developing with live reload!
5. ✅ Shake phone for dev menu
6. ✅ Code changes appear instantly

---

**Need Help?**
- Check `DEVELOPMENT_BUILD_GUIDE.md` for complete guide
- Check `JAVA_SETUP_GUIDE.md` for Java configuration
- Check `PRODUCTION_README.md` for production deployment
