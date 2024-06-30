import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

import {COLORS} from '../assets/constants/theme';

const MosquitoIdentificationScreen = () => {
  const [cameraPermission, setCameraPermission] = useState(
    Camera.getCameraPermissionStatus(),
  );
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back')!;

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

  const captureImageHandler = useCallback(async () => {
    if (cameraRef.current) {
      const image = await cameraRef.current.takePhoto();
      console.log(image);
    }
  }, [cameraRef]);

  if (cameraPermission !== 'granted') {
    return (
      <View>
        <Text>Camera permission is required to use this feature.</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <Camera
        style={StyleSheet.absoluteFill}
        photo={true}
        device={device}
        isActive={true}
        ref={cameraRef}
      />
      <Pressable
        style={({pressed}) =>
          pressed
            ? [styles.captureButton, styles.captureButtonPressed]
            : styles.captureButton
        }
        onPress={captureImageHandler}>
        <View style={styles.staticInnerCircle} />
      </Pressable>
    </View>
  );
};

export default MosquitoIdentificationScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderWidth: 7,
    borderColor: COLORS.white,
    borderRadius: 40,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonPressed: {
    opacity: 0.25,
  },
  staticInnerCircle: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    position: 'absolute',
  },
});
