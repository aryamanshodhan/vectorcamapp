import React, {useState, useRef, useCallback} from 'react';
import {Alert, Image, Platform, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  getCameraFormat,
  PhotoFile,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {useTextRecognition} from 'react-native-vision-camera-text-recognition';
import {useRunOnJS} from 'react-native-worklets-core';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import type {YoloDetection} from '../types/mosquito-detection-types';

import {COLORS} from '../assets/constants/theme';
import {
  WINDOW_WIDTH,
  YOLO_WIDTH,
  YOLO_HEIGHT,
  YOLO_CONFIDENCE_THRESHOLD,
} from '../assets/constants/values';
import LoadingOverlay from '../components/loading-overlay/LoadingOverlay';
import YoloBoundingBox from '../components/mosquito-identification/YoloBoundingBox';
import ActionButton from '../components/ui/ActionButton';
import CameraPermission from '../components/mosquito-identification/CameraPermission';
import {hasAndroidStoragePermission} from '../util/permissions';
import {detectMosquito} from '../util/mosquito-detector-wrapper';

const MosquitoIdentificationScreen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [yoloCoordinates, setYoloCoordinates] = useState<
    YoloDetection | undefined
  >(undefined);
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
  const format = getCameraFormat(device, [
    {photoAspectRatio: 4 / 3},
    {videoResolution: {width: 640, height: 480}},
  ]);
  const {scanText} = useTextRecognition();

  const captureImageHandler = useCallback(async () => {
    if (cameraRef.current) {
      setIsAnalyzing(true);
      const image = await cameraRef.current.takePhoto();
      setCapturedImage(image);
      setIsAnalyzing(false);
    }
  }, [cameraRef]);

  const scaleCoordinates = (
    detection: YoloDetection,
    frameWidth: number,
    frameHeight: number,
  ): YoloDetection => {
    [frameWidth, frameHeight] = [frameHeight, frameWidth];
    const widthScale = frameWidth / YOLO_WIDTH;
    const heightScale = frameHeight / YOLO_HEIGHT;

    detection.x =
      (detection.x - detection.w / 2) * widthScale -
      (frameWidth - WINDOW_WIDTH) / 2;
    detection.y = (detection.y - detection.h / 2) * heightScale;
    detection.w = detection.w * widthScale;
    detection.h = detection.h * heightScale;

    return detection;
  };

  const updateYoloCoordinates = useRunOnJS(
    (detection: YoloDetection, frameWidth: number, frameHeight: number) => {
      const scaledDetection = detection
        ? scaleCoordinates(detection, frameWidth, frameHeight)
        : undefined;
      setYoloCoordinates(scaledDetection);
      console.log(scaledDetection);
    },
    [],
  );

  const updateMosquitoCharacteristics = useRunOnJS((mosquitoID: string) => {
    setMosquitoCharacteristics(prevState => ({
      ...prevState,
      id: mosquitoID,
    }));
  }, []);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      const frameWidth = frame.width;
      const frameHeight = frame.height;
      runAsync(frame, () => {
        'worklet';
        const detection = detectMosquito(frame) as YoloDetection;
        updateYoloCoordinates(detection, frameWidth, frameHeight);
      });

      const OCR_FPS = 0.5;
      runAtTargetFps(OCR_FPS, () => {
        'worklet';
        const data = scanText(frame);
        const mosquitoID = data.resultText;
        updateMosquitoCharacteristics(mosquitoID);
      });
    },
    [updateMosquitoCharacteristics, updateYoloCoordinates],
  );

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
        {isAnalyzing && <LoadingOverlay />}
        {capturedImage ? (
          <>
            <Image
              style={styles.mediaContainer}
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
              style={styles.mediaContainer}
              photo={true}
              device={device}
              format={format}
              isActive={true}
              frameProcessor={frameProcessor}
              ref={cameraRef}
              enableBufferCompression={false}
            />
            {yoloCoordinates !== undefined &&
              yoloCoordinates.confidence > YOLO_CONFIDENCE_THRESHOLD && (
                <View style={styles.mosquitoConfidenceContainer}>
                  <Text style={styles.mosquitoConfidenceText}>
                    Ready to Capture!
                  </Text>
                </View>
              )}
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
            {yoloCoordinates !== undefined && (
              <YoloBoundingBox yoloCoordinates={yoloCoordinates} />
            )}
          </>
        )}
      </View>
    </CameraPermission>
  );
};

export default MosquitoIdentificationScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'space-between',
  },
  mediaContainer: {
    width: '100%',
    height: 640,
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
    zIndex: 1,
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
  imageFunctionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 'auto',
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
  mosquitoConfidenceContainer: {
    backgroundColor: COLORS.green,
    alignSelf: 'center',
    marginTop: 'auto',
    borderRadius: 5,
    padding: 8,
  },
  mosquitoConfidenceText: {
    color: COLORS.white,
    fontSize: 15,
  },
});
