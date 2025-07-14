import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { Platform } from 'react-native';

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();
  
  // For web, default to dark mode if no preference is set
  const effectiveColorScheme = Platform.OS === 'web' 
    ? (colorScheme ?? 'dark')
    : (colorScheme ?? 'dark');
  
  return {
    colorScheme: effectiveColorScheme,
    isDarkColorScheme: effectiveColorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
  };
}
