let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!_audioCtx || _audioCtx.state === "closed") {
		_audioCtx = new AudioContext();
	}
	return _audioCtx;
}

/**
 * Call this inside a user-gesture handler (e.g. button click) to unlock
 * the AudioContext on iOS/mobile before any programmatic beep plays.
 */
export function initAudio(): void {
	if (typeof window === "undefined") return;
	try {
		const ctx = getAudioContext();
		if (ctx.state === "suspended") {
			ctx.resume().catch(() => {});
		}
	} catch {
		// AudioContext not available
	}
}

export function playBeep(
	frequency = 880,
	duration = 0.3,
	type: OscillatorType = "sine"
): void {
	if (typeof window === "undefined") return;
	try {
		const ctx = getAudioContext();

		const play = () => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = frequency;
			osc.type = type;
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(
				0.001,
				ctx.currentTime + duration
			);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + duration);
		};

		if (ctx.state === "suspended") {
			ctx.resume()
				.then(play)
				.catch(() => {});
		} else {
			play();
		}
	} catch {
		// AudioContext not available
	}
}

export function playWarningBeep(): void {
	playBeep(660, 0.2);
	setTimeout(() => playBeep(660, 0.2), 300);
	setTimeout(() => playBeep(880, 0.4), 600);
}

export function playEndBeep(): void {
	playBeep(440, 0.3);
	setTimeout(() => playBeep(330, 0.3), 400);
	setTimeout(() => playBeep(220, 0.6), 800);
}

export function playSleepChime(): void {
	if (typeof window === "undefined") return;
	try {
		const ctx = getAudioContext();
		const play = () => {
			const now = ctx.currentTime;
			// Deep "Gong" sound
			[110, 165, 220].forEach((freq, i) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = i === 0 ? "sine" : "triangle";
				osc.frequency.setValueAtTime(freq, now);
				gain.gain.setValueAtTime(0, now);
				gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
				gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now);
				osc.stop(now + 2.0);
			});
		};
		if (ctx.state === "suspended") ctx.resume().then(play).catch(() => {});
		else play();
	} catch {}
}

export function playWakeChime(): void {
	if (typeof window === "undefined") return;
	try {
		const ctx = getAudioContext();
		const play = () => {
			const now = ctx.currentTime;
			// Bright three-tone chime
			[523.25, 659.25, 783.99].forEach((freq, i) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(freq, now + i * 0.1);
				gain.gain.setValueAtTime(0, now + i * 0.1);
				gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
				gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.0);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now + i * 0.1);
				osc.stop(now + i * 0.1 + 1.0);
			});
		};
		if (ctx.state === "suspended") ctx.resume().then(play).catch(() => {});
		else play();
	} catch {}
}

export function playRoosterCrow(): void {
	if (typeof window === "undefined") return;
	try {
		const ctx = getAudioContext();
		const play = () => {
			// A simple rooster-like simulation with two pitches
			const now = ctx.currentTime;

			// Part 1: High pitch "cock-a-"
			const osc1 = ctx.createOscillator();
			const gain1 = ctx.createGain();
			osc1.type = "sawtooth";
			osc1.frequency.setValueAtTime(400, now);
			osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
			gain1.gain.setValueAtTime(0, now);
			gain1.gain.linearRampToValueAtTime(0.1, now + 0.05);
			gain1.gain.linearRampToValueAtTime(0, now + 0.2);
			osc1.connect(gain1);
			gain1.connect(ctx.destination);
			osc1.start(now);
			osc1.stop(now + 0.2);

			// Part 2: Long, trailing "-doodle-doo"
			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.type = "sawtooth";
			osc2.frequency.setValueAtTime(600, now + 0.2);
			osc2.frequency.exponentialRampToValueAtTime(300, now + 1.2);
			gain2.gain.setValueAtTime(0, now + 0.2);
			gain2.gain.linearRampToValueAtTime(0.15, now + 0.3);
			gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
			osc2.connect(gain2);
			gain2.connect(ctx.destination);
			osc2.start(now + 0.2);
			osc2.stop(now + 1.2);
		};

		if (ctx.state === "suspended") {
			ctx.resume().then(play).catch(() => {});
		} else {
			play();
		}
	} catch {
		// AudioContext not available
	}
}
