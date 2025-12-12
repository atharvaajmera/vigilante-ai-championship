import { useState, useMemo } from 'react';
import { Shield, Zap, Lightbulb } from 'lucide-react';
import { generateDecoyData, suggestDecoyType, type DecoyData } from '../lib/decoyGenerator';

interface DecoyCountermeasuresProps {
    onDecoyDeployed: (decoyText: string) => void;
    isCallActive: boolean;
    personaGoal?: string;
    lastAIMessage?: string;
}

export default function DecoyCountermeasures({
    onDecoyDeployed,
    isCallActive,
    personaGoal,
    lastAIMessage
}: DecoyCountermeasuresProps) {
    const [currentDecoy, setCurrentDecoy] = useState<DecoyData | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);

    // Compute suggested type based on persona goal and last AI message
    const suggestedType = useMemo(() => {
        if (personaGoal || lastAIMessage) {
            return suggestDecoyType(personaGoal || '', lastAIMessage);
        }
        return null;
    }, [personaGoal, lastAIMessage]);

    const handleDeployDecoy = () => {
        if (!isCallActive) return;

        // Use suggested type if available, otherwise random
        const decoy = generateDecoyData(suggestedType || undefined);
        setCurrentDecoy(decoy);
        setIsDeployed(true);

        // Send formatted decoy data to parent
        onDecoyDeployed(decoy.displayText);

        // Reset deployed state after 2 seconds
        setTimeout(() => setIsDeployed(false), 2000);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-mono text-green-500 tracking-wider">
                    DECOY_COUNTERMEASURES
                </h3>
            </div>

            {/* AI Suggestion Indicator */}
            {suggestedType && isCallActive && (
                <div className="mb-2 p-2 border border-amber-600/50 bg-amber-950/20">
                    <div className="flex items-center gap-2 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400/80 font-mono font-bold">
                            {suggestedType.toUpperCase().replace('_', ' ')}
                        </span>
                    </div>
                </div>
            )}

            {/* Deploy Button */}
            <button
                onClick={handleDeployDecoy}
                disabled={!isCallActive}
                className={`w-full py-3 px-4 font-mono text-sm border-2 transition-all mb-2 font-bold ${isDeployed
                    ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                    : isCallActive
                        ? 'border-green-500 text-green-500 hover:bg-green-500/10 cursor-pointer'
                        : 'border-gray-700 text-gray-600 cursor-not-allowed'
                    }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <Zap className={`w-4 h-4 ${isDeployed ? 'animate-pulse' : ''}`} />
                    <span>{isDeployed ? 'DEPLOYING...' : 'DEPLOY'}</span>
                </div>
            </button>

            {/* Data Readout - Compact */}
            {currentDecoy && (
                <div className="bg-black border border-green-900 p-2 font-mono text-xs">
                    <div className="text-amber-400 truncate">
                        {currentDecoy.displayText}
                    </div>
                </div>
            )}
        </div>
    );
}
