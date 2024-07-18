import {VisionCameraProxy, Frame} from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectMosquito', {});

export function detectMosquito(frame: Frame) {
  'worklet';
  if (plugin == null)
    throw new Error('Failed to load Frame Processor Plugin "detectMosquito"!');
  return plugin.call(frame);
}
