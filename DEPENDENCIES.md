# HikingApp - Complete Dependencies & Versions

## Current Status
✅ React Native 0.80.1 (Legacy Architecture)  
✅ React 19.1.0  
✅ TypeScript 5.0.4  
✅ Gradle 8.14.1  
✅ Android Build Tools 35.0.0  
✅ Hermes JS Engine Enabled  
✅ Mapbox Maps SDK 10.1.39  
✅ Patch-package for custom fixes  

## Core Dependencies
- **React Native**: 0.80.1
- **React**: 19.1.0
- **@react-native/new-app-screen**: 0.80.1
- **@rnmapbox/maps**: 10.1.39

## Development Dependencies
- **TypeScript**: 5.0.4
- **ESLint**: 8.19.0
- **Jest**: 29.6.3
- **Prettier**: 2.8.8
- **Babel Core**: 7.25.2
- **React Native CLI**: 19.0.0
- **patch-package**: 8.0.0
- **postinstall-postinstall**: 2.1.0

## Build Tools & Android Configuration
- **Gradle**: 8.14.1
- **Android Build Tools**: 35.0.0
- **Compile SDK**: 35 (Android 15)
- **Target SDK**: 35
- **Min SDK**: 24 (Android 7.0+)
- **Kotlin**: 2.0.20
- **NDK**: 27.1.12297006

## Mapbox Configuration
- **SDK Version**: 10.1.39
- **API Key**: Configured in `src/config/mapbox.ts`
- **Maven Repository**: `https://api.mapbox.com/downloads/v2/releases/maven`
- **Authentication**: Basic auth with username "mapbox"
- **Permissions**: Location permissions in AndroidManifest.xml

## Architecture Settings (android/gradle.properties)
```properties
newArchEnabled=false          # Legacy Architecture (stable)
hermesEnabled=true           # Hermes JS Engine
compileSdkVersion=35         # Android 15
targetSdkVersion=35          # Android 15
minSdkVersion=24             # Android 7.0+
kotlinVersion=2.0.20         # Kotlin compatibility
```

## Package.json Scripts
- `npm run android` - Build and run Android
- `npm run ios` - Build and run iOS
- `npm start` - Start Metro bundler
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `postinstall` - Run patch-package automatically

## Patch-package Setup
- **Purpose**: Apply custom fixes to dependencies
- **Version**: 8.0.0
- **Auto-run**: Configured in postinstall script
- **Patches stored**: `/patches` directory

## Node.js Requirements
- **Minimum**: Node.js 18+
- **Recommended**: Node.js 20 LTS
- **Package Manager**: npm (comes with Node.js)

## Development Environment
- **Windows**: Supported with proper setup
- **Linux**: Supported (primary development environment)
- **macOS**: Supported for iOS development

## Key Files Modified
- `App.tsx` - Mapbox initialization
- `src/components/MapComponent.tsx` - Reusable map component
- `src/screens/HomeScreen.tsx` - Map integration
- `android/build.gradle` - Kotlin version and Mapbox maven
- `android/app/src/main/AndroidManifest.xml` - Location permissions
- `src/config/mapbox.ts` - API key configuration

## Build Commands
```bash
# Clean install
npm install

# Clean Android build
cd android && ./gradlew clean && cd ..

# Build and run
npm run android

# Reset Metro cache (if needed)
npm start --reset-cache
```

## Troubleshooting
- **Mapbox build issues**: Check Kotlin version (2.0.20 recommended)
- **Location not working**: Verify permissions in AndroidManifest.xml
- **Map not loading**: Check API key and internet connection
- **Build cache issues**: Use clean commands above

## Version Compatibility Matrix
| Component | Version | Compatible With |
|-----------|---------|----------------|
| React Native | 0.80.1 | Mapbox 10.1.39 |
| Kotlin | 2.0.20 | Mapbox 10.1.39 |
| Android API | 24-35 | All versions |
| Node.js | 18+ | All versions |
| Gradle | 8.14.1 | All versions |

## Last Updated
- **Date**: 2025-01-06
- **Mapbox SDK**: 10.1.39
- **React Native**: 0.80.1
- **Status**: Stable with patch-package support