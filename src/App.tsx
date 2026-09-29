import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ImagePlus,
  RotateCcw,
  Target as TargetIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import DartScene from "./DartScene";
import { playSound, unlockAudio } from "./audio";
import type { Hit, Target } from "./game";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function App() {
  const [setupOpen, setSetupOpen] = useState(true);
  const [text, setText] = useState("");
  const [imageError, setImageError] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [target, setTarget] = useState<Target>(null);
  const [clearKey, setClearKey] = useState(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const [sound, setSound] = useState(true);
  const [throwing, setThrowing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const fileGeneration = useRef(0);
  const lastHit = hits.at(-1);

  useEffect(() => {
    if (setupOpen) textInput.current?.focus();
  }, [setupOpen]);

  useEffect(() => {
    if (!setupOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") start(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setupOpen]);

  useEffect(() => {
    if (!setupOpen) return;
    function onPaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void readImage(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [setupOpen]);

  function start(next: Target) {
    setTarget(next);
    setClearKey((key) => key + 1);
    setHits([]);
    setThrowing(false);
    setImageError("");
    setDragging(false);
    setSetupOpen(false);
  }

  function submitText(event: FormEvent) {
    event.preventDefault();
    if (loadingImage) return;
    start(text.trim() ? { type: "text", text: text.trim() } : null);
  }

  function clearBoard() {
    setClearKey((key) => key + 1);
    setHits([]);
    setThrowing(false);
  }

  async function readImage(file: File | undefined) {
    if (!file) return;
    const generation = ++fileGeneration.current;
    setImageError("");
    if (!IMAGE_TYPES.includes(file.type)) {
      setLoadingImage(false);
      setImageError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLoadingImage(false);
      setImageError("That image is over 10 MB.");
      return;
    }
    setLoadingImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (generation !== fileGeneration.current) {
        bitmap.close();
        return;
      }
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#e4ddc8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      setLoadingImage(false);
      start({ type: "image", url: canvas.toDataURL("image/jpeg", 0.9) });
    } catch {
      if (generation === fileGeneration.current) {
        setLoadingImage(false);
        setImageError("That image couldn’t be opened.");
      }
    }
  }

  function onThrow() {
    if (sound) {
      try {
        unlockAudio();
        playSound("throw");
      } catch {
        /* Sound is optional when a device blocks audio. */
      }
    }
    setThrowing(true);
  }

  function onHit(hit: Hit) {
    setHits((previous) => [...previous, hit]);
    setThrowing(false);
    if (sound) playSound(hit.points === 50 ? "bull" : "hit");
  }

  return (
    <div className="app">
      <DartScene
        target={target}
        clearKey={clearKey}
        focused={!setupOpen}
        onHit={onHit}
        onThrow={onThrow}
      />

      {!setupOpen && (
        <div className="hud">
          <div className="hud-actions">
            <button onClick={() => setSetupOpen(true)}>
              <TargetIcon size={15} /> New target
            </button>
            <button onClick={clearBoard}>
              <RotateCcw size={15} /> Clear
            </button>
            <button
              className="icon-button"
              onClick={() => {
                setSound(!sound);
                if (!sound) {
                  try {
                    unlockAudio();
                  } catch {
                    /* Optional audio. */
                  }
                }
              }}
              aria-label={sound ? "Mute sound" : "Enable sound"}
              aria-pressed={sound}
            >
              {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>
      )}

      {lastHit && !throwing && (
        <div
          className={`impact-score ${lastHit.points === 50 ? "bullseye" : ""}`}
          key={`${clearKey}-${hits.length}`}
          aria-hidden="true"
        >
          {lastHit.points ? `+${lastHit.points}` : "MISS"}
        </div>
      )}

      {setupOpen && (
        <div
          className={`setup ${dragging ? "dragging" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-title"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void readImage(event.dataTransfer.files[0]);
          }}
        >
          <form className="setup-card" onSubmit={submitText}>
            <h1 id="setup-title">Pick a target</h1>
            <input
              ref={textInput}
              className="setup-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type anything, then press Enter"
              aria-label="Target text"
              maxLength={120}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className={`image-drop ${dragging ? "dragging" : ""}`}
              onClick={() => fileInput.current?.click()}
              disabled={loadingImage}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
            >
              <ImagePlus size={20} strokeWidth={1.4} />
              <strong>{loadingImage ? "Loading…" : "Add an image"}</strong>
              <span>Paste, drop, or click to choose</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="visually-hidden"
              tabIndex={-1}
              onChange={(event) => {
                void readImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {imageError && (
              <p className="setup-error" role="alert">
                {imageError}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
