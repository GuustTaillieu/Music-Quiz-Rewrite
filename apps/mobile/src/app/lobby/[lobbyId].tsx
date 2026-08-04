import { useQuizGame } from '@/features/game-player/hooks/useQuizGame';
import { GamePhase } from '@spotify-music-quiz/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Crown, LogOut, Send, SkipForward, Trophy, Users, Zap } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LobbyScreen() {
  const router = useRouter();
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { gameState, leaveLobby, passTurn, submitGuess, lastGuessResult } = useQuizGame();

  const [guessText, setGuessText] = useState('');
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);

  const handleLeave = () => {
    leaveLobby(() => {
      router.replace('/join');
    });
  };

  const handleSubmit = () => {
    if (guessText.trim()) {
      submitGuess(guessText.trim());
      setGuessText('');
      setIsGuessModalOpen(false);
    }
  };

  if (!gameState) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connecting to lobby {lobbyId}...</Text>
      </View>
    );
  }

  const isLobby = gameState.phase === GamePhase.LOBBY;
  const isPlaying = gameState.phase === GamePhase.TURN_BASED || gameState.phase === GamePhase.SPEED_ROUND;
  const isFinished = gameState.phase === GamePhase.COMPLETED;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.lobbyInfo}>
          <Text style={styles.lobbyCodeLabel}>LOBBY</Text>
          <Text style={styles.lobbyCodeText}>{gameState.lobbyId}</Text>
        </View>

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <LogOut size={16} color="#f87171" />
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Result Toast Alert */}
      {lastGuessResult !== null && (
        <View style={[styles.resultBanner, lastGuessResult ? styles.correctBanner : styles.wrongBanner]}>
          <Text style={styles.resultBannerText}>
            {lastGuessResult ? '🎉 CORRECT GUESS!' : '❌ INCORRECT GUESS'}
          </Text>
        </View>
      )}

      {/* Content Body based on Game Phase */}
      {isLobby && (
        <View style={styles.phaseContent}>
          <View style={styles.waitingHeader}>
            <Users size={28} color="#00f0ff" />
            <Text style={styles.waitingTitle}>Waiting for Host to Start</Text>
            <Text style={styles.waitingSubtitle}>
              {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} in lobby
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.playerList}>
            {gameState.players.map((p) => (
              <View
                key={p.id}
                style={[styles.playerCard, p.isDisconnected && styles.playerCardDisconnected]}
              >
                <View style={styles.playerCardLeft}>
                  {p.isHost && <Crown size={18} color="#f59e0b" />}
                  <Text style={styles.playerName}>{p.name}</Text>
                </View>
                <Text style={styles.playerRoleText}>
                  {p.isDisconnected ? 'Reconnecting...' : p.isHost ? 'HOST' : 'PLAYER'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {isPlaying && (
        <View style={styles.phaseContent}>
          <View style={styles.roundBanner}>
            <Text style={styles.roundText}>
              SONG {gameState.currentSongIndex + 1} OF {gameState.totalSongs}
            </Text>
          </View>

          {/* Buzzer Area */}
          <View style={styles.buzzerContainer}>
            <TouchableOpacity
              style={styles.buzzerButton}
              onPress={() => setIsGuessModalOpen(true)}
              activeOpacity={0.85}
            >
              <Zap size={48} color="#ffffff" />
              <Text style={styles.buzzerButtonText}>BUZZ IN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.passButton} onPress={passTurn} activeOpacity={0.8}>
              <SkipForward size={18} color="#94a3b8" />
              <Text style={styles.passButtonText}>Pass Turn</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isFinished && (
        <View style={styles.phaseContent}>
          <View style={styles.waitingHeader}>
            <Trophy size={40} color="#f59e0b" />
            <Text style={styles.waitingTitle}>Game Over!</Text>
            <Text style={styles.waitingSubtitle}>Final Scoreboard</Text>
          </View>

          <ScrollView contentContainerStyle={styles.playerList}>
            {gameState.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <View key={p.id} style={styles.scoreboardRow}>
                  <Text style={styles.scoreRank}>#{index + 1}</Text>
                  <Text style={styles.scoreName}>{p.name}</Text>
                  <Text style={styles.scorePoints}>{p.score} pts</Text>
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Guess Input Modal */}
      <Modal visible={isGuessModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Guess</Text>

            <TextInput
              style={styles.guessInput}
              value={guessText}
              onChangeText={setGuessText}
              placeholder="Song title or artist..."
              placeholderTextColor="#4a5568"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Send size={18} color="#ffffff" />
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsGuessModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070f',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#05070f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#00f0ff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 240, 255, 0.15)',
  },
  lobbyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lobbyCodeLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lobbyCodeText: {
    color: '#00f0ff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  leaveButtonText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  resultBanner: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  correctBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  wrongBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultBannerText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  phaseContent: {
    flex: 1,
    padding: 20,
  },
  waitingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  waitingSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  playerList: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1322',
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
  },
  playerCardDisconnected: {
    opacity: 0.5,
  },
  playerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  playerRoleText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  roundBanner: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 30,
  },
  roundText: {
    color: '#00f0ff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  buzzerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buzzerButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ff007f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 32,
  },
  buzzerButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  passButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  passButtonText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1322',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  scoreRank: {
    color: '#00f0ff',
    fontWeight: '900',
    fontSize: 16,
    width: 40,
  },
  scoreName: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  scorePoints: {
    color: '#ff007f',
    fontWeight: '900',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#0d1322',
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  guessInput: {
    backgroundColor: '#05070f',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    gap: 10,
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff007f',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
});
