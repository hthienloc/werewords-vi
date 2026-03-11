"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DndContext, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, DragOverlay } from "@dnd-kit/core";
import { getGroupSession, saveGroupSession, clearGroupSession, getHistory, saveHistory } from "@/lib/storage";
import { speak, setTTSEnabled } from "@/lib/tts";
import {
  playWarningBeep,
  playEndBeep,
  playSleepChime,
  playWakeChime,
  initAudio,
} from "@/lib/audio";
import DifficultyBadge from "@/components/DifficultyBadge";
import { GroupGameSession } from "@/types";
import { ROLE_DETAILS, TokenType, TOKEN_DETAILS, TOKEN_LIMITS } from "@/lib/groupGame";
import FourWayReveal from "../../play/components/FourWayReveal";
import TimerPhase from "../../play/components/TimerPhase";
import EndgamePhase from "../../play/components/EndgamePhase";

type PlayStep = "start-night" | "night" | "mayor-pick" | "mayor-sleep" | "seer-reveal" | "seer-sleep" | "werewolf-reveal" | "werewolf-sleep" | "dawn" | "timer" | "find-seer" | "find-werewolf" | "result";


function DraggableToken({ type, remaining }: { type: TokenType, remaining?: number }) {
  const isDisabled = remaining === 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `token-${type}`,
    data: { type },
    disabled: isDisabled
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative flex flex-col items-center justify-center p-1 rounded-xl flex-1 h-14 sm:h-16 cursor-grab active:cursor-grabbing hover:scale-105 ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : isDragging ? 'opacity-0' : 'transition-transform bg-gray-900 border-2 border-gray-700 shadow-xl'} touch-none`}
    >
      {remaining !== undefined && (
        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border border-white/10 ${remaining === 0 ? 'bg-red-600' : 'bg-indigo-600'}`}>
          {remaining}
        </span>
      )}
      <span className="text-xl sm:text-2xl drop-shadow-md pointer-events-none">{TOKEN_DETAILS[type].emoji}</span>
      <span className="text-[9px] font-bold mt-0.5 text-gray-400 pointer-events-none uppercase tracking-tighter text-center leading-tight">
        {TOKEN_DETAILS[type].label}
      </span>
    </div>
  );
}

function TokenOverlay({ type }: { type: TokenType }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl h-16 w-16 bg-indigo-600 border-2 border-white shadow-2xl scale-110 rotate-3">
       <span className="text-3xl">{TOKEN_DETAILS[type].emoji}</span>
       <span className="text-[8px] font-bold mt-0.5 text-white uppercase tracking-tighter">{TOKEN_DETAILS[type].label}</span>
    </div>
  );
}

function DroppablePlayer({ player, tokens, isMayor }: { player: import("@/types").Player, tokens: TokenType[], isMayor: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `player-${player.id}`,
    disabled: isMayor
  });

  if (isMayor) return null; // Mayor doesn't get tokens

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col items-center justify-start p-2 sm:p-3 rounded-2xl transition-all duration-300 border-2 ${isOver ? 'bg-indigo-900/40 border-indigo-500 scale-105 shadow-xl shadow-indigo-500/20' : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60'}`}
    >
      <span className="font-bold text-sm sm:text-base text-gray-200 mb-2 truncate w-full text-center">{player.name}</span>
      <div className="flex flex-wrap gap-1 justify-center min-h-[48px] w-full bg-black/40 rounded-xl p-2 inset-shadow-sm">
        {tokens.length === 0 ? (
          <span className="text-[10px] text-gray-500 font-medium my-auto italic">Thả token vào đây</span>
        ) : (
          tokens.map((t, idx) => (
             <span key={idx} className="text-xl sm:text-2xl drop-shadow-md bg-gray-900/80 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-white/10 shadow-inner">{TOKEN_DETAILS[t].emoji}</span>
          ))
        )}
      </div>
    </div>
  );
}

export default function GroupPlayPage() {
  const router = useRouter();
  const [session, setSession] = useState<GroupGameSession | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const [activeToken, setActiveToken] = useState<TokenType | null>(null);

  const handleDragStart = (event: any) => {
    setActiveToken(event.active.data.current?.type);
  };

  const [step, setStep] = useState<PlayStep>("start-night");
  const [timeLeft, setTimeLeft] = useState(0);
  const [endgameTimeLeft, setEndgameTimeLeft] = useState(0);
  const [endgameNarrating, setEndgameNarrating] = useState(false);
  const [revealProgress, setRevealProgress] = useState(100);
  const [playerTokens, setPlayerTokens] = useState<Record<string, TokenType[]>>({});
  const [tokenCounts, setTokenCounts] = useState<Partial<Record<TokenType, number>>>({});

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveToken(null);
    const { active, over } = event;
    if (!over) return;

    const tokenType = active.data.current?.type as TokenType;
    const playerId = over.id.toString().replace('player-', '');

    if (tokenType && playerId) {
      setPlayerTokens(prev => ({
        ...prev,
        [playerId]: [...(prev[playerId] || []), tokenType]
      }));

      // Decrement token count if not infinite
      if (tokenCounts[tokenType] !== undefined) {
        setTokenCounts(prev => ({
          ...prev,
          [tokenType]: Math.max(0, (prev[tokenType] || 0) - 1)
        }));
      }

      // If correct token is given, trigger win
      if (tokenType === 'correct') {
        handleWordGuessed();
      }
    }
  };

  const lastSpokenRef = useRef<number>(-1);
  const [flash, setFlash] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [result, setResult] = useState<"villagers" | "werewolf" | null>(null);
  const [endgameType, setEndgameType] = useState<"find-seer" | "find-werewolf" | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endgameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    const s = getGroupSession();
    if (!s) {
      router.replace("/game/setup");
      return;
    }
    setSession(s);
    setTimeLeft(s.timerDuration);
    
    // Initialize token counts based on limit mode
    if (s.tokenLimitMode && s.tokenLimitMode !== 'infinite') {
      setTokenCounts(TOKEN_LIMITS[s.tokenLimitMode]);
    } else {
      setTokenCounts({});
    }
  }, [router]);

  // Save history only once
  const historySavedRef = useRef(false);
  useEffect(() => {
    if (result && session && !historySavedRef.current) {
      historySavedRef.current = true;
      const history = getHistory();
      const newEntry = {
        id: `gh-${Date.now()}`,
        date: new Date().toISOString(),
        secretWord: session.secretWord,
        wordPackName: session.wordPackName || 'Custom/Unknown',
        difficulty: (session.wordDifficulty as 'easy' | 'medium' | 'hard') || 'easy',
        result: result,
        duration: durationRef.current,
        timerDuration: session.timerDuration,
      };
      saveHistory([newEntry, ...history]);
    }
  }, [result, session]);

  // Phase logic (Night Sequence)
  useEffect(() => {
    if (!session) return;

    if (step === "night") {
      playSleepChime();
      speak("Đêm xuống. Tất cả nhắm mắt lại.", () => {
        setTimeout(() => {
          setStep("mayor-pick");
        }, 2000);
      });
    }

    if (step === "mayor-pick") {
       speak("Thị trưởng mở mắt. Hãy xem vai trò bí mật của mình và chọn từ bí mật.");
       // Note: Selection logic is manual via button click (handleWordSelected)
    }

    if (step === "mayor-sleep") {
      speak("Thị trưởng nhắm mắt.", () => {
        setTimeout(() => {
          setStep("seer-reveal");
        }, 2000);
      });
    }

    if (step === "seer-reveal") {
      setRevealProgress(100);
      speak("Tiên tri mở mắt.", () => {
        const start = Date.now();
        const duration = 6000;
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - start;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setRevealProgress(remaining);
          
          if (elapsed >= duration) {
            clearInterval(interval);
            setStep("seer-sleep");
          }
        }, 50);
      });
    }

    if (step === "seer-sleep") {
      speak("Tiên tri nhắm mắt.", () => {
        setTimeout(() => {
          setStep("werewolf-reveal");
        }, 2000);
      });
    }

    if (step === "werewolf-reveal") {
      setRevealProgress(100);
       speak("Ma sói mở mắt.", () => {
        const start = Date.now();
        const duration = 8000;
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - start;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setRevealProgress(remaining);
          
          if (elapsed >= duration) {
            clearInterval(interval);
            setStep("werewolf-sleep");
          }
        }, 50);
      });
    }

    if (step === "werewolf-sleep") {
      speak("Ma sói nhắm mắt.", () => {
        setTimeout(() => {
          setStep("dawn");
        }, 2000);
      });
    }

    if (step === "dawn") {
      playWakeChime();
      speak("Trời sáng, mọi người mở mắt. Bắt đầu đếm ngược đặt câu hỏi!", () => {
        setStep("timer");
      });
    }

  }, [step, session]);

  function handleWordSelected(word: import("@/types").Word) {
    if (!session) return;
    const updated = { ...session, secretWord: word.text };
    setSession(updated);
    saveGroupSession(updated);
    setStep("mayor-sleep");
  }

  // Timer logic
  useEffect(() => {
    if (step !== "timer" || !session) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);
        durationRef.current += 1;

        if (next === 60 && prev > 60) speak("Còn 1 phút.");
        if (next === 30 && prev > 30) {
          playWarningBeep();
          setFlash(true);
          setTimeout(() => setFlash(false), 600);
        }

        if (next === 0 && prev > 0) {
          playEndBeep();
          setEndgameNarrating(true);
          speak("Hết giờ! Dân làng hãy thảo luận để tìm ra Ma sói.", () => setEndgameNarrating(false));
          setEndgameTimeLeft(60); // Default find werewolf duration
          setEndgameType("find-werewolf");
          setStep("find-werewolf");
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [step, session]);

  // Endgame Timer Logic
  useEffect(() => {
    if ((step !== "find-seer" && step !== "find-werewolf") || endgameNarrating) {
      lastSpokenRef.current = -1;
      return;
    }

    endgameIntervalRef.current = setInterval(() => {
      setEndgameTimeLeft((prev) => {
        const next = Math.max(0, prev - 1);

        if (next <= 5 && next > 0 && next !== lastSpokenRef.current) {
          lastSpokenRef.current = next;
          playWarningBeep();
          speak(next.toString());
        }

        if (next === 0 && lastSpokenRef.current !== 0) {
          lastSpokenRef.current = 0;
          playEndBeep();
          speak("Hết giờ!");
          setTimeout(() => setStep("result"), 1000);
        }
        return next;
      });
    }, 1000);

    return () => { if (endgameIntervalRef.current) clearInterval(endgameIntervalRef.current); };
  }, [step, endgameNarrating]);

  function handleWordGuessed() {
    if (step !== "timer") return;
    setEndgameNarrating(true);
    speak("Đoán trúng từ! Ma sói hãy tìm ra Tiên tri.", () => setEndgameNarrating(false));
    setEndgameTimeLeft(20); // Default find seer duration
    setEndgameType("find-seer");
    setStep("find-seer");
  }

  function goHome() {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    clearGroupSession();
    router.push("/");
  }

  if (!session) return null;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 bg-gray-950 text-white overflow-hidden`}>
      {/* Header Info */}
      {step !== "timer" && (
        <div className="p-4 flex justify-between items-center bg-black/20 shrink-0">
          <button 
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl" role="img" aria-label="logo">🐺💬</span>
            <span className="font-extrabold text-white tracking-tight">Werewords VI</span>
          </button>
          <button 
            onClick={() => { setTtsOn(!ttsOn); setTTSEnabled(!ttsOn); }}
            className="p-2 rounded-lg bg-gray-800"
          >
            {ttsOn ? "🔊" : "🔇"}
          </button>
        </div>
      )}

      {/* ── STEP 0: Audio Unlock (Start Night) ── */}
      {step === "start-night" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10">
          <div className="relative">
            <div className="text-8xl animate-bounce">🌙</div>
            <div className="absolute -top-2 -right-2 text-4xl animate-pulse">✨</div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              Sẵn sàng chưa?
            </h2>
            <p className="text-gray-400 text-lg max-w-xs mx-auto">
              Nhấn nút bên dưới để bắt đầu giai đoạn đêm xuống.
            </p>
          </div>
          <button
            onClick={() => {
              // Priming: speak an empty string immediately to capture user gesture
              import("@/lib/tts").then((m) => m.speak(""));
              import("@/lib/audio").then((m) => m.initAudio());
              setStep("night");
            }}
            className="w-full max-w-xs bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white font-black text-2xl py-6 rounded-3xl transition-all shadow-xl shadow-indigo-900/40 border-b-8 border-indigo-900"
          >
            BẮT ĐẦU ĐÊM 🐺
          </button>
        </div>
      )}

      {step === "night" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-8 animate-pulse">
          <span className="text-9xl mb-4">🌙</span>
          <div className="space-y-4">
            <h2 className="text-4xl font-black">Ban đêm</h2>
            <p className="text-gray-400 text-lg">Tất cả hãy nhắm mắt và giữ im lặng...</p>
          </div>
        </div>
      )}

      {step === "mayor-pick" && (
        <div className="flex-1 flex flex-col p-6 items-center justify-center gap-10 animate-in fade-in zoom-in duration-500">
           <div className="text-center space-y-4">
              <span className="text-6xl">🎭</span>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Thị trưởng chọn từ</h2>
              <p className="text-gray-400">Chỉ Thị trưởng được nhìn màn hình lúc này.</p>
           </div>
           
           <div className="grid gap-4 w-full max-w-xs">
              {session.candidateWords?.map((word: import("@/types").Word, i: number) => (
                <button
                  key={i}
                  onClick={() => handleWordSelected(word)}
                  className="relative bg-indigo-700 hover:bg-indigo-600 active:scale-95 py-6 px-4 rounded-3xl font-black text-xl shadow-xl shadow-indigo-950/40 transition-all border-b-4 border-indigo-900 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">{word.text}</span>
                  <DifficultyBadge difficulty={word.difficulty || 'easy'} />
                </button>
              ))}
           </div>

           <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">{ROLE_DETAILS[session.players.find((p: import("@/types").Player) => p.role === 'mayor')?.subRole || 'villager'].emoji}</span>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-indigo-400">Vai trò bí mật của bạn</p>
                <p className="font-bold">{ROLE_DETAILS[session.players.find((p: import("@/types").Player) => p.role === 'mayor')?.subRole || 'villager'].name}</p>
              </div>
           </div>
        </div>
      )}

      {(step === "mayor-sleep" || step === "seer-sleep" || step === "werewolf-sleep") && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-8 animate-pulse duration-1000">
          <span className="text-8xl mb-4">😴</span>
          <div className="space-y-4">
            <h2 className="text-3xl font-black">{step === "mayor-sleep" ? "Thị trưởng ngủ" : step === "seer-sleep" ? "Tiên tri ngủ" : "Ma sói ngủ"}</h2>
            <p className="text-gray-400 text-lg">Đang nhắm mắt...</p>
          </div>
        </div>
      )}

      {step === "seer-reveal" && (
        <FourWayReveal 
          roleName="Tiên tri"
          text={session.secretWord}
          progress={revealProgress}
        />
      )}

      {step === "werewolf-reveal" && (
        <>
          <div className="absolute inset-0 bg-red-950/20 pointer-events-none z-0"></div>
          <FourWayReveal 
            roleName="Ma sói"
            text={session.secretWord}
            progress={revealProgress}
          />
        </>
      )}

      {step === "timer" && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
           <div className="flex-1 flex flex-col pt-2 pb-6 px-4 gap-4 animate-in fade-in zoom-in duration-500 max-h-screen overflow-hidden">
             
             {/* Timer Section - Compact header at the top */}
             <div className="shrink-0 w-full px-2">
                <TimerPhase 
                  timeLeft={timeLeft}
                  isWarning={timeLeft <= 30}
                  onWordGuessed={handleWordGuessed}
                />
             </div>

             {/* Player Grid (Droppable Zones) */}
             <div className="flex-1 overflow-y-auto no-scrollbar pb-40">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                   {session.players.map((p: import("@/types").Player) => (
                      <DroppablePlayer 
                        key={p.id} 
                        player={p} 
                        tokens={playerTokens[p.id] || []} 
                        isMayor={p.role === 'mayor'} 
                      />
                   ))}
                </div>
             </div>

             {/* Token Tray (Draggable items) */}
             <div className="fixed bottom-0 left-0 right-0 pt-3 pb-5 px-4 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800 flex justify-center items-center z-50">
                {/* 4 options shared width */}
                <div className="flex justify-between w-full max-w-md gap-2">
                  {(['wrong', 'right', 'close', 'way-off'] as TokenType[]).map(type => (
                     <DraggableToken 
                       key={type} 
                       type={type} 
                       remaining={tokenCounts[type]} 
                     />
                  ))}
                </div>
             </div>

             <DragOverlay dropAnimation={null}>
                {activeToken ? <TokenOverlay type={activeToken} /> : null}
             </DragOverlay>
           </div>
        </DndContext>
      )}

      {(step === "find-seer" || step === "find-werewolf") && (
        <EndgamePhase 
          type={step === "find-seer" ? "find-seer" : "find-werewolf"}
          timeLeft={endgameTimeLeft}
          players={session?.players || []}
          playerTokens={playerTokens}
        />
      )}

      {step === "result" && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-5xl font-black uppercase tracking-tighter">Kết quả</h2>
            <p className="text-indigo-400 font-bold">Từ bí mật: {session.secretWord}</p>
          </div>

          {!result ? (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-center text-gray-400 text-sm">Ai là người chiến thắng?</p>
                <div className="grid gap-3">
                  <button 
                    onClick={() => setResult("villagers")}
                    className="bg-green-700 hover:bg-green-600 active:scale-95 py-5 rounded-2xl font-black text-xl shadow-lg shadow-green-950/20 transition-all"
                  >
                    🎉 Dân làng thắng
                  </button>
                  <button 
                    onClick={() => setResult("werewolf")}
                    className="bg-red-700 hover:bg-red-600 active:scale-95 py-5 rounded-2xl font-black text-xl shadow-lg shadow-red-950/20 transition-all"
                  >
                    🐺 Ma sói thắng
                  </button>
                </div>
             </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="text-center py-4 bg-indigo-900/30 rounded-2xl border border-indigo-500/30">
                  <p className="text-indigo-200 font-black text-2xl uppercase">
                    {result === 'villagers' ? 'Dân làng thắng!' : 'Ma sói thắng!'}
                  </p>
               </div>

               <div className="space-y-3">
                 <p className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">Danh sách nhân vật</p>
                 <div className="grid gap-2">
                   {session.players.map((p: import("@/types").Player) => {
                     const isMayor = p.role === 'mayor';
                     const displayRole = isMayor ? p.subRole || 'villager' : p.role;
                     const details = ROLE_DETAILS[displayRole];
                     return (
                       <div key={p.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
                         <div className="flex items-center gap-3">
                            <span className="text-2xl">{details.emoji}</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{p.name} {isMayor && <span className="text-amber-500 text-xs ml-1">(Thị trưởng)</span>}</span>
                              <span className="text-[10px] text-gray-500 uppercase font-black">{details.name}</span>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-0.5 max-w-[100px] justify-end">
                           {playerTokens[p.id]?.map((t, idx) => (
                             <span key={idx} className="text-base" title={TOKEN_DETAILS[t].label}>
                               {TOKEN_DETAILS[t].emoji}
                             </span>
                           ))}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

               <button 
                 onClick={goHome}
                 className="w-full bg-gray-800 hover:bg-gray-700 active:scale-95 py-5 rounded-2xl font-bold text-lg border border-gray-700 mt-4 shadow-xl transition-all"
               >
                 Quay lại Trang chủ
               </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
