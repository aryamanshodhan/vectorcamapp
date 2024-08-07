import {ActivityIndicator, View, StyleSheet} from 'react-native';

import {COLORS} from '../../assets/constants/theme';

const LoadingOverlay = () => {
  return (
    <View style={styles.loadingOverlayContainer}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  loadingOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white + COLORS.OPACITY[50],
    zIndex: 2,
  },
});
