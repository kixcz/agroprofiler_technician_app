# Java/JDK Setup for React Native Development

## Problem
Gradle requires JVM 17 or later, but system has Java 8 or invalid JDK path.

## Solution: Install Microsoft OpenJDK 17

### Installation Command
```powershell
winget install Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements
```

### Default Installation Path
After installation, JDK 17 will be at:
```
C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot\
```

### Set JAVA_HOME (Permanent)
```powershell
# Set for current session
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"

# Set permanently for user
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot", "User")

# Update PATH
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

### Verify Installation
```powershell
java -version
# Should show: openjdk version "17.0.18" or similar
```

## Alternative JDK Sources

If winget doesn't work, download from:

1. **Microsoft**: https://learn.microsoft.com/en-us/java/openjdk/download
2. **Adoptium**: https://adoptium.net/temurin/releases/?version=17
3. **Oracle**: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

## Configure for Gradle (If Needed)

Only if Gradle still can't find Java, add to `android/gradle.properties`:

```properties
org.gradle.java.home=C:\\Program Files\\Microsoft\\jdk-17.0.18.8-hotspot
```

**Note**: Replace with your actual JDK path.

## Common Issues

### "JAVA_HOME is set to invalid directory"
- Check the path exists: `Test-Path $env:JAVA_HOME`
- Reinstall JDK if directory is missing
- Don't use Android Studio's jbr path (it may not have full JDK)

### "Gradle requires JVM 17"
- Verify Java version: `java -version`
- Check JAVA_HOME: `echo $env:JAVA_HOME`
- Ensure JAVA_HOME\bin\java.exe exists

### Multiple Java Versions
Windows may have multiple Java versions. To use a specific one:

```powershell
# Remove old JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "", "User")

# Set new JAVA_HOME
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot", "User")

# Restart terminal and verify
java -version
```

## Quick Fix Commands

```powershell
# 1. Install JDK 17
winget install Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements

# 2. Find installation path
Get-ChildItem "C:\Program Files\Microsoft" -Filter "jdk-*" -Directory

# 3. Set JAVA_HOME (replace with your path)
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $env:JAVA_HOME, "User")

# 4. Verify
java -version
javac -version

# 5. Rebuild app
npm run build:dev
```
