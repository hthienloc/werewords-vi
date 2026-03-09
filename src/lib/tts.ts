let enabled = true;

function buildUtterance(text: string): SpeechSynthesisUtterance {
	const utter = new SpeechSynthesisUtterance(text);
	utter.lang = "vi-VN";
	utter.rate = 1.0;
	utter.pitch = 1.0;

	const voices = window.speechSynthesis.getVoices();
	const vi =
		voices.find((v) => v.lang === "vi-VN" || v.lang === "vi_VN") ??
		voices.find((v) => v.lang.startsWith("vi"));
	if (vi) utter.voice = vi;
	return utter;
}

function doSpeak(text: string): void {
	const synth = window.speechSynthesis;
	synth.cancel();

	// Dynamic import to avoid circular deps — music module is optional
	let duckFn: (() => void) | null = null;
	let restoreFn: (() => void) | null = null;
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const m = require("@/lib/music");
		duckFn = m.duckMusic;
		restoreFn = m.restoreMusic;
	} catch {}

	const utter = buildUtterance(text);
	if (duckFn) duckFn();
	utter.onend = () => {
		if (restoreFn) restoreFn();
	};
	utter.onerror = () => {
		if (restoreFn) restoreFn();
	};

	synth.speak(utter);
}

export function speak(text: string, onEnd?: () => void): void {
	if (!enabled || typeof window === "undefined") {
		if (onEnd) setTimeout(onEnd, 100); // Trigger callback if disabled or no window
		return;
	}

	const synth = window.speechSynthesis;
	const voices = synth.getVoices();

	const wrapOnEnd = () => {
		if (onEnd) {
			onEnd();
			onEnd = undefined; // Prevent double trigger
		}
	};

	// Total safety fallback for the entire utterance
	const safetyTimeout = setTimeout(wrapOnEnd, 10000);

	if (voices.length > 0) {
		const utter = buildUtterance(text);
		utter.onend = () => {
			clearTimeout(safetyTimeout);
			wrapOnEnd();
		};
		utter.onerror = () => {
			clearTimeout(safetyTimeout);
			wrapOnEnd();
		};
		
		synth.cancel();
		synth.speak(utter);
	} else {
		let handled = false;
		const handler = () => {
			if (handled) return;
			handled = true;
			synth.removeEventListener("voiceschanged", handler);
			speak(text, onEnd);
		};
		synth.addEventListener("voiceschanged", handler);
		
		// Wait max 500ms for voices, otherwise just try to speak
		setTimeout(() => {
			if (handled) return;
			handled = true;
			synth.removeEventListener("voiceschanged", handler);
			speak(text, onEnd);
		}, 500);
	}
}

export function setTTSEnabled(val: boolean): void {
	enabled = val;
}

export function isTTSEnabled(): boolean {
	return enabled;
}
