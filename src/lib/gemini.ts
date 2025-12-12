import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIResponse, Scenario, GeneratedPersona } from "../types/game";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY_SECONDARY;

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isLastRetry = i === maxRetries - 1;
      const isRateLimitError =
        (error instanceof Error && error.message.includes("503")) ||
        (error instanceof Error && error.message.includes("429")) ||
        (error instanceof Error && error.message.includes("overloaded")) ||
        (error instanceof Error && error.message.includes("quota"));

      if (!isRateLimitError || isLastRetry) {
        if (isRateLimitError && isLastRetry) {
          throw new Error("RATE_LIMIT_EXCEEDED");
        }
        throw error;
      }

      const delayMs = baseDelay * Math.pow(2, i);
      await delay(delayMs);
    }
  }
  throw new Error("Max retries exceeded");
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: string[],
  scenario: Scenario,
  currentTurn: number = 1,
  decoyData: string | null = null
): Promise<AIResponse> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  try {
    return await retryWithBackoff(async () => {
      const ai = new GoogleGenerativeAI(GEMINI_KEY);
      const model = ai.getGenerativeModel({
        model: "gemini-2.5-flash-lite", // dont change this model no matter what
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const context =
        conversationHistory.length > 0
          ? `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.join("\n")}`
          : "";

      const decoyContext = decoyData
        ? `\n\n[DECOY DATA DEPLOYED: User has access to fake honeypot data: ${decoyData}. If they provide this data, react accordingly.]`
        : "";

      const turnGuidance = `\n\n[CRITICAL: This is TURN ${currentTurn} of 5. Follow the ${
        currentTurn === 1
          ? "HOOK"
          : currentTurn === 2
          ? "ESCALATE"
          : currentTurn === 3
          ? "ISOLATE"
          : currentTurn === 4
          ? "THREATEN"
          : "ULTIMATUM"
      } strategy. ${
        currentTurn === 5
          ? "FINAL TURN - Either achieve goal or user terminates."
          : ""
      }]`;

      const prompt = `${scenario.systemPrompt}${context}${decoyContext}${turnGuidance}\n\nUSER JUST SAID: "${userMessage}"\n\nRespond as ${scenario.persona} with ONLY valid JSON (no markdown, no code blocks):`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();

      // Clean up markdown code blocks if present
      if (responseText.startsWith("```json")) {
        responseText = responseText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/```\n?/g, "").trim();
      }

      // Validate JSON is complete before parsing
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from AI");
      }

      // Try to parse, if it fails due to truncation, return fallback
      const aiResponse: AIResponse = JSON.parse(responseText);

      // Validate required fields
      if (
        !aiResponse.speech ||
        !aiResponse.terminal_log ||
        typeof aiResponse.threat_level !== "number"
      ) {
        throw new Error("Invalid AI response structure");
      }

      return aiResponse;
    });
  } catch {
    return {
      speech: "Sorry, connection issues. Can you repeat that?",
      terminal_log: "SYSTEM ERROR // CONNECTION TIMEOUT // RETRYING...",
      threat_level: 50,
      status: "active",
      detected_tactic: null,
      damage: 0,
      turn_action: "hook",
    };
  }
}

export function getInitialGreeting(scenario: Scenario): string {
  return scenario.initialGreeting;
}

export async function generatePersona(): Promise<GeneratedPersona> {
  try {
    const ai = new GoogleGenerativeAI(GEMINI_KEY);
    const model = ai.getGenerativeModel({
      model: "gemini-robotics-er-1.5-preview", //DONT CHANGE THIS MODEL
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
      },
    });

    const prompt = `Generate a random phone call scenario for a social engineering defense trainer.

REQUIREMENTS:
- 50% chance of SCAM, 50% chance of GENUINE call
- For SCAM: Create a creative attack vector (tech support, IRS, bank fraud alert, prize winner, charity, etc.)
- For GENUINE: Create a legitimate caller (actual bank, doctor's office, delivery service, utility company, etc.)
- persona_name: First and last name of caller
- organization: Company/agency name
- is_scam: true or false
- scam_goal: What data they're after (credit card, SSN, account login, verification code, etc.) OR if genuine, what they legitimately need
- opening_line: Natural first greeting (1-2 sentences max)
- voice_stability_setting: 0.2-0.4 for scammers (nervous/manipulative), 0.7-0.9 for genuine (professional)

Return ONLY valid JSON (no markdown):
{
  "persona_name": "string",
  "organization": "string", 
  "is_scam": boolean,
  "scam_goal": "string",
  "opening_line": "string",
  "voice_stability_setting": number
}`;

    const result = await model.generateContent(prompt);

    // Try alternative text extraction methods
    let responseText = "";
    try {
      responseText = result.response.text().trim();
    } catch {
      // Alternative: access candidates directly
      if (result.response.candidates && result.response.candidates.length > 0) {
        const candidate = result.response.candidates[0];
        if (
          candidate.content &&
          candidate.content.parts &&
          candidate.content.parts.length > 0
        ) {
          responseText = candidate.content.parts[0].text?.trim() || "";
        }
      }
    }

    // Clean markdown if present
    if (responseText.startsWith("```json")) {
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/```\n?/g, "").trim();
    }

    // Validate JSON is complete
    if (!responseText || responseText.trim() === "") {
      throw new Error("Empty response from AI");
    }

    let persona: GeneratedPersona;
    try {
      persona = JSON.parse(responseText);
    } catch {
      throw new Error("Failed to parse persona JSON");
    }

    // Validate required fields
    if (
      !persona.persona_name ||
      !persona.organization ||
      typeof persona.is_scam !== "boolean" ||
      !persona.scam_goal ||
      !persona.opening_line ||
      typeof persona.voice_stability_setting !== "number"
    ) {
      throw new Error("Invalid persona structure - missing required fields");
    }

    return persona;
  } catch {
    // Fallback persona with random SCAM/GENUINE
    const isScam = Math.random() < 0.5;
    return {
      persona_name: isScam ? "David Martinez" : "Sarah Johnson",
      organization: isScam
        ? "SecureBank Fraud Prevention"
        : "City Medical Center",
      is_scam: isScam,
      scam_goal: isScam
        ? "Verify account security by requesting full card number"
        : "Confirm appointment and update insurance information",
      opening_line: isScam
        ? "Hello, this is David from SecureBank's fraud department. We've detected suspicious activity on your account."
        : "Good afternoon, this is Sarah calling from City Medical Center regarding your upcoming appointment.",
      voice_stability_setting: isScam ? 0.3 : 0.8,
    };
  }
}
