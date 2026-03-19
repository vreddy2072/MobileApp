import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface LargeTitleHeaderProps {
  title: string;
  iconSize?: number;
  showIcon?: boolean;
  rightButton?: React.ReactNode;
  iconName?: string;
  iconColor?: string;
  titleMarginLeft?: number;
}

export function LargeTitleHeader({ 
  title, 
  iconSize = 60, 
  showIcon = false, 
  rightButton, 
  iconName, 
  iconColor, 
  titleMarginLeft = 20 
}: LargeTitleHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          {iconName && (
            <Ionicons 
              name={iconName as any} 
              size={50} 
              color={iconColor || theme.text} 
            />
          )}
          <Text style={[
            styles.title, 
            { 
              color: theme.text,
              marginLeft: iconName ? titleMarginLeft : 0
            }
          ]}>
            {title}
          </Text>
        </View>
        {rightButton && (
          <View style={styles.rightButtonContainer}>
            {rightButton}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  content: {
    paddingTop: 10,
    position: 'relative',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 48,
    flex: 1,
  },
  rightButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 1,
  },
});

