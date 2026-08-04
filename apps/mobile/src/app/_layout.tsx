import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QuizGameProvider } from '@/features/game-player/hooks/useQuizGame';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QuizGameProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#05070f' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="join" />
          <Stack.Screen name="scanner" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lobby/[lobbyId]" />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </QuizGameProvider>
    </SafeAreaProvider>
  );
}
