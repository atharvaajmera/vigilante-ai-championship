import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SMSNotificationProps {
    damage: number;
    accountBalance: number;
}

export default function SMSNotification({ damage, accountBalance }: SMSNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (damage > 0) {
            setIsVisible(true);
            // Auto-hide after 5 seconds
            const timer = setTimeout(() => setIsVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [damage]);

    if (!isVisible || damage === 0) return null;

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-100 animate-slide-down">
            <div className="bg-black border-2 border-red-500 p-4 max-w-md breach-flash">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-red-400 font-mono mb-1">SECURITY ALERT // UNAUTHORIZED ACCESS</p>
                        <h3 className="text-lg font-bold font-mono text-red-500 text-glow-red mb-2">
                            BREACH DETECTED
                        </h3>
                        <p className="text-sm text-red-300 font-mono mb-2">
                            ${damage.toLocaleString()} WITHDRAWN FROM CHECKING ACCOUNT
                        </p>
                        <p className="text-xs text-gray-400 font-mono border-t border-red-900 pt-2">
                            NEW BALANCE: ${accountBalance.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
