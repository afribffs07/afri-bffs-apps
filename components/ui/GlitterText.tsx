import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface GlitterTextProps {
  children: string;
  style?: TextStyle;
  size?: number;
}

export default function GlitterText({ children, style, size = 24 }: GlitterTextProps) {
  return (
    <Text style={[styles.glitterText, { fontSize: size }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  glitterText: {
    color: Colors.primary,
    fontWeight: 'bold',
    textShadowColor: Colors.glitter,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
});