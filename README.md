# Curt's Hiking App

A React Native application for discovering and tracking hiking trails with interactive maps powered by Mapbox.

## Features

- Interactive map with trail markers
- Trail list and details
- Hiking activity tracking
- Sample trail data for the Pacific Northwest

## Prerequisites

> **Note**: Make sure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Setup

### 1. Environment Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Add your Mapbox access token to the `.env` file:

```
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
MAPBOX_DOWNLOADS_TOKEN=your_mapbox_access_token_here
```

To get a Mapbox access token:
1. Sign up at [Mapbox](https://account.mapbox.com/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new token or use the default public token

### 2. Install Dependencies

```bash
npm install
# OR
yarn install
```

### 3. iOS Setup (iOS only)

Install CocoaPods dependencies:

```bash
bundle install
bundle exec pod install
```

## Running the App

### Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

### Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

#### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### iOS

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── MapComponent.tsx    # Main map display
│   ├── TrailsList.tsx      # Trail listing component
│   ├── TrailDetails.tsx    # Individual trail details
│   └── HikeTracker.tsx     # Hiking activity tracker
├── config/
│   └── mapbox.ts          # Mapbox configuration
├── data/
│   └── sampleTrails.ts    # Sample trail data
├── screens/
│   └── HomeScreen.tsx     # Main app screen
└── types/
    └── env.d.ts           # Environment type definitions
```

## Development

When you want to forcefully reload, for example to reset the state of your app:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Troubleshooting

### Map not loading
- Verify your Mapbox access token is correctly set in `.env`
- Check internet connection
- Ensure the token has the required permissions

### Build failures
- Clean your build: `npx react-native clean`
- For iOS: `cd ios && xcodebuild clean`
- For Android: `cd android && ./gradlew clean`

### Module resolution errors
- Clear Metro cache: `npx react-native start --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

For general React Native issues, see the [official troubleshooting guide](https://reactnative.dev/docs/troubleshooting).

## Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.