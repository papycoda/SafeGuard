import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-contact" options={{ headerShown: true, title: 'Add Emergency Contact', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
