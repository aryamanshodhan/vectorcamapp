import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Rect} from 'react-native-svg';

import type {YoloDetection} from '../../types/mosquito-detection-types';

import {YOLO_CONFIDENCE_THRESHOLD} from '../../assets/constants/values';

type YoloBoundingBoxProps = {
  yoloCoordinates: YoloDetection;
};

const YoloBoundingBox: React.FC<YoloBoundingBoxProps> = ({yoloCoordinates}) => {
  return (
    <View style={styles.fillScreen}>
      <Svg height="100%" width="100%">
        <Rect
          x={yoloCoordinates.x}
          y={yoloCoordinates.y}
          width={yoloCoordinates.w}
          height={yoloCoordinates.h}
          stroke={
            yoloCoordinates.confidence > YOLO_CONFIDENCE_THRESHOLD
              ? 'green'
              : 'red'
          }
          strokeWidth="4"
          fill="none"
        />
      </Svg>
    </View>
  );
};

export default YoloBoundingBox;

const styles = StyleSheet.create({
  fillScreen: {
    ...StyleSheet.absoluteFillObject,
  },
});
