import { MessageSquare } from 'lucide-react';

interface TurnCounterProps {
    turnsUsed: number;
    maxTurns: number;
}

export default function TurnCounter({ turnsUsed, maxTurns }: TurnCounterProps) {
    const remaining = maxTurns - turnsUsed;
    const isLowTurns = remaining <= 1;

    return (
        <div className={`bg-black border-2 p-3 ${isLowTurns ? 'border-red-500 animate-pulse' : 'border-green-500'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className={`w-5 h-5 ${isLowTurns ? 'text-red-500' : 'text-green-500'}`} />
                    <span className={`text-sm font-mono tracking-widest ${isLowTurns ? 'text-red-500' : 'text-green-400'}`}>
                        REMAINING EXCHANGES
                    </span>
                </div>
                <div className={`text-3xl font-bold font-mono ${isLowTurns ? 'text-red-500 text-glow-red' : 'text-green-500 text-glow'}`}>
                    {remaining}
                </div>
            </div>
            {isLowTurns && (
                <p className="text-xs text-red-400 font-mono mt-2 border-t border-red-900 pt-2">
                    WARNING: FINAL EXCHANGE // TERMINATE OR COMPROMISE IMMINENT
                </p>
            )}
        </div>
    );
}
