import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Rect} from 'react-native-svg';

import type {YoloDetection} from '../../types/mosquito-detection-types';

import {COLORS} from '../../assets/constants/theme';
import {YOLO_CONFIDENCE_THRESHOLD} from '../../assets/constants/values';

type YoloBoundingBoxProps = {
  boundingBox: YoloDetection;
};

const YoloBoundingBox: React.FC<YoloBoundingBoxProps> = ({boundingBox}) => {
  return (
    <View style={styles.fillScreen}>
      <Svg height="100%" width="100%">
        <Rect
          x={boundingBox.x}
          y={boundingBox.y}
          width={boundingBox.w}
          height={boundingBox.h}
          stroke={
            boundingBox.confidence > YOLO_CONFIDENCE_THRESHOLD
              ? COLORS.successDark
              : COLORS.warningDark
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
