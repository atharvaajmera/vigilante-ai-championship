import { Lock, Skull } from 'lucide-react';

interface TrustMatrixProps {
    threatLevel: number; // 0-100
}

export default function TrustMatrix({ threatLevel }: TrustMatrixProps) {
    const blocks = 10;
    const filledBlocks = Math.floor((threatLevel / 100) * blocks);

    return (
        <div className="bg-black border border-green-800 p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-green-500 text-base font-mono uppercase">TRUST_MATRIX</span>
                <span className="text-green-500 text-base font-mono font-bold">{threatLevel}/100</span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: blocks }).map((_, index) => {
                    const isFilled = index < filledBlocks;
                    const isHighThreat = index >= 5;

                    return (
                        <div
                            key={index}
                            className={`h-10 flex-1 border transition-all duration-300 ${isFilled
                                ? isHighThreat
                                    ? 'bg-red-600 border-red-600'
                                    : 'bg-green-500 border-green-500'
                                : 'border-green-900'
                                }`}
                        />
                    );
                })}
            </div>
            <div className="flex items-center justify-between mt-3 text-sm font-mono">
                <div className="flex items-center gap-1 text-green-500">
                    <Lock className="w-4 h-4" />
                    <span>SECURE</span>
                </div>
                <div className="flex items-center gap-1 text-red-600">
                    <Skull className="w-4 h-4" />
                    <span>HOSTILE</span>
                </div>
            </div>
        </div>
    );
}
