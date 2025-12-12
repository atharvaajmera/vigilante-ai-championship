import type { CallType } from "../types/game";

const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_KEY;

// Voice IDs for different personas - expanded voice library
const SCAM_VOICES = [
  "pqHfZKP75CvOlQylNhV4", // Bill - Menacing/aggressive
  "nPczCjzI2devNBz1zQrb", // Brian - Urgent/pushy
  "N2lVS1w4EtoT3dr4eOWO", // Callum - Manipulative
  "IKne3meq5aSn9XLyUdCD", // Charlie - Fast-talking
  "onwK4e9ZLuTAKqWW03F9", // Daniel - Authoritative scammer
];

const GENUINE_VOICES = [
  "EXAVITQu4vr4xnSDxMaL", // Sarah - Professional/calm
  "21m00Tcm4TlvDq8ikWAM", // Rachel - Friendly professional
  "AZnzlk1XvdvUeBnXmlld", // Domi - Warm customer service
  "ErXwobaYiN019PkySvjV", // Antoni - Polite and clear
  "MF3mGyEYCl7XYWbV9V6O", // Elli - Professional female
];

// Helper function to get random voice from array
function getRandomVoice(voices: string[]): string {
  return voices[Math.floor(Math.random() * voices.length)];
}

export async function speakText(
  text: string,
  callType: CallType = "SCAM",
  sentiment: "aggressive" | "professional" | "neutral" = "neutral",
  customStability?: number
): Promise<void> {
  // Fallback to browser speech synthesis if ElevenLabs is not configured
  if (!ELEVENLABS_KEY || ELEVENLABS_KEY === "undefined") {
    return playBrowserSpeech(text, callType);
  }

  try {
    // Select random voice from appropriate category for variety
    const voiceId =
      callType === "SCAM"
        ? getRandomVoice(SCAM_VOICES)
        : getRandomVoice(GENUINE_VOICES);

    // Use custom stability if provided, otherwise default based on call type
    const stability =
      customStability !== undefined
        ? customStability
        : callType === "SCAM"
        ? sentiment === "aggressive"
          ? 0.3
          : 0.4
        : 0.9;

    // Adjust voice settings based on call type and sentiment
    const voiceSettings =
      callType === "SCAM"
        ? {
            // Scam calls: jittery, unstable, aggressive
            stability,
            similarity_boost: 0.75,
            style: 0.7,
            use_speaker_boost: true,
          }
        : {
            // Genuine calls: calm, stable, professional
            stability,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          };

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 401) {
        return playBrowserSpeech(text, callType);
      }

      throw new Error(
        `ElevenLabs API error: ${response.status} - ${errorText}`
      );
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch(reject);
    });
  } catch {
    // Fallback to browser speech synthesis
    return playBrowserSpeech(text, callType);
  }
}

// Fallback browser speech synthesis
function playBrowserSpeech(text: string, callType: CallType): Promise<void> {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);

    if (callType === "SCAM") {
      utterance.rate = 1.1; // Faster, more urgent
      utterance.pitch = 0.8; // Lower pitch, menacing
      utterance.volume = 1.0;
    } else {
      utterance.rate = 0.9; // Slower, more professional
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 0.9;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Still resolve on error to continue game

    window.speechSynthesis.speak(utterance);
  });
}
