import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface AudioVisualizerProps {
    isActive: boolean;
}

export default function AudioVisualizer({ isActive }: AudioVisualizerProps) {
    const [heights, setHeights] = useState<number[]>(Array(10).fill(20));

    useEffect(() => {
        if (!isActive) {
            setHeights(Array(10).fill(20));
            return;
        }

        const interval = setInterval(() => {
            setHeights(Array(10).fill(0).map(() => Math.random() * 80 + 20));
        }, 100);

        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-center gap-2">
                <Activity className={`w-6 h-6 ${isActive ? 'text-green-500' : 'text-green-900'}`} />
                <span className="text-green-500 text-sm font-mono uppercase">
                    {isActive ? 'TRANSMISSION ACTIVE' : 'IDLE'}
                </span>
            </div>
            <div className="flex items-end justify-center gap-1 h-24">
                {heights.map((height, index) => (
                    <div
                        key={index}
                        className={`w-2 transition-all duration-100 ${isActive ? 'bg-green-500' : 'bg-green-900'
                            }`}
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
