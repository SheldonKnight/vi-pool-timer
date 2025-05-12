import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Modal,
  Share,
} from "react-native";
import { useTimer } from "./useTimer";

// Get screen dimensions for responsive sizing
const { width, height } = Dimensions.get("window");
const isTablet = width > 768;

// Function to calculate responsive sizes
const size = (size) => {
  const baseWidth = 375; // Base width (iPhone X)
  return Math.round((width / baseWidth) * size);
};

export default function App() {
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [initialTime, setInitialTime] = useState("60");
  const [warningTime, setWarningTime] = useState("30");
  const [extendTime, setExtendTime] = useState("15");
  const [autoSwitch, setAutoSwitch] = useState(false);
  const [finalBeepCountdown, setFinalBeepCountdown] = useState("3");

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [activePlayer, setActivePlayer] = useState("player1");

  const [showReport, setShowReport] = useState(false);
  const [gameStats, setGameStats] = useState({
    player1Turns: 0,
    player2Turns: 0,
    totalTime: 0,
  });

  // Listen for dimension changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get("window");
      setOrientation(height > width ? "portrait" : "landscape");
    };

    Dimensions.addEventListener("change", updateOrientation);
    return () => {
      // Clean up listener (for older React Native versions)
      // For newer versions, this is handled automatically
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener("change", updateOrientation);
      }
    };
  }, []);

  const parsedInitialTime = parseInt(initialTime, 10);
  const parsedExtendTime = parseInt(extendTime, 10);
  const parsedWarningTime = parseInt(warningTime, 10);
  const parsedFinalBeepCountdown = parseInt(finalBeepCountdown, 10);

  const {
    timeLeft,
    isRunning,
    isWarningMode,
    startTimer,
    stopTimer,
    resetTimer,
    extendTimer,
  } = useTimer(
    parsedInitialTime,
    parsedWarningTime,
    parsedExtendTime,
    parsedFinalBeepCountdown
  );

  // Add effect to handle auto-switching
  useEffect(() => {
    if (timeLeft === 0 && autoSwitch) {
      switchTurn();
    }
  }, [timeLeft, autoSwitch]);

  const validateAndStartGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) {
      return Alert.alert("Error", "Please enter both player names.");
    }

    if (
      isNaN(parsedInitialTime) ||
      isNaN(parsedExtendTime) ||
      isNaN(parsedWarningTime) ||
      parsedInitialTime <= 0 ||
      parsedExtendTime <= 0 ||
      parsedWarningTime <= 0
    ) {
      return Alert.alert("Error", "All timer values must be positive numbers.");
    }

    if (parsedWarningTime >= parsedInitialTime) {
      return Alert.alert(
        "Error",
        "Warning/beep time must be less than initial time."
      );
    }

    if (parsedFinalBeepCountdown <= 0 || isNaN(parsedFinalBeepCountdown)) {
      return Alert.alert("Error", "Final countdown must be a positive number.");
    }
    if (parsedFinalBeepCountdown >= parsedInitialTime) {
      return Alert.alert(
        "Error",
        "Final countdown must be less than initial time."
      );
    }

    setIsGameStarted(true);
    // Reset timer with new initial time when game starts
    resetTimer();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const switchTurn = () => {
    stopTimer();
    resetTimer();
    setActivePlayer((prev) => {
      const newPlayer = prev === "player1" ? "player2" : "player1";
      setGameStats((prevStats) => ({
        ...prevStats,
        player1Turns:
          prev === "player1"
            ? prevStats.player1Turns + 1
            : prevStats.player1Turns,
        player2Turns:
          prev === "player2"
            ? prevStats.player2Turns + 1
            : prevStats.player2Turns,
      }));
      return newPlayer;
    });
    if (autoSwitch) {
      console.log("yea");
      startTimer();
    }
  };

  const endGame = () => {
    stopTimer();
    resetTimer();
    setShowReport(true);
  };

  const handleCloseReport = () => {
    setShowReport(false);
    setIsGameStarted(false);
    setActivePlayer("player1");
    setGameStats({ player1Turns: 0, player2Turns: 0, totalTime: 0 });
  };

  const handleShareReport = async () => {
    try {
      const reportText =
        `🎱 Pool Game Report\n\n` +
        `Player 1 (${player1Name}): ${gameStats.player1Turns} turns\n` +
        `Player 2 (${player2Name}): ${gameStats.player2Turns} turns\n` +
        `Total Game Time: ${formatTime(gameStats.totalTime)}\n\n` +
        `Initial Time: ${formatTime(parsedInitialTime)}\n` +
        `Warning/Beep Time: ${formatTime(parsedWarningTime)}\n` +
        `Extend Time: ${formatTime(parsedExtendTime)}`;

      await Share.share({
        message: reportText,
        title: "Pool Game Report",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the report");
    }
  };

  // Update total time when timer changes
  useEffect(() => {
    if (isRunning) {
      setGameStats((prev) => ({
        ...prev,
        totalTime: prev.totalTime + 1,
      }));
    }
  }, [timeLeft, isRunning]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        {!isGameStarted ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.setupContainer}>
              <Text style={styles.title}>🎱 Pool Timer Setup</Text>

              <View style={styles.formContainer}>
                <View
                  style={[styles.inputRow, isTablet && styles.tabletInputRow]}
                >
                  <View
                    style={[
                      styles.inputGroup,
                      isTablet && styles.tabletInputGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>Player One Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter player one name"
                      placeholderTextColor="#aaa"
                      value={player1Name}
                      onChangeText={setPlayer1Name}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      isTablet && styles.tabletInputGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>Player Two Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter player two name"
                      placeholderTextColor="#aaa"
                      value={player2Name}
                      onChangeText={setPlayer2Name}
                    />
                  </View>
                </View>

                <View
                  style={[styles.inputRow, isTablet && styles.tabletInputRow]}
                >
                  <View
                    style={[
                      styles.inputGroup,
                      isTablet && styles.tabletInputGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>
                      Initial Time (seconds)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter initial time"
                      placeholderTextColor="#aaa"
                      keyboardType="numeric"
                      value={initialTime}
                      onChangeText={setInitialTime}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputGroup,
                      isTablet && styles.tabletInputGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>
                      Warning/Beep Time (seconds)
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter warning/beep time"
                      placeholderTextColor="#aaa"
                      keyboardType="numeric"
                      value={warningTime}
                      onChangeText={setWarningTime}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Extend Time (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter extend time"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={extendTime}
                    onChangeText={setExtendTime}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Final Countdown Start (seconds)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter countdown start time"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={finalBeepCountdown}
                    onChangeText={setFinalBeepCountdown}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={[styles.input, styles.switchContainer]}>
                    <Text style={styles.switchLabel}>Auto Switch Players</Text>
                    <Switch
                      value={autoSwitch}
                      onValueChange={setAutoSwitch}
                      trackColor={{ false: "#555", true: "#81b0ff" }}
                      thumbColor={autoSwitch ? "#f5dd4b" : "#f4f3f4"}
                      ios_backgroundColor="#3e3e3e"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TimerButton
                  onPress={validateAndStartGame}
                  label="Start Game"
                  color="#27ae60"
                />
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.gameContainer}>
            <Text style={styles.turnText}>
              🎯 {activePlayer === "player1" ? player1Name : player2Name}'s Turn
            </Text>

            <Text style={[styles.timer, isWarningMode && styles.warningTimer]}>
              {formatTime(timeLeft)}
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>⏱ Initial</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(parsedInitialTime)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>⚠️ Warning/Beep</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(parsedWarningTime)}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>➕ Extend</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(parsedExtendTime)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>🔄 Auto Switch</Text>
                  <TouchableOpacity onPress={() => setAutoSwitch(!autoSwitch)}>
                    <Text style={[styles.infoValue, styles.tappableValue]}>
                      {autoSwitch ? "On" : "Off"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.gameControls}>
              <View style={styles.buttonRow}>
                {timeLeft === 0 ? (
                  <View style={[styles.button, styles.disabledButton]}>
                    <Text style={styles.buttonText}>Start</Text>
                  </View>
                ) : (
                  <TimerButton
                    onPress={isRunning ? stopTimer : startTimer}
                    label={isRunning ? "Stop" : "Start"}
                    color="#27ae60"
                  />
                )}
                <TimerButton
                  onPress={resetTimer}
                  label="Reset"
                  color="#2980b9"
                />
                <TimerButton
                  onPress={extendTimer}
                  label={`+${formatTime(parsedExtendTime)}`}
                  color="#8e44ad"
                />
              </View>

              <View style={styles.buttonRow}>
                <TimerButton
                  onPress={switchTurn}
                  label="Next Turn"
                  color="#f39c12"
                  style={styles.wideButton}
                />
                <TimerButton
                  onPress={endGame}
                  label="End Game"
                  color="#c0392b"
                  style={styles.wideButton}
                />
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={showReport}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseReport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Report</Text>

            <View style={styles.reportSection}>
              <Text style={styles.reportLabel}>Player 1 ({player1Name})</Text>
              <Text style={styles.reportValue}>
                {gameStats.player1Turns} turns
              </Text>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportLabel}>Player 2 ({player2Name})</Text>
              <Text style={styles.reportValue}>
                {gameStats.player2Turns} turns
              </Text>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportLabel}>Total Game Time</Text>
              <Text style={styles.reportValue}>
                {formatTime(gameStats.totalTime)}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.shareButton]}
                onPress={handleShareReport}
              >
                <Text style={styles.modalButtonText}>Share Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={handleCloseReport}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const TimerButton = ({ onPress, label, color = "#27ae60", style }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }, style]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: size(16),
    paddingTop: size(20),
    paddingBottom: size(30),
  },
  setupContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  formContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: size(12),
    padding: size(12),
    marginBottom: size(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  inputRow: {
    flexDirection: "column",
  },
  tabletInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabletInputGroup: {
    flex: 0.48,
  },
  inputGroup: {
    marginBottom: size(12),
  },
  inputLabel: {
    color: "#ddd",
    fontSize: size(14),
    fontWeight: "600",
    marginBottom: size(4),
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    borderRadius: size(10),
    padding: size(12),
    fontSize: size(15),
    borderWidth: 1,
    borderColor: "#444",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: size(8),
    paddingHorizontal: size(10),
    borderRadius: size(10),
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
  },
  switchLabel: {
    color: "#ddd",
    fontSize: size(15),
    fontWeight: "500",
  },
  title: {
    color: "#fff",
    fontSize: size(24),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: size(24),
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  gameContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: size(20),
    paddingTop: size(40),
    paddingBottom: size(30),
  },
  turnText: {
    fontSize: size(28),
    fontWeight: "bold",
    color: "#f1c40f",
    textAlign: "center",
    marginBottom: size(10),
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  timer: {
    fontSize: size(72),
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
    }),
    letterSpacing: 2,
  },
  warningTimer: {
    color: "#e74c3c",
  },
  infoBox: {
    marginVertical: size(20),
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: size(16),
    padding: size(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: size(10),
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    color: "#aaa",
    fontSize: size(14),
    marginBottom: size(4),
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  infoValue: {
    color: "#fff",
    fontSize: size(16),
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  gameControls: {
    width: "100%",
    marginTop: size(20),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: size(20),
  },
  button: {
    backgroundColor: "#27ae60",
    padding: size(14),
    borderRadius: size(12),
    flex: 1,
    marginHorizontal: size(5),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    minHeight: size(50),
  },
  wideButton: {
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: size(16),
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  disabledButton: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  tappableValue: {
    textDecorationLine: "underline",
    color: "#81b0ff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    borderRadius: size(16),
    padding: size(20),
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: "#fff",
    fontSize: size(24),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: size(20),
  },
  reportSection: {
    marginBottom: size(15),
    padding: size(10),
    backgroundColor: "#2a2a2a",
    borderRadius: size(8),
  },
  reportLabel: {
    color: "#aaa",
    fontSize: size(14),
    marginBottom: size(4),
  },
  reportValue: {
    color: "#fff",
    fontSize: size(18),
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: size(20),
  },
  modalButton: {
    flex: 1,
    padding: size(12),
    borderRadius: size(8),
    marginHorizontal: size(5),
  },
  shareButton: {
    backgroundColor: "#27ae60",
  },
  closeButton: {
    backgroundColor: "#c0392b",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: size(16),
    fontWeight: "600",
    textAlign: "center",
  },
  startGameButton: {
    marginTop: size(10),
    paddingVertical: size(14),
    backgroundColor: "#27ae60",
    borderRadius: size(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
