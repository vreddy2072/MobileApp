import { useEffect } from 'react';
import { useFonts } from 'expo-font';

/**
 * Loads shared app resources (currently icon fonts) before the UI renders.
 * Returns true once every resource is ready.
 */
export function useLoadedResources(): boolean {
  const [fontsLoaded, fontError] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Failed to load fonts', fontError);
    }
  }, [fontError]);

  return fontsLoaded;
}

