import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import MosquitoIdentificationScreen from '../screens/MosquitoIdentificationScreen';

const Stack = createNativeStackNavigator();

const AppStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="MosquitoIdentificationScreen">
      <Stack.Screen
        name="MosquitoIdentificationScreen"
        component={MosquitoIdentificationScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default AppStackNavigator;
