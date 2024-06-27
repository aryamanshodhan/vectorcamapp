import React from 'react';
import {NavigationContainer} from '@react-navigation/native';

import AppStackNavigator from './AppStackNavigator';

const Navigation = () => {
  return (
    <NavigationContainer>
      <AppStackNavigator />
    </NavigationContainer>
  );
};

export default Navigation;
