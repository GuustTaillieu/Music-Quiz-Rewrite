import { useRouter } from 'expo-router';
import { LogIn, Settings as SettingsIcon, X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg-dark p-6">
      <View className="flex-row items-center justify-between mb-8">
        <View className="flex-row items-center gap-2">
          <SettingsIcon size={22} color="#00f0ff" />
          <Text className="text-white text-2xl font-black">Settings</Text>
        </View>
        <TouchableOpacity className="p-2 bg-white/10 rounded-2xl" onPress={() => router.back()}>
          <X size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View className="bg-card-dark border-1.5 border-neon-cyan/25 rounded-2xl p-5">
        <Text className="text-white text-lg font-extrabold mb-2">Host Mode (Coming Soon)</Text>
        <Text className="text-slate-400 text-xs leading-4.5 mb-5">
          Log in with Spotify to host game lobbies and create custom music quizzes directly from your mobile device.
        </Text>

        <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-spotify py-3.5 rounded-xl" activeOpacity={0.8}>
          <LogIn size={18} color="#ffffff" />
          <Text className="text-white text-sm font-extrabold">Sign In with Spotify (Host)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
