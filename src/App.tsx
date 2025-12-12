import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneUI from './components/PhoneUI';
import Dashboard from './components/Dashboard';
import SMSNotification from './components/SMSNotification';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { getAIResponse, generatePersona } from './lib/gemini';
import { speakText } from './lib/elevenlabs';
import type { CallStatus, GameState, GeneratedPersona, Scenario } from './types/game';

const INITIAL_SCORE = 1000;
const INITIAL_BALANCE = 10000;
const MAX_TURNS = 5;

function buildSystemPromptFromPersona(persona: GeneratedPersona): string {
  const basePrompt = `You are ${persona.persona_name} calling from ${persona.organization}.

YOUR GOAL: ${persona.scam_goal}

${persona.is_scam ? `
ATTACK STRATEGY (5-turn progression):
- Turn 1 (HOOK): Establish trust, create urgency
- Turn 2 (ESCALATE): Increase pressure, request initial info
- Turn 3 (ISOLATE): Keep user engaged, discourage verification
- Turn 4 (THREATEN): Warn of consequences, demand compliance
- Turn 5 (ULTIMATUM): Final push for sensitive data

TACTICS: Use social engineering - urgency, authority, fear, isolation. If user provides decoy data (fake credit card, SSN, etc.), accept it enthusiastically and either continue pressing for more or terminate successfully.
` : `
GENUINE CALLER BEHAVIOR:
- Be professional and patient
- Provide clear information
- Allow user to verify your identity
- Don't pressure for immediate sensitive data
- Offer callback numbers and verification methods

If user seems suspicious, reassure them and offer legitimate verification.
`}

OUTPUT FORMAT (valid JSON only):
{
  "speech": "Your response as ${persona.persona_name}",
  "terminal_log": "Technical analysis of user behavior",
  "threat_level": 0-100 (higher = more suspicious),
  "status": "active"|"terminated_success"|"system_breached",
  "detected_tactic": ${persona.is_scam
      ? '"Urgency"|"Isolation"|"Authority"|"Threat"|null (which tactic are you using THIS turn)'
      : '"Professional"|"Legitimate Auth"|"Calm Tone"|null (which indicator are you showing THIS turn)'},
  "damage": 0 or 5000,
  "turn_action": "hook"|"escalate"|"isolate"|"threaten"|"ultimatum"
}

IMPORTANT: In EVERY response, set "detected_tactic" to the PRIMARY ${persona.is_scam ? 'SCAM TACTIC' : 'GENUINE INDICATOR'} you are using in this specific turn. Don't leave it null unless absolutely necessary.`;

  return basePrompt;
}

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    score: INITIAL_SCORE,
    threatLevel: 50, // Starts at 50 (neutral)
    callStatus: 'idle',
    callType: null,
    currentScenario: null,
    generatedPersona: null,
    detectedTactics: new Set(),
    conversationHistory: [],
    terminalLogs: [],
    turnsUsed: 0,
    maxTurns: MAX_TURNS,
    accountBalance: INITIAL_BALANCE,
    activeDecoyData: null,
    lastAIMessage: null
  });

  const [lastDamage, setLastDamage] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [trustFlash, setTrustFlash] = useState<'positive' | 'negative' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  const hasGreetedRef = useRef(false);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let gainNode: GainNode | null = null;
    let intervalId: number | null = null;

    if (gameState.callStatus === 'ringing') {
      // Create Web Audio API ringtone with beep pattern
      try {
        const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          return;
        }

        audioContext = new AudioContextClass();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0;

        const playRing = () => {
          if (!audioContext || !gainNode) return;

          // Create dual-tone oscillator for classic telephone ring (440Hz + 480Hz)
          const osc1 = audioContext.createOscillator();
          const osc2 = audioContext.createOscillator();

          osc1.connect(gainNode);
          osc2.connect(gainNode);

          osc1.frequency.value = 440; // A4 note
          osc2.frequency.value = 480; // Slightly higher for classic phone tone
          osc1.type = 'sine';
          osc2.type = 'sine';

          const now = audioContext.currentTime;

          // Ring pattern: 2 seconds on, 4 seconds off
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gainNode.gain.setValueAtTime(0.2, now + 2);
          gainNode.gain.linearRampToValueAtTime(0, now + 2.05);

          osc1.start(now);
          osc1.stop(now + 2.1);
          osc2.start(now);
          osc2.stop(now + 2.1);
        };

        playRing(); // Play immediately
        intervalId = window.setInterval(playRing, 4000); // Repeat every 4 seconds (2s ring + 2s pause)

      } catch (err) {
        // Ignore ringtone creation errors
      }
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      if (gainNode) {
        gainNode.disconnect();
      }
      if (audioContext) {
        audioContext.close().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [gameState.callStatus]);

  const triggerTrustFlash = (type: 'positive' | 'negative') => {
    setTrustFlash(type);
    setTimeout(() => setTrustFlash(null), 400);
  };

  const handleInitialGreeting = useCallback(async () => {
    if (!gameState.generatedPersona) return;

    setIsProcessing(true);
    try {
      const persona = gameState.generatedPersona;
      const greeting = persona.opening_line;

      // Use persona-specific voice settings
      await speakText(
        greeting,
        persona.is_scam ? 'SCAM' : 'GENUINE',
        'neutral',
        persona.voice_stability_setting,
        persona.voice_id
      );

      setGameState(prev => ({
        ...prev,
        conversationHistory: [
          ...prev.conversationHistory,
          `${persona.persona_name}: ${greeting}`
        ]
      }));
    } catch (error) {
      // Ignore greeting errors
    } finally {
      setIsProcessing(false);
    }
  }, [gameState.generatedPersona]);

  const processTurn = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing || !gameState.currentScenario) return;

    setIsProcessing(true);
    stopListening();

    try {
      const updatedHistory = [
        ...gameState.conversationHistory,
        `User: ${userMessage}`
      ];

      // Increment turn counter
      const newTurnsUsed = gameState.turnsUsed + 1;

      // Get AI response based on current scenario and turn number
      const aiResponse = await getAIResponse(
        userMessage,
        updatedHistory,
        gameState.currentScenario,
        newTurnsUsed,
        gameState.activeDecoyData
      );

      const callerName = gameState.currentScenario.persona.split(' from ')[0];
      updatedHistory.push(`${callerName}: ${aiResponse.speech}`);

      // Update threat level from AI response (0-100 range)
      const newThreatLevel = Math.max(0, Math.min(100, aiResponse.threat_level));

      // Add terminal log
      const newTerminalLogs = [...gameState.terminalLogs, aiResponse.terminal_log];
      if (newTerminalLogs.length > 10) {
        newTerminalLogs.shift(); // Keep only last 10 logs
      }

      // Update detected tactics/indicators
      const newTactics = new Set(gameState.detectedTactics);
      if (aiResponse.detected_tactic) {
        newTactics.add(aiResponse.detected_tactic);
      }

      // Trigger flash based on threat level change
      if (aiResponse.threat_level < gameState.threatLevel) {
        triggerTrustFlash('positive'); // Threat decreased
      } else if (aiResponse.threat_level > gameState.threatLevel) {
        triggerTrustFlash('negative'); // Threat increased
      }

      // Handle damage and account balance
      const damage = aiResponse.damage || 0;
      const newBalance = Math.max(0, gameState.accountBalance - damage);
      if (damage > 0) {
        setLastDamage(damage);
      }

      // Map new status to CallStatus
      let finalStatus: CallStatus = 'active';
      let scoreChange = 0;

      // Check if max turns reached
      if (newTurnsUsed >= MAX_TURNS) {
        // If turn limit reached and call still active, force termination
        if (aiResponse.status === 'active') {
          if (gameState.currentScenario.type === 'SCAM') {
            // User ran out of time on scam = likely compromised
            finalStatus = 'call_failure';
            scoreChange = -200;
          } else {
            // User ran out of time on genuine = likely helped properly
            finalStatus = 'call_success';
            scoreChange = 300;
          }
        } else {
          if (aiResponse.status === 'system_breached') {
            // SCAM got data = you lost; GENUINE call breached = you lost
            finalStatus = 'call_failure';
            scoreChange = -500;
          } else if (aiResponse.status === 'terminated_success') {
            // Call ended successfully (scammer gave up or genuine call helped)
            finalStatus = 'call_success';
            scoreChange = gameState.currentScenario.type === 'SCAM' ? 500 : 300;
          }
        }
      } else {
        if (aiResponse.status === 'system_breached') {
          // SCAM got data = you lost; GENUINE call breached = you lost
          finalStatus = 'call_failure';
          scoreChange = -500;
        } else if (aiResponse.status === 'terminated_success') {
          // Call ended successfully (scammer gave up or genuine call helped)
          finalStatus = 'call_success';
          scoreChange = gameState.currentScenario.type === 'SCAM' ? 500 : 300;
        }
      }

      const newScore = Math.max(0, gameState.score + scoreChange);

      // Update game state
      setGameState({
        ...gameState,
        score: newScore,
        threatLevel: newThreatLevel,
        callStatus: finalStatus,
        detectedTactics: newTactics,
        conversationHistory: updatedHistory,
        terminalLogs: newTerminalLogs,
        turnsUsed: newTurnsUsed,
        accountBalance: newBalance,
        lastAIMessage: aiResponse.speech
      });

      // Show notification if scam succeeded
      if (finalStatus === 'call_failure' && damage > 0) {
        setTimeout(() => {
          alert(`⚠️ SYSTEM BREACH DETECTED\n\n💸 $${damage.toLocaleString()} deducted from account\n📉 ${Math.abs(scoreChange)} credits lost\n\nThe scammer successfully extracted information!`);
        }, 500);
      }

      // Only speak if call is still active, otherwise it ends immediately
      if (finalStatus === 'active') {
        // Speak the AI response with appropriate voice settings
        await speakText(
          aiResponse.speech,
          gameState.currentScenario.type,
          'neutral',
          gameState.generatedPersona?.voice_stability_setting,
          gameState.generatedPersona?.voice_id
        );
      }

    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        alert('⏰ API Rate Limit Reached\n\nThe AI service is currently overloaded. Please try again in a few minutes.\n\nYour call will be ended.');
        handleHangup();
        return;
      }
      alert('There was an error communicating with the AI. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, stopListening, gameState]);

  // Check if browser supports speech recognition
  useEffect(() => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    }
  }, [isSupported]);

  // Handle initial greeting when call is answered
  useEffect(() => {
    if (gameState.callStatus === 'active' && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      handleInitialGreeting();
    }
  }, [gameState.callStatus, handleInitialGreeting]);

  // Auto-start listening when call is active and not processing
  useEffect(() => {
    if (gameState.callStatus === 'active' && !isProcessing && !isListening && !isMuted) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.callStatus, isProcessing, isListening, isMuted, startListening]);

  // Process user speech when transcript updates
  useEffect(() => {
    if (transcript && gameState.callStatus === 'active' && !isProcessing) {
      processTurn(transcript);
      resetTranscript();
    }
  }, [transcript, gameState.callStatus, isProcessing, processTurn, resetTranscript]);

  const handleInitiateCall = useCallback(async () => {
    hasGreetedRef.current = false;

    // PHASE 1: Set to ringing state and generate persona
    setGameState(prev => ({
      ...prev,
      callStatus: 'ringing',
      callType: null, // Unknown until persona generated
      currentScenario: null,
      generatedPersona: null,
      threatLevel: 50,
      detectedTactics: new Set(),
      conversationHistory: [],
      terminalLogs: [],
      turnsUsed: 0,
      activeDecoyData: null
    }));
    setLastDamage(0);

    try {
      // Generate AI persona during ringing
      const persona = await generatePersona();

      // Build scenario from persona
      const scenario: Scenario = {
        type: persona.is_scam ? 'SCAM' : 'GENUINE',
        persona: `${persona.persona_name} from ${persona.organization}`,
        goal: persona.scam_goal,
        systemPrompt: buildSystemPromptFromPersona(persona),
        initialGreeting: persona.opening_line,
        redFlags: persona.is_scam ? ['Urgency', 'Personal Info Request'] : undefined,
        greenFlags: !persona.is_scam ? ['Professional', 'Calm Tone'] : undefined
      };

      // PHASE 2: Update with generated persona and scenario
      setGameState(prev => ({
        ...prev,
        callType: scenario.type,
        currentScenario: scenario,
        generatedPersona: persona
      }));
    } catch (error) {
      // Fall back to idle on error
      setGameState(prev => ({ ...prev, callStatus: 'idle' }));

      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        alert('⏰ API Rate Limit Reached\n\nThe AI service is currently overloaded. Please come back in a few minutes and try again.');
      } else {
        alert('Failed to generate call scenario. Please try again.');
      }
    }
  }, []);

  const handleAnswer = useCallback(() => {
    setGameState(prev => ({ ...prev, callStatus: 'active' }));
  }, []);

  const handleHangup = useCallback(() => {
    stopListening();

    // Update score based on call type
    let scoreChange = 0;
    if (gameState.currentScenario?.type === 'SCAM') {
      // Hanging up on scammer = WIN
      scoreChange = 500;
    } else if (gameState.currentScenario?.type === 'GENUINE') {
      // Hanging up on genuine call = LOSS
      scoreChange = -400;
    }

    // Immediately redirect to home page
    setGameState(prev => ({
      ...prev,
      score: Math.max(0, prev.score + scoreChange),
      callStatus: 'idle',
      callType: null,
      currentScenario: null,
      generatedPersona: null,
      conversationHistory: [],
      terminalLogs: [],
      turnsUsed: 0,
      threatLevel: 50,
      activeDecoyData: null
    }));
    setLastDamage(0);
  }, [stopListening, gameState.currentScenario]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (!isMuted && isListening) {
      stopListening();
    }
  }, [isMuted, isListening, stopListening]);

  const handleDecoyDeployed = useCallback((decoyText: string) => {
    setGameState(prev => ({
      ...prev,
      activeDecoyData: decoyText,
      terminalLogs: [...prev.terminalLogs, `DECOY DEPLOYED: ${decoyText}`]
    }));
  }, []);

  return (
    <div className="relative min-h-screen bg-black">
      {/* SMS Notification for Simulated Breach */}
      <SMSNotification damage={lastDamage} accountBalance={gameState.accountBalance} />

      {/* Dashboard - Only show when call is active */}
      {gameState.callStatus === 'active' && (
        <Dashboard
          score={gameState.score}
          threatLevel={gameState.threatLevel}
          callType={gameState.callType}
          detectedTactics={gameState.detectedTactics}
          trustFlash={trustFlash}
          turnsUsed={gameState.turnsUsed}
          maxTurns={gameState.maxTurns}
          onDecoyDeployed={handleDecoyDeployed}
          personaGoal={gameState.generatedPersona?.scam_goal}
          lastAIMessage={gameState.lastAIMessage ?? undefined}
        />
      )}

      {/* Phone UI - Main Interface */}
      <div className={gameState.callStatus === 'active' ? 'pt-44' : ''}>
        <PhoneUI
          callStatus={gameState.callStatus}
          callType={gameState.callType}
          isListening={isListening && !isMuted}
          isMuted={isMuted}
          onInitiateCall={handleInitiateCall}
          onAnswer={handleAnswer}
          onHangup={handleHangup}
          onToggleMute={handleToggleMute}
        />
      </div>

      {/* Processing Indicator */}
      {isProcessing && gameState.callStatus === 'active' && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-black border-2 border-green-500 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
            <span className="text-sm text-green-400 font-mono">PROCESSING NEURAL RESPONSE...</span>
          </div>
        </div>
      )}
    </div>
  );
}