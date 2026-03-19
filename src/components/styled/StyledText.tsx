import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { textStyles, typography } from '../../constants/designSystem';
import { useTheme } from '../../contexts/ThemeContext';

type TextVariant = keyof typeof textStyles;

interface StyledTextProps extends TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  style?: TextStyle;
  color?: 'primary' | 'secondary'; // Theme color variant
}

export function StyledText({
  variant = 'listName',
  children,
  style,
  color = 'primary',
  ...props
}: StyledTextProps) {
  const { theme } = useTheme();
  const variantStyle = textStyles[variant];
  
  // Determine text color based on theme and color prop
  const textColor = color === 'secondary' ? theme.textSecondary : theme.text;
  
  // Extract fontFamily from variant style if present, otherwise use default
  const fontFamily = variantStyle.fontFamily || typography.fontFamily.text;

  return (
    <Text
      style={[
        {
          fontFamily,
          color: textColor,
        },
        variantStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

