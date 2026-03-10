"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { initAudio } from "@/lib/audio";
import { saveGroupSession, getSavedPlayers, addSavedPlayer } from "@/lib/storage";
import { assignRoles } from "@/lib/groupGame";
import { SavedPlayer } from "@/types";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Item Component
function SortablePlayerInput({ 
  id, index, name, onChange, onClear 
}: { 
  id: string, index: number, name: string, onChange: (val: string) => void, onClear: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-center bg-gray-900 border ${isDragging ? 'border-indigo-500 shadow-2xl scale-[1.02]' : 'border-gray-800 hover:border-gray-700'} rounded-xl transition-all relative`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="pl-4 cursor-grab active:cursor-grabbing text-gray-600 hover:text-white flex items-center justify-center py-4 touch-none"
      >
        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <div className="relative group flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xs pointer-events-none">#{index + 1}</span>
        <input
          type="text"
          placeholder={`Nhập tên người chơi ${index + 1}`}
          value={name}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-4 pl-8 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-r-xl transition-colors"
        />
        {name && (
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); onClear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}


const TIMER_OPTIONS = [
  { label: "3 phút", value: 180 },
  { label: "4 phút", value: 240 },
  { label: "5 phút", value: 300 },
  { label: "6 phút", value: 360 },
  { label: "7 phút", value: 420 },
];

export default function GroupSetupPage() {
  const { state } = useApp();
  const router = useRouter();

  // Step 1: Players, Step 2: Game Settings
  const [step, setStep] = useState<1 | 2>(1);
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<{id: string, name: string}[]>([]);
  
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(state.settings.selectedPackIds || []);
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">(state.settings.filterDifficulty);
  const [timer, setTimer] = useState(state.settings.timerDuration);
  const [customTimer, setCustomTimer] = useState("");
  const [useCustom, setUseCustom] = useState(
    !TIMER_OPTIONS.find((o) => o.value === state.settings.timerDuration)
  );
  const [tokenLimit, setTokenLimit] = useState<"infinite" | "many" | "few">("infinite");
  const [error, setError] = useState("");
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);

  // Configure sensors for dnd-kit to work on mobile + desktop
  const sensors = useSensors(
    useSensor(PointerSensor, { // Works for mouse and touch
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts - allows clicking inputs!
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSavedPlayers(getSavedPlayers());
    setPlayers([
      { id: '1', name: '' },
      { id: '2', name: '' },
      { id: '3', name: '' },
      { id: '4', name: '' },
    ]);
  }, []);

  // Sync player names array length with playerCount
  useEffect(() => {
    if (players.length === 0) return;
    setPlayers(prev => {
      const next = [...prev];
      if (next.length < playerCount) {
        for (let i = next.length; i < playerCount; i++) {
          next.push({ 
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, 
            name: "" 
          });
        }
      } else if (next.length > playerCount) {
        return next.slice(0, playerCount);
      }
      return next;
    });
  }, [playerCount]);

  const availableWords = state.wordPacks
    .filter((p) => selectedPackIds.includes(p.id))
    .flatMap((p) =>
      p.words.filter(
        (w) => !w.used && (difficulty === "all" || w.difficulty === difficulty)
      )
    );

  function handleNext() {
    setError("");
    const hasEmpty = players.some(p => !p.name.trim());
    if (hasEmpty) {
      setError("Vui lòng điền đầy đủ tên cho tất cả người chơi.");
      return;
    }
    setStep(2);
  }

  function handleStart() {
    try {
      if (selectedPackIds.length === 0) {
        setError("Vui lòng chọn ít nhất một bộ từ.");
        return;
      }
      if (availableWords.length === 0) {
        setError("Không có từ nào phù hợp với bộ lọc này.");
        return;
      }

      const timerVal = useCustom ? parseInt(customTimer) * 60 : timer;
      if (useCustom && (!customTimer || parseInt(customTimer) < 1)) {
        setError("Vui lòng nhập thời gian hợp lệ.");
        return;
      }

      // 1. Select random candidates
      const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
      const candidateWords = shuffledWords.slice(0, 2);
      const selectedWord = candidateWords[0];

      // 2. Assign roles
      const playerNamesList = players.map(p => p.name);
      const assignedPlayers = assignRoles(playerNamesList);

      // 3. Create session
      const packNames = selectedPackIds
        .map(id => state.wordPacks.find(p => p.id === id)?.name)
        .filter((n): n is string => !!n)
        .join(", ");

      // Save players to storage
      playerNamesList.forEach(name => {
        if (name.trim()) addSavedPlayer(name);
      });

      saveGroupSession({
        players: assignedPlayers,
        secretWord: selectedWord.text,
        candidateWords,
        wordDifficulty: selectedWord.difficulty,
        wordPackName: packNames,
        wordPackIds: selectedPackIds,
        currentPlayerIndex: 0,
        phase: 'role-reveal',
        timerDuration: timerVal,
        tokenLimitMode: tokenLimit,
      });
      initAudio();
      router.push("/game/roles");
    } catch (err: any) {
      console.error(err);
      setError("Đã xảy ra lỗi khi bắt đầu: " + err.message);
    }
  }

  function handleSelectSavedPlayer(name: string) {
    const emptyIndex = players.findIndex(p => !p.name.trim());
    if (emptyIndex !== -1) {
      const next = [...players];
      next[emptyIndex] = { ...next[emptyIndex], name };
      setPlayers(next);
      setError("");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlayers((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar 
        title={step === 1 ? "Người chơi" : "Cài đặt ván"} 
        onBack={step === 2 ? () => setStep(1) : undefined}
        backHref={step === 1 ? "/" : undefined}
      />

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6 flex flex-col gap-6">
        {step === 1 ? (
          <>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-400">Số lượng người chơi</label>
              <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl p-2">
                <button 
                  onClick={() => setPlayerCount(Math.max(4, playerCount - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl active:scale-95 transition-transform hover:bg-gray-700"
                >
                  <span className="text-2xl font-bold">−</span>
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-indigo-400">{playerCount}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Người</span>
                </div>
                <button 
                  onClick={() => setPlayerCount(Math.min(8, playerCount + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl active:scale-95 transition-transform hover:bg-gray-700"
                >
                  <span className="text-2xl font-bold">+</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-400">Tên người chơi</label>
              
              {savedPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] uppercase font-bold text-gray-600 w-full mb-1">Gợi ý gần đây:</span>
                  {savedPlayers.slice(0, 8).map(p => {
                    const isAlreadySelected = players.some(n => n.name.trim().toLowerCase() === p.name.toLowerCase());
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectSavedPlayer(p.name)}
                        disabled={isAlreadySelected}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isAlreadySelected 
                            ? "bg-gray-900 text-gray-700 opacity-50 cursor-not-allowed border border-transparent" 
                            : "bg-indigo-900/30 text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/50 active:scale-95"
                        }`}
                      >
                        + {p.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={players.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-2">
                    {players.map((item, i) => (
                      <SortablePlayerInput
                        key={item.id}
                        id={item.id}
                        index={i}
                        name={item.name}
                        onChange={(val) => {
                          const next = [...players];
                          next[i] = { ...next[i], name: val };
                          setPlayers(next);
                          if (error) setError("");
                        }}
                        onClear={() => {
                          const next = [...players];
                          next[i] = { ...next[i], name: "" };
                          setPlayers(next);
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {error && <div className="p-4 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl animate-in fade-in slide-in-from-top-1">{error}</div>}

            <button
              onClick={handleNext}
              className="mt-auto w-full bg-indigo-700 hover:bg-indigo-600 active:scale-95 py-5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-950/40 transition-all flex items-center justify-center"
            >
              Tiếp theo →
            </button>
          </>
        ) : (
          /* STEP 2: Settings */
          <>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-400">Chọn bộ từ</label>
              <div className="grid grid-cols-2 gap-2">
                {state.wordPacks.map((pack) => {
                  const isSelected = selectedPackIds.includes(pack.id);
                  return (
                    <button
                      key={pack.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPackIds(selectedPackIds.filter(id => id !== pack.id));
                        } else {
                          setSelectedPackIds([...selectedPackIds, pack.id]);
                        }
                        setError("");
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isSelected ? "bg-indigo-900/40 border-indigo-500" : "bg-gray-900 border-gray-800 opacity-60 hover:bg-gray-800"
                      }`}
                    >
                      <span className="text-2xl">{pack.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{pack.name}</div>
                        <div className="text-[10px] text-gray-500">{pack.words.length} từ</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-400">Độ khó từ</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">🎯 Tất cả</option>
                  <option value="easy">🟢 Dễ</option>
                  <option value="medium">🟡 Vừa</option>
                  <option value="hard">🔴 Khó</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-400">Thời gian</label>
                <select
                  value={useCustom ? "custom" : timer}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setUseCustom(true);
                    } else {
                      setUseCustom(false);
                      setTimer(Number(e.target.value));
                    }
                  }}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 px-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {TIMER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value="custom">⚙️ Tùy chỉnh</option>
                </select>
              </div>
            </div>

            {useCustom && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <input
                  type="number"
                  placeholder="Nhập số phút (1-60)"
                  value={customTimer}
                  onChange={(e) => setCustomTimer(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-400">Giới hạn Token (Đúng/Sai, Gần, Xa)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['infinite', 'many', 'few'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTokenLimit(mode)}
                    className={`py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${
                      tokenLimit === mode 
                        ? "bg-indigo-900/40 border-indigo-500 text-indigo-300" 
                        : "bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800"
                    }`}
                  >
                    {mode === 'infinite' ? '∞ Vô hạn' : mode === 'many' ? '📦 Nhiều' : '🤏 Ít'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 px-1 italic">
                {tokenLimit === 'infinite' && "Không giới hạn số lượng câu hỏi."}
                {tokenLimit === 'many' && "30 Đúng/Sai, 2 Gần, 2 Xa."}
                {tokenLimit === 'few' && "15 Đúng/Sai, 1 Gần, 1 Xa."}
              </p>
            </div>

            {error && <div className="p-4 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl animate-in fade-in slide-in-from-top-1">{error}</div>}

            <button
              onClick={handleStart}
              className="mt-auto w-full bg-indigo-700 hover:bg-indigo-600 active:scale-95 py-5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-950/40 transition-all flex items-center justify-center gap-2"
            >
              🎭 Bắt đầu phân vai
            </button>
          </>
        )}
      </div>
    </div>
  );
}
