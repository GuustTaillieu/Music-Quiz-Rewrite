import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings as SettingsIcon, LogIn, X } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <SettingsIcon size={22} color="#00f0ff" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Host Mode (Coming Soon)</Text>
        <Text style={styles.cardSubtitle}>
          Log in with Spotify to host game lobbies and create custom music quizzes directly from your mobile device.
        </Text>

        <TouchableOpacity style={styles.hostButton} activeOpacity={0.8}>
          <LogIn size={18} color="#ffffff" />
          <Text style={styles.hostButtonText}>Sign In with Spotify (Host)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070f',
    padding: 24,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#0d1322',
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  hostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1db954',
    paddingVertical: 14,
    borderRadius: 14,
  },
  hostButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
