import React from 'react';
import {Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';

type ActionButtonProps = {
  onPress: () => void;
  children: React.ReactNode;
  buttonStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  children,
  buttonStyle,
  disabled = false,
}) => {
  return (
    <Pressable
      style={({pressed}) => [
        styles.button,
        buttonStyle,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}>
      {children}
    </Pressable>
  );
};

export default ActionButton;

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
  },
  buttonPressed: {
    opacity: 0.25,
  },
});
