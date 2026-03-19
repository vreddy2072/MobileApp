import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { iconSizes } from '../../constants/designSystem';

interface StyledIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  hasCircle?: boolean;
  circleSize?: number;
  circleColor?: string;
  style?: ViewStyle;
}

export function StyledIcon({
  name,
  size = iconSizes.category,
  color = '#007AFF',
  hasCircle = false,
  circleSize = 34,
  circleColor = '#007AFF',
  style,
}: StyledIconProps) {
  if (hasCircle) {
    return (
      <View
        style={[
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: circleColor,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Ionicons name={name} size={size} color="white" />
      </View>
    );
  }

  return <Ionicons name={name} size={size} color={color} style={style} />;
}

