import { Phone, PhoneOff, Mic, MicOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { CallStatus, CallType } from '../types/game';
import AudioVisualizer from './AudioVisualizer';

interface PhoneUIProps {
    callStatus: CallStatus;
    callType: CallType | null;
    isListening: boolean;
    isMuted: boolean;
    onInitiateCall: () => void;
    onAnswer: () => void;
    onHangup: () => void;
    onToggleMute: () => void;
}

export default function PhoneUI({
    callStatus,
    callType,
    isListening,
    isMuted,
    onInitiateCall,
    onAnswer,
    onHangup,
    onToggleMute
}: PhoneUIProps) {

    if (callStatus === 'idle') {
        return (
            <div className="crt-scanline flex flex-col items-center justify-center min-h-screen bg-black text-green-500">
                <div className="text-center space-y-8 p-6 max-w-4xl">
                    <h1 className="text-6xl font-bold font-mono tracking-wider text-glow">
                        VIGILANTE: PSY-OPS
                    </h1>
                    <p className="text-2xl text-green-500 font-mono tracking-widest">
                        DEFENSE PROTOCOL
                    </p>
                    <p className="text-sm text-green-400 font-mono mb-4">
                        // ADVANCED SOCIAL ENGINEERING COUNTER-MEASURE TRAINER
                    </p>
                    <p className="text-base text-green-400 max-w-2xl mx-auto font-mono leading-relaxed border-2 border-green-500 p-4 bg-black">
                        LIVE-FIRE CYBERSECURITY SIMULATION. RANDOMIZED VOICE-BASED VISHING ATTACKS. 5 EXCHANGES PER SESSION. IDENTIFY THREAT VECTORS. NEUTRALIZE MANIPULATORS. TERMINATE CONNECTIONS BEFORE ASSET COMPROMISE.
                    </p>
                    <button
                        onClick={onInitiateCall}
                        className="mt-8 px-12 py-5 bg-green-500 hover:bg-green-600 text-black border-2 border-green-500 text-2xl font-bold font-mono transition-all transform hover:scale-105 tracking-widest"
                    >
                        INITIATE PROTOCOL
                    </button>
                    <div className="mt-12 space-y-4 text-sm text-green-400 max-w-2xl mx-auto font-mono">
                        <div className="flex items-center gap-3 justify-center border border-red-500 p-2 bg-black">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <p>TERMINATE HOSTILE VECTORS: +500 CREDITS</p>
                        </div>
                        <div className="flex items-center gap-3 justify-center border border-green-500 p-2 bg-black">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <p>ASSIST LEGITIMATE TRANSMISSIONS: +300 CREDITS</p>
                        </div>
                        <div className="flex items-center gap-3 justify-center border border-yellow-500 p-2 bg-black">
                            <XCircle className="w-5 h-5 text-yellow-500" />
                            <p>FALSE POSITIVE TERMINATION: -400 CREDITS</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (callStatus === 'ringing') {
        return (
            <div className="crt-scanline flex flex-col items-center justify-center min-h-screen bg-black text-green-500">
                <div className="bg-black border-2 border-green-500 p-12 max-w-2xl w-full">
                    <div className="text-center space-y-6">
                        <div className="animate-pulse">
                            <Phone className="w-20 h-20 mx-auto text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold font-mono text-glow">INCOMING TRANSMISSION</h2>
                            <p className="text-base text-green-400 mt-2 font-mono">UNKNOWN ORIGIN</p>
                            <p className="text-sm text-green-300 mt-1 font-mono">+1 (800) 555-0123</p>
                        </div>

                        {/* Persona Generation Status */}
                        <div className="border-2 border-amber-400 p-4 bg-black space-y-3">
                            <p className="text-sm text-amber-400 font-mono animate-pulse">
                                [ ESTABLISHING SECURE CONNECTION... ]
                            </p>
                            <p className="text-xs text-green-400 font-mono">
                                // GENERATING NEURAL PERSONA...
                            </p>

                            {/* Loading Progress Bar */}
                            <div className="w-full bg-black border border-green-800 h-4 overflow-hidden">
                                <div className="h-full bg-green-500 animate-pulse" style={{
                                    animation: 'progress 2s ease-in-out infinite',
                                    width: '70%'
                                }}></div>
                            </div>

                            <p className="text-[10px] text-green-700 font-mono">
                                ANALYZING VOCAL PATTERNS // MAPPING INTENT VECTORS // CALIBRATING THREAT MATRIX
                            </p>
                        </div>

                        <p className="text-xs text-yellow-500 mt-4 font-mono border border-yellow-500 p-2 bg-black">
                            WARNING: VECTOR TYPE UNKNOWN // 50% HOSTILE PROBABILITY
                        </p>

                        <div className="flex gap-6 justify-center pt-6">
                            <button
                                onClick={onAnswer}
                                className="bg-green-500 hover:bg-green-600 text-black p-6 transition-all transform hover:scale-110 animate-pulse border-2 border-green-500"
                            >
                                <Phone className="w-8 h-8" />
                            </button>
                            <button
                                onClick={onHangup}
                                className="bg-red-500 hover:bg-red-600 text-black p-6 transition-all transform hover:scale-110 border-2 border-red-500"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (callStatus === 'active') {
        const callerInfo = callType === 'SCAM'
            ? { badge: "WARNING: UNKNOWN VECTOR", color: "text-red-500" }
            : { badge: "STATUS: VERIFYING AUTHENTICITY", color: "text-yellow-500" };

        return (
            <div className="crt-scanline flex flex-col items-center justify-center min-h-screen bg-black text-green-500 p-4">
                <div className="bg-black border-2 border-green-500 p-8 max-w-md w-full">
                    <div className="text-center space-y-6">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                            <span className="text-sm text-green-400 font-mono tracking-widest">TRANSMISSION ACTIVE</span>
                        </div>

                        <div>
                            <span className={`text-xs font-mono border p-1 ${callerInfo.color} ${callType === 'SCAM' ? 'border-red-500' : 'border-yellow-500'}`}>{callerInfo.badge}</span>
                            <h2 className="text-2xl font-bold mt-2 font-mono text-glow">VOICE CHANNEL OPEN</h2>
                            <p className="text-green-400 mt-1 font-mono text-sm">ANALYZE PATTERNS // DETECT THREATS</p>
                        </div>

                        {/* Audio Visualizer */}
                        <div className="py-6">
                            <AudioVisualizer isActive={true} />
                        </div>

                        {/* Mic Status */}
                        <div className="py-4">
                            {isListening ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-pulse">
                                        <Mic className="w-12 h-12 text-red-500" />
                                    </div>
                                    <p className="text-sm text-red-400 font-mono tracking-wider">LISTENING</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Mic className="w-12 h-12 text-gray-600" />
                                    <p className="text-sm text-gray-600 font-mono">MUTED</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 justify-center border-t-2 border-green-500 pt-6">
                            <button
                                onClick={onToggleMute}
                                className={`p-4 border-2 transition-all ${isMuted
                                    ? 'bg-red-500 border-red-500 text-black hover:bg-red-600'
                                    : 'bg-green-500 border-green-500 text-black hover:bg-green-600'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={onHangup}
                                className="bg-red-500 hover:bg-red-600 text-black p-4 border-2 border-red-500 transition-all transform hover:scale-110"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Result States
    return (
        <div className="crt-scanline flex flex-col items-center justify-center min-h-screen bg-black text-green-500 p-6">
            <div className="text-center space-y-8 max-w-2xl w-full mx-auto border-2 border-green-500 p-12 bg-black">
                {callStatus === 'call_success' && callType === 'SCAM' && (
                    <>
                        <CheckCircle className="w-24 h-24 mx-auto text-green-500 success-flash" />
                        <h2 className="text-6xl font-bold text-green-500 text-glow font-mono">THREAT NEUTRALIZED</h2>
                        <p className="text-xl text-green-400 font-mono">HOSTILE VECTOR TERMINATED // DEFENSES INTACT</p>
                        <p className="text-lg text-green-300 font-mono border border-green-500 p-2 mt-4">+500 CREDITS</p>
                    </>
                )}
                {callStatus === 'call_success' && callType === 'GENUINE' && (
                    <>
                        <CheckCircle className="w-24 h-24 mx-auto text-green-500 success-flash" />
                        <h2 className="text-6xl font-bold text-green-500 text-glow font-mono">VERIFICATION COMPLETE</h2>
                        <p className="text-xl text-green-400 font-mono">LEGITIMATE TRANSMISSION ASSISTED // PROTOCOL SUCCESS</p>
                        <p className="text-lg text-green-300 font-mono border border-green-500 p-2 mt-4">+300 CREDITS</p>
                    </>
                )}
                {callStatus === 'call_failure' && callType === 'SCAM' && (
                    <>
                        <XCircle className="w-24 h-24 mx-auto text-red-500 breach-flash" />
                        <h2 className="text-6xl font-bold text-red-500 text-glow-red font-mono">SYSTEM BREACH</h2>
                        <p className="text-xl text-red-400 font-mono">SOCIAL ENGINEERING SUCCESSFUL // DATA COMPROMISED</p>
                        <p className="text-lg text-red-300 font-mono border border-red-500 p-2 mt-4">-200 CREDITS</p>
                    </>
                )}
                {callStatus === 'call_failure' && callType === 'GENUINE' && (
                    <>
                        <AlertTriangle className="w-24 h-24 mx-auto text-yellow-500" />
                        <h2 className="text-6xl font-bold text-yellow-500 text-glow font-mono">FALSE POSITIVE</h2>
                        <p className="text-xl text-yellow-400 font-mono">LEGITIMATE VECTOR TERMINATED // CRITICAL ERROR</p>
                        <p className="text-lg text-yellow-300 font-mono border border-yellow-500 p-2 mt-4">-400 CREDITS</p>
                    </>
                )}
                {callStatus === 'hung_up' && (
                    <>
                        <PhoneOff className="w-24 h-24 mx-auto text-gray-500" />
                        <h2 className="text-5xl font-bold text-gray-400 font-mono">TRANSMISSION TERMINATED</h2>
                    </>
                )}
                <button
                    onClick={onInitiateCall}
                    className="mt-8 px-12 py-5 bg-green-500 hover:bg-green-600 text-black border-2 border-green-500 text-2xl font-bold font-mono transition-all transform hover:scale-105 tracking-widest"
                >
                    NEXT TRANSMISSION
                </button>
            </div>
        </div>
    );
}
