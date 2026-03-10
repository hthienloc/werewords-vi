"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getGroupSession, saveGroupSession } from "@/lib/storage";
import { ROLE_DETAILS } from "@/lib/groupGame";
import { useBackLock } from "@/lib/useBackLock";
import { GroupGameSession } from "@/types";

export default function RoleRevealPage() {
  const router = useRouter();
  const [session, setSession] = useState<GroupGameSession | null>(null);
  const [subPhase, setSubPhase] = useState<"wait" | "reveal">("wait");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useBackLock(!!session);

  useEffect(() => {
    const s = getGroupSession();
    if (!s) {
      router.replace("/game/setup");
      return;
    }
    setSession(s);
  }, [router]);

  // Wake Lock for reveal phase
  useEffect(() => {
    if (subPhase === "reveal") {
      if ("wakeLock" in navigator) {
        navigator.wakeLock.request("screen").then(lock => {
          wakeLockRef.current = lock;
        }).catch(() => {});
      }
    } else {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, [subPhase]);

  if (!session) return null;

  const currentPlayer = session.players[session.currentPlayerIndex];
  const roleInfo = ROLE_DETAILS[currentPlayer.role];

  function handleViewed() {
    setSubPhase("reveal");
  }

  function handleNext() {
    if (!session) return;
    const nextIndex = session.currentPlayerIndex + 1;
    if (nextIndex >= session.players.length) {
      // All done, go to play
      const updatedSession = { ...session, phase: "night" as const };
      saveGroupSession(updatedSession);
      router.push("/game/play");
    } else {
      const updatedSession: GroupGameSession = { ...session, currentPlayerIndex: nextIndex };
      saveGroupSession(updatedSession);
      setSession(updatedSession);
      setSubPhase("wait");
    }
  }

  const progressStyle = { width: `${((session.currentPlayerIndex) / session.players.length) * 100}%` };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 bg-gray-950`}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={progressStyle} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-10">
        
        {subPhase === "wait" && (
          <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500 w-full">
            <div className="text-6xl">📱</div>
            <div className="space-y-4">
              <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Chuyền máy cho</p>
              <h1 className="text-4xl font-black text-white">{currentPlayer.name}</h1>
            </div>
            <button
              onClick={handleViewed}
              className="w-full max-w-xs mx-auto bg-indigo-700 hover:bg-indigo-600 active:scale-95 py-6 rounded-3xl font-black text-xl shadow-xl shadow-indigo-950/40 transition-all"
            >
              Tôi đã cầm máy
            </button>
          </div>
        )}

        {subPhase === "reveal" && (
          <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
            <div className="space-y-2">
              <p className="text-white/60 font-medium text-sm">Vai trò của {currentPlayer.name} là</p>
              <div className="flex flex-col items-center">
                <span className="text-8xl mb-4 drop-shadow-2xl">{roleInfo.emoji}</span>
                <h2 className={`text-5xl font-black text-white uppercase tracking-tighter drop-shadow-md ${subPhase === 'reveal' ? 'animate-in fade-in zoom-in' : ''}`}>
                  {roleInfo.name}
                </h2>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em]">Nhiệm vụ</p>
                <p className="text-white text-sm leading-relaxed">{roleInfo.description}</p>
              </div>

              {/* Secret intel is only shown during the Night Phase to prevent revealing emotions */}
            </div>

            <button
              onClick={handleNext}
              className="w-full max-w-xs mx-auto bg-white text-black hover:bg-gray-100 active:scale-95 py-5 rounded-2xl font-bold text-lg transition-all flex flex-col items-center justify-center shadow-xl shadow-white/5"
            >
              <span>Đã xem xong</span>
              {session.currentPlayerIndex + 1 < session.players.length ? (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Chuyển cho người tiếp theo</span>
              ) : (
                <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Bắt đầu ván chơi</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
