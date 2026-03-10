"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import { initAudio } from "@/lib/audio";
import { saveGroupSession, getSavedPlayers, addSavedPlayer, deleteSavedPlayer, getGroupPresets, saveGroupPresets } from "@/lib/storage";
import { assignRoles } from "@/lib/groupGame";
import { SavedPlayer, GroupPreset } from "@/types";

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
  id, index, name, onChange, onClear, onDelete, canDelete
}: { 
  id: string, index: number, name: string, onChange: (val: string) => void, onClear: () => void, onDelete: () => void, canDelete: boolean
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

      {canDelete && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="pr-4 text-red-900/40 hover:text-red-500 transition-colors"
          title="Xoá người chơi này"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
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
  const [presets, setPresets] = useState<GroupPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

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
    setPresets(getGroupPresets());
    const initialPlayers = [
      { id: '1', name: '' },
      { id: '2', name: '' },
      { id: '3', name: '' },
      { id: '4', name: '' },
    ];
    setPlayers(initialPlayers);
    setPlayerCount(4);
  }, []);

  // Only sync if playerCount changes via picker, but now we use add/remove buttons too
  useEffect(() => {
    if (players.length === 0) return;
    if (players.length === playerCount) return;
    
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

  function handleRemovePlayer(id: string) {
    if (players.length <= 4) return;
    const next = players.filter(p => p.id !== id);
    setPlayers(next);
    setPlayerCount(next.length);
  }

  function handleAddPlayer() {
    if (players.length >= 8) return;
    const nextCount = players.length + 1;
    setPlayerCount(nextCount);
  }

  function handleSavePreset() {
    if (!presetName.trim()) {
      setError("Vui lòng nhập tên hội.");
      return;
    }
    const newPreset: GroupPreset = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: presetName.trim(),
      playerNames: players.filter(p => p.name.trim()).map(p => p.name.trim())
    };
    if (newPreset.playerNames.length < 4) {
      setError("Một nhóm cần ít nhất 4 người có tên.");
      return;
    }
    setPresets(prev => {
      const next = [...prev, newPreset];
      saveGroupPresets(next);
      return next;
    });
    setPresetName("");
    setShowSavePreset(false);
    setError("");
  }

  function handleLoadPreset(preset: GroupPreset) {
    const nextPlayers = preset.playerNames.map(name => ({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name
    }));
    setPlayers(nextPlayers);
    setPlayerCount(nextPlayers.length);
  }

  function handleDeletePreset(id: string) {
    const next = presets.filter(p => p.id !== id);
    setPresets(next);
    saveGroupPresets(next);
  }

  function handleDeleteSavedPlayer(id: string) {
    deleteSavedPlayer(id);
    setSavedPlayers(getSavedPlayers());
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
              <div className="flex justify-between items-end">
                <label className="block text-sm font-semibold text-gray-400">Số lượng người chơi</label>
                <span className="text-indigo-400 font-black text-2xl">{playerCount}</span>
              </div>
              <div className="flex items-center gap-2">
                {[4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                      playerCount === n 
                        ? "bg-indigo-900/40 border-indigo-500 text-indigo-400" 
                        : "bg-gray-900 border-gray-800 text-gray-600 hover:bg-gray-800"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {presets.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-400">Hội chơi đã lưu</label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map(p => (
                    <div 
                      key={p.id}
                      className="group relative flex items-center bg-indigo-900/20 border border-indigo-900/40 rounded-xl p-3 hover:bg-indigo-900/30 transition-all cursor-pointer"
                      onClick={() => handleLoadPreset(p)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-indigo-300 truncate">{p.name}</div>
                        <div className="text-[10px] text-indigo-500 font-medium">{p.playerNames.length} người</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-400">Tên người chơi</label>
              
              {savedPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] uppercase font-bold text-gray-600 w-full mb-1">Gợi ý gần đây:</span>
                  {savedPlayers.slice(0, 8).map(p => {
                    const isAlreadySelected = players.some(n => n.name.trim().toLowerCase() === p.name.toLowerCase());
                    return (
                      <div key={p.id} className="relative group/tag">
                        <button
                          onClick={() => handleSelectSavedPlayer(p.name)}
                          disabled={isAlreadySelected}
                          className={`pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isAlreadySelected 
                              ? "bg-gray-900 text-gray-700 opacity-50 cursor-not-allowed border border-transparent" 
                              : "bg-indigo-900/30 text-indigo-300 border border-indigo-900/50 hover:bg-indigo-900/50 active:scale-95 text-left"
                          }`}
                        >
                          + {p.name}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSavedPlayer(p.id); }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-700 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
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
                        canDelete={players.length > 4}
                        onDelete={() => handleRemovePlayer(item.id)}
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

              <div className="flex gap-2">
                <button
                  onClick={handleAddPlayer}
                  disabled={players.length >= 8}
                  className={`flex-1 py-4 rounded-xl border-2 border-dashed font-bold text-xs transition-all ${
                    players.length < 8 
                      ? "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300" 
                      : "border-transparent text-transparent pointer-events-none"
                  }`}
                >
                  + Thêm người chơi ({players.length}/8)
                </button>
                
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="px-4 py-4 rounded-xl bg-indigo-900/20 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/30 transition-all font-bold text-xs"
                >
                  💾 Lưu hội này
                </button>
              </div>

              {showSavePreset && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Tên hội chơi mới</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="VD: Gia đình, Team công ty..." 
                      value={presetName}
                      onChange={e => setPresetName(e.target.value)}
                      className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 uppercase font-bold"
                    />
                    <button 
                      onClick={handleSavePreset}
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-xl font-bold text-sm transition-all"
                    >
                      Lưu
                    </button>
                    <button 
                      onClick={() => setShowSavePreset(false)}
                      className="text-gray-500 hover:text-white px-2"
                    >
                      Bỏ
                    </button>
                  </div>
                </div>
              )}
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
