import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Camera} from 'react-native-vision-camera';

import {COLORS} from '../assets/constants/theme';

const MosquitoIdentificationScreen = () => {
  const [cameraPermission, setCameraPermission] = useState(
    Camera.getCameraPermissionStatus(),
  );

  useEffect(() => {
    const verifyCameraPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status !== 'granted') {
        const newStatus = await Camera.requestCameraPermission();
        setCameraPermission(newStatus);
      } else {
        setCameraPermission(status);
      }
    };

    verifyCameraPermission();
  }, []);

  if (cameraPermission !== 'granted') {
    return (
      <View>
        <Text>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>Granted Permission!!!!!!!</Text>
    </View>
  );
};

export default MosquitoIdentificationScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
