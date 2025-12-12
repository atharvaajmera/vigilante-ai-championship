import { useEffect, useState } from 'react';

interface TerminalLogProps {
    logs: string[];
    maxLines?: number;
}

export default function TerminalLog({ logs, maxLines = 10 }: TerminalLogProps) {
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);

    useEffect(() => {
        if (logs.length > visibleLogs.length) {
            const timer = setTimeout(() => {
                setVisibleLogs(logs.slice(-maxLines));
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setVisibleLogs(logs.slice(-maxLines));
        }
    }, [logs, maxLines, visibleLogs.length]);

    return (
        <div className="bg-black border border-green-800 p-4 h-64 overflow-y-auto font-mono text-xs">
            <div className="space-y-1">
                {visibleLogs.map((log, index) => (
                    <div
                        key={`${index}-${log}`}
                        className="text-green-500"
                    >
                        <span className="text-green-900">&gt;</span> {log}
                    </div>
                ))}
                <div className="flex items-center">
                    <span className="text-green-900">&gt;</span>
                    <span className="ml-1 w-2 h-3 bg-green-500 cursor-blink"></span>
                </div>
            </div>
        </div>
    );
}
