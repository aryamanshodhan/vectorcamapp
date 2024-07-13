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
import {
  Camera,
  PhotoFile,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {COLORS} from '../assets/constants/theme';
import ActionButton from '../components/ui/ActionButton';
import CameraPermission from '../components/mosquito-identification/CameraPermission';
import {hasAndroidStoragePermission} from '../util/permissions';

const MosquitoIdentificationScreen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mosquitoCharacteristics, setMosquitoCharacteristics] = useState({
    id: '',
    species: '',
    sex: '',
    abdomenStatus: '',
  });
  const [capturedImage, setCapturedImage] = useState<PhotoFile | undefined>(
    undefined,
  );
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back')!;

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

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
            <View style={styles.imageFunctionsContainer}>
              <View style={styles.mosquitoCharacteristicsContainer}>
                <View style={styles.mosquitoCharacteristicContainer}>
                  <Text style={styles.mosquitoCharacteristicLabel}>
                    Mosquito ID
                  </Text>
                  <Text style={styles.mosquitoCharacteristicValue}>
                    {mosquitoCharacteristics.id}
                  </Text>
                </View>
                <View style={styles.mosquitoCharacteristicContainer}>
                  <Text style={styles.mosquitoCharacteristicLabel}>
                    Species
                  </Text>
                  <Text style={styles.mosquitoCharacteristicValue}>
                    {mosquitoCharacteristics.species}
                  </Text>
                </View>
                <View style={styles.mosquitoCharacteristicContainer}>
                  <Text style={styles.mosquitoCharacteristicLabel}>Sex</Text>
                  <Text style={styles.mosquitoCharacteristicValue}>
                    {mosquitoCharacteristics.sex}
                  </Text>
                </View>
                <View style={styles.mosquitoCharacteristicContainer}>
                  <Text style={styles.mosquitoCharacteristicLabel}>
                    Abdomen Status
                  </Text>
                  <Text style={styles.mosquitoCharacteristicValue}>
                    {mosquitoCharacteristics.abdomenStatus}
                  </Text>
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
              frameProcessor={frameProcessor}
              isActive={true}
              ref={cameraRef}
            />
            {!isAnalyzing && (
              <View style={styles.cameraFunctionsContainer}>
                <Text style={styles.OCRLabel}>Mosquito ID</Text>
                <Text style={styles.OCRText}>{mosquitoCharacteristics.id}</Text>
                <ActionButton
                  onPress={captureImageHandler}
                  buttonStyle={styles.captureButton}
                  disabled={isAnalyzing}>
                  <Icon name="camera" size={40} color={COLORS.white} />
                </ActionButton>
              </View>
            )}
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
    justifyContent: 'flex-end',
  },
  fillScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraFunctionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 10,
    paddingLeft: 20,
    margin: 30,
    borderRadius: 50,
  },
  OCRLabel: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 20,
  },
  OCRText: {
    color: COLORS.black,
    fontSize: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.black,
    borderRadius: 40,
    justifyContent: 'center',
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white + COLORS.OPACITY[50],
  },
  imageFunctionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  mosquitoCharacteristicsContainer: {
    width: '50%',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
    justifyContent: 'space-evenly',
  },
  mosquitoCharacteristicContainer: {
    marginVertical: 3,
  },
  mosquitoCharacteristicLabel: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 15,
  },
  mosquitoCharacteristicValue: {
    color: COLORS.black,
    fontSize: 13,
  },
  sessionWorkflowContainer: {
    justifyContent: 'space-evenly',
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
