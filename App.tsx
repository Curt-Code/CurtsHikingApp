import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import HomeScreen from './src/screens/HomeScreen';
import { MAPBOX_ACCESS_TOKEN } from './src/config/mapbox';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <HomeScreen />
    </>
  );
}

export default App;
