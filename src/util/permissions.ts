import {PermissionsAndroid, Platform} from 'react-native';
import {Camera} from 'react-native-vision-camera';

export const requestCameraPermission = async () => {
  const status = await Camera.getCameraPermissionStatus();
  if (status !== 'granted') {
    const newStatus = await Camera.requestCameraPermission();
    return newStatus;
  }
  return status;
};

export const hasAndroidStoragePermission = async () => {
  const version =
    typeof Platform.Version === 'string'
      ? parseInt(Platform.Version, 10)
      : Platform.Version;

  const checkPermission = () =>
    version >= 33
      ? Promise.all([
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ),
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ),
        ]).then(
          ([hasReadMediaImages, hasReadMediaVideo]) =>
            hasReadMediaImages && hasReadMediaVideo,
        )
      : PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );

  const requestPermission = () =>
    version >= 33
      ? PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]).then(
          statuses =>
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
              PermissionsAndroid.RESULTS.GRANTED,
        )
      : PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ).then(status => status === PermissionsAndroid.RESULTS.GRANTED);

  return (await checkPermission()) || (await requestPermission());
};
