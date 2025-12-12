export type CallType = "SCAM" | "GENUINE";

export type ScamTactic = "Urgency" | "Isolation" | "Authority" | "Threat";
export type GenuineIndicator = "Professional" | "Legitimate Auth" | "Calm Tone";

export type CallStatus =
  | "idle"
  | "ringing"
  | "active"
  | "hung_up"
  | "call_success"
  | "call_failure"
  | "game_over";

export interface GeneratedPersona {
  persona_name: string;
  organization: string;
  is_scam: boolean;
  scam_goal: string;
  opening_line: string;
  voice_stability_setting: number; // 0.2-0.9
}

export interface AIResponse {
  speech: string;
  terminal_log: string; // Tech-sounding analysis log
  threat_level: number; // 0-100
  status: "active" | "terminated_success" | "system_breached";
  detected_tactic?: ScamTactic | GenuineIndicator | null;
  damage?: number; // Simulated financial damage (0 or 5000)
  turn_action?: "hook" | "escalate" | "isolate" | "threaten" | "ultimatum";
}

export interface Scenario {
  type: CallType;
  persona: string;
  goal: string;
  systemPrompt: string;
  redFlags?: string[];
  greenFlags?: string[];
  initialGreeting: string;
}

export interface GameState {
  score: number;
  threatLevel: number;
  callStatus: CallStatus;
  callType: CallType | null;
  currentScenario: Scenario | null;
  generatedPersona: GeneratedPersona | null;
  detectedTactics: Set<ScamTactic | GenuineIndicator>;
  conversationHistory: string[];
  terminalLogs: string[];
  turnsUsed: number;
  maxTurns: number;
  accountBalance: number;
  activeDecoyData: string | null;
  lastAIMessage: string | null;
}
