import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Camera} from 'react-native-vision-camera';

import {requestCameraPermission} from '../../util/permissions';
import {COLORS} from '../../assets/constants/theme';

type CameraPermissionProps = {
  children: React.ReactNode;
};

const CameraPermission: React.FC<CameraPermissionProps> = ({children}) => {
  const [cameraPermission, setCameraPermission] = useState(
    Camera.getCameraPermissionStatus(),
  );

  useEffect(() => {
    const verifyCameraPermission = async () => {
      const status = await requestCameraPermission();
      setCameraPermission(status);
    };

    verifyCameraPermission();
  }, []);

  if (cameraPermission !== 'granted') {
    return (
      <View style={styles.rootContainer}>
        <Text>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  return children;
};

export default CameraPermission;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
