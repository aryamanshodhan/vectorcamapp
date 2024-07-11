import React, {useState, useRef, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
import ActionButton from '../components/ui/ActionButton';

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
            <View style={styles.imageContainer}>
              <View style={styles.predictionsContainer}>
                <View style={styles.predictionContainer}>
                  <Text style={styles.predictionLabel}>Species</Text>
                  <Text style={styles.predictionOutput}>Anopheles Gambiae</Text>
                </View>
                <View style={styles.predictionContainer}>
                  <Text style={styles.predictionLabel}>Sex</Text>
                  <Text style={styles.predictionOutput}>Female</Text>
                </View>
                <View style={styles.predictionContainer}>
                  <Text style={styles.predictionLabel}>Abdomen Status</Text>
                  <Text style={styles.predictionOutput}>Half Gravid</Text>
                </View>
              </View>
              <View style={styles.sessionWorkflowContainer}>
                <ActionButton
                  onPress={retakeImageHandler}
                  buttonStyle={[
                    styles.sessionWorkflowButton,
                    styles.retakeButton,
                  ]}>
                  <Text style={styles.sessionWorkflowButtonText}>Retake</Text>
                  <Icon name="close" size={30} color={COLORS.white} />
                </ActionButton>
                <ActionButton
                  onPress={continueToNextImageHandler}
                  buttonStyle={[
                    styles.sessionWorkflowButton,
                    styles.continueButton,
                  ]}>
                  <Text style={styles.sessionWorkflowButtonText}>Continue</Text>
                  <Icon name="caret-forward" size={30} color={COLORS.white} />
                </ActionButton>
              </View>
            </View>
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
            <ActionButton
              onPress={captureImageHandler}
              buttonStyle={styles.captureButton}
              disabled={isAnalyzing}>
              <View style={styles.staticInnerCircle} />
            </ActionButton>
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
    justifyContent: 'flex-end',
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
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  predictionsContainer: {
    width: '50%',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
  },
  predictionContainer: {
    marginVertical: 3,
  },
  predictionLabel: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 15,
  },
  predictionOutput: {
    color: COLORS.black,
    fontSize: 15,
  },
  sessionWorkflowContainer: {
    justifyContent: 'space-between',
  },
  sessionWorkflowButton: {
    width: 150,
    height: 60,
  },
  retakeButton: {
    backgroundColor: COLORS.red,
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: COLORS.green,
    marginTop: 10,
  },
  sessionWorkflowButtonText: {
    color: COLORS.white,
    fontSize: 20,
  },
});
