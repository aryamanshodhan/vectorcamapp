import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Camera, PhotoFile, useCameraDevice} from 'react-native-vision-camera';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {COLORS} from '../assets/constants/theme';
import CameraPermission from '../components/mosquito-identification/CameraPermission';
import {hasAndroidStoragePermission} from '../util/permissions';

const MosquitoIdentificationScreen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<PhotoFile | undefined>(
    undefined,
  );
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back')!;

  const captureImageHandler = useCallback(async () => {
    if (cameraRef.current) {
      setIsAnalyzing(true);
      const image = await cameraRef.current.takePhoto();
      setCapturedImage(image);
      setIsAnalyzing(false);
    }
  }, [cameraRef]);

  const retakeImageHandler = () => {
    setCapturedImage(undefined);
  };

  const continueToNextImageHandler = async () => {
    if (Platform.OS === 'android') {
      const hasPermission = await hasAndroidStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Could not save image to device!',
          'Camera roll access is required to record a session.',
        );
        return;
      }
    }

    if (capturedImage) {
      try {
        const photo = await CameraRoll.saveAsset(capturedImage.path, {
          type: 'photo',
        });
        console.log(photo);
        Alert.alert('Success', 'Image saved to camera roll!');
      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error', 'Failed to save image.');
      }
    }
  };

  return (
    <CameraPermission>
      <View style={styles.rootContainer}>
        {capturedImage ? (
          <>
            <Image
              style={styles.fillScreen}
              source={{uri: `file://${capturedImage.path}`}}
            />
            <Pressable
              style={({pressed}) => [
                styles.retakeButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={retakeImageHandler}>
              <Text style={styles.retakeButtonText}>Retake</Text>
              <Icon name="close" size={30} color={COLORS.white} />
            </Pressable>
            <Pressable
              style={({pressed}) => [
                styles.continueButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={continueToNextImageHandler}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Icon name="caret-forward" size={30} color={COLORS.white} />
            </Pressable>
          </>
        ) : (
          <>
            <Camera
              style={styles.fillScreen}
              photo={true}
              device={device}
              isActive={true}
              ref={cameraRef}
            />
            <Pressable
              style={({pressed}) => [
                styles.captureButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={captureImageHandler}
              disabled={isAnalyzing}>
              <View style={styles.staticInnerCircle} />
            </Pressable>
          </>
        )}
        {isAnalyzing && (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </View>
    </CameraPermission>
  );
};

export default MosquitoIdentificationScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  fillScreen: {
    ...StyleSheet.absoluteFillObject,
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
  buttonPressed: {
    opacity: 0.25,
  },
  staticInnerCircle: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    position: 'absolute',
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white + COLORS.OPACITY[50],
  },
  retakeButton: {
    width: 150,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.red,
    position: 'absolute',
    bottom: 110,
    right: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  continueButton: {
    width: 150,
    height: 50,
    borderRadius: 30,
    backgroundColor: COLORS.green,
    position: 'absolute',
    bottom: 40,
    right: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: COLORS.white,
    fontSize: 20,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 20,
  },
});
