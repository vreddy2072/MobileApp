import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { shadows, borderRadius } from '../../constants/designSystem';

interface StyledCardProps {
  children: React.ReactNode;
  backgroundColor?: string;
  shadow?: keyof typeof shadows;
  borderRadius?: number;
  padding?: { horizontal: number; vertical: number };
  style?: ViewStyle;
}

export function StyledCard({
  children,
  backgroundColor = '#FFFFFF',
  shadow = 'card',
  borderRadius: radius = borderRadius.lg,
  padding = { horizontal: 16, vertical: 16 },
  style,
}: StyledCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius: radius,
          paddingHorizontal: padding.horizontal,
          paddingVertical: padding.vertical,
          ...shadows[shadow],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Base card styles are applied via style prop
  },
});

