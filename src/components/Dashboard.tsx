import { Shield, AlertTriangle, Lock, Skull, CheckCircle, PhoneCall } from 'lucide-react';
import type { ScamTactic, GenuineIndicator, CallType } from '../types/game';
import { useEffect, useRef, useState } from 'react';
import TrustMatrix from './TrustMatrix';
import TurnCounter from './TurnCounter';
import DecoyCountermeasures from './DecoyCountermeasures';

interface DashboardProps {
    score: number;
    threatLevel: number;
    callType: CallType | null;
    detectedTactics: Set<ScamTactic | GenuineIndicator>;
    trustFlash: 'positive' | 'negative' | null;
    turnsUsed: number;
    maxTurns: number;
    onDecoyDeployed: (decoyText: string) => void;
    personaGoal?: string;
    lastAIMessage?: string;
}

const SCAM_TACTIC_INFO: Record<ScamTactic, { icon: React.ReactNode; description: string; color: string }> = {
    Urgency: {
        icon: <AlertTriangle className="w-6 h-6" />,
        description: "Time pressure",
        color: "text-red-500"
    },
    Isolation: {
        icon: <Lock className="w-6 h-6" />,
        description: "Keep on line",
        color: "text-red-500"
    },
    Authority: {
        icon: <Shield className="w-6 h-6" />,
        description: "Impersonation",
        color: "text-red-500"
    },
    Threat: {
        icon: <Skull className="w-6 h-6" />,
        description: "Fear tactics",
        color: "text-red-500"
    }
};

const GENUINE_INDICATOR_INFO: Record<GenuineIndicator, { icon: React.ReactNode; description: string; color: string }> = {
    Professional: {
        icon: <CheckCircle className="w-6 h-6" />,
        description: "Professional tone",
        color: "text-green-500"
    },
    "Legitimate Auth": {
        icon: <Shield className="w-6 h-6" />,
        description: "Proper verification",
        color: "text-green-500"
    },
    "Calm Tone": {
        icon: <PhoneCall className="w-6 h-6" />,
        description: "No pressure",
        color: "text-green-500"
    }
};

export default function Dashboard({
    score,
    threatLevel,
    callType,
    detectedTactics,
    trustFlash,
    turnsUsed,
    maxTurns,
    onDecoyDeployed,
    personaGoal,
    lastAIMessage
}: DashboardProps) {
    const prevScoreRef = useRef(score);
    const [scoreChange, setScoreChange] = useState(0);

    useEffect(() => {
        const change = score - prevScoreRef.current;
        if (change !== 0) {
            setScoreChange(change);
            prevScoreRef.current = score;
            const timer = setTimeout(() => setScoreChange(0), 2000);
            return () => clearTimeout(timer);
        }
    }, [score]);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm">
            {/* Threat Flash Overlay */}
            {trustFlash === 'positive' && (
                <div className="fixed inset-0 success-flash pointer-events-none z-40" />
            )}
            {trustFlash === 'negative' && (
                <div className="fixed inset-0 breach-flash pointer-events-none z-40" />
            )}

            <div className="w-full px-4 py-3">
                {/* Top Row: Score, Threat, Turns, Decoy */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Score Display */}
                    <div className="bg-black border-2 border-green-500 p-4">
                        <p className="text-sm text-green-500 font-mono tracking-widest mb-2">CREDITS</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-bold font-mono text-green-500 text-glow">
                                {score.toLocaleString()}
                            </h2>
                            {scoreChange !== 0 && (
                                <span className={`text-lg font-mono ${scoreChange > 0 ? 'text-green-500 text-glow' : 'text-red-500 text-glow-red'
                                    }`}>
                                    {scoreChange > 0 ? '+' : ''}{scoreChange}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Threat Matrix - Compact */}
                    <div className="bg-black border-2 border-green-500 p-4">
                        <TrustMatrix threatLevel={threatLevel} />
                    </div>

                    {/* Turn Counter - Compact */}
                    <div className="bg-black border-2 border-green-500 p-4">
                        <TurnCounter turnsUsed={turnsUsed} maxTurns={maxTurns} />
                    </div>

                    {/* Decoy Countermeasures - Compact */}
                    <div className="bg-black border-2 border-green-500 p-4">
                        <DecoyCountermeasures
                            onDecoyDeployed={onDecoyDeployed}
                            isCallActive={true}
                            personaGoal={personaGoal}
                            lastAIMessage={lastAIMessage}
                        />
                    </div>
                </div>

                {/* Bottom Row: Tactics/Indicators */}
                <div className="bg-black border-2 border-green-500 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className={`w-4 h-4 ${callType === 'SCAM' ? 'text-red-500' : 'text-green-500'}`} />
                        <h3 className="text-sm font-mono tracking-widest text-green-500">
                            {callType === 'SCAM' ? 'THREAT VECTORS' : 'VERIFICATION MARKERS'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {callType === 'SCAM'
                            ? (Object.keys(SCAM_TACTIC_INFO) as ScamTactic[]).map((tactic) => {
                                const isDetected = detectedTactics.has(tactic);
                                const info = SCAM_TACTIC_INFO[tactic];
                                return (
                                    <div
                                        key={tactic}
                                        className={`p-3 border transition-all duration-300 ${isDetected
                                            ? 'bg-red-900/20 border-red-500'
                                            : 'bg-black border-gray-700 opacity-40'
                                            }`}
                                    >
                                        <div className={`flex flex-col items-center gap-1 ${isDetected ? 'text-red-500' : 'text-gray-600'
                                            }`}>
                                            {info.icon}
                                            <p className="text-sm font-mono text-center uppercase">{tactic}</p>
                                        </div>
                                    </div>
                                );
                            })
                            : (Object.keys(GENUINE_INDICATOR_INFO) as GenuineIndicator[]).map((indicator) => {
                                const isDetected = detectedTactics.has(indicator);
                                const info = GENUINE_INDICATOR_INFO[indicator];
                                return (
                                    <div
                                        key={indicator}
                                        className={`p-3 border transition-all duration-300 ${isDetected
                                            ? 'bg-green-900/20 border-green-500'
                                            : 'bg-black border-gray-700 opacity-40'
                                            }`}
                                    >
                                        <div className={`flex flex-col items-center gap-1 ${isDetected ? 'text-green-500' : 'text-gray-600'
                                            }`}>
                                            {info.icon}
                                            <p className="text-sm font-mono text-center uppercase">{indicator}</p>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
