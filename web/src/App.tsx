import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PARAMS, type FilterParams, type FilterSlot, type RgbColor, type WorkerInMessage, type WorkerOutMessage } from "./filterTypes";

const CANVAS_SIZE = {
  width: 960,
  height: 540,
};

const FILTER_SLOTS: Array<{ id: FilterSlot; label: string }> = [
  { id: "filter-1", label: "Classic" },
  { id: "filter-2", label: "Sepia" },
  { id: "filter-3", label: "Posterize" },
  { id: "filter-4", label: "Solarize" },
  { id: "filter-5", label: "Duotone" },
];

const supportsWorkerPipeline = (canvas: HTMLCanvasElement): boolean =>
  typeof Worker !== "undefined" &&
  typeof OffscreenCanvas !== "undefined" &&
  typeof canvas.transferControlToOffscreen === "function";

export function App() {
  const [params, setParams] = useState<FilterParams>(DEFAULT_PARAMS);
  const [runtimeStatus, setRuntimeStatus] = useState("Status: idle");
  const [processMs, setProcessMs] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const paramsRef = useRef<FilterParams>(DEFAULT_PARAMS);
  const workerReadyRef = useRef(false);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRuntimeStatus("Status: stopped");
  }, []);

  const frameLoop = useCallback(async () => {
    const worker = workerRef.current;
    const video = videoRef.current;

    if (!runningRef.current || !worker || !video) return;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && workerReadyRef.current) {
      workerReadyRef.current = false;
      try {
        const bitmap = await createImageBitmap(video);
        worker.postMessage({ type: "frame", bitmap } satisfies WorkerInMessage, [bitmap]);
      } catch (err) {
        workerReadyRef.current = true;
        setRuntimeStatus(`Status: frame error (${String(err)})`);
      }
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      void frameLoop();
    });
  }, []);

  const updateParams = useCallback((nextParams: FilterParams) => {
    paramsRef.current = nextParams;
    setParams(nextParams);
    workerRef.current?.postMessage({ type: "params", params: nextParams } satisfies WorkerInMessage);
  }, []);

  const selectFilter = useCallback(
    (activeFilter: FilterSlot) => {
      updateParams({ ...paramsRef.current, activeFilter });
    },
    [updateParams],
  );

  const updateParam = useCallback(
    (key: "brightness" | "contrast" | "threshold" | "edgeMix" | "posterizeLevels" | "solarizeThreshold", value: number) => {
      updateParams({ ...paramsRef.current, [key]: value });
    },
    [updateParams],
  );

  const updateDuotoneColor = useCallback(
    (key: "duotoneDark" | "duotoneLight", channel: keyof RgbColor, value: number) => {
      updateParams({
        ...paramsRef.current,
        [key]: {
          ...paramsRef.current[key],
          [channel]: value,
        },
      });
    },
    [updateParams],
  );

  const start = useCallback(async () => {
    const video = videoRef.current;
    const worker = workerRef.current;

    if (runningRef.current || !video || !worker) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setRuntimeStatus("Status: camera API unavailable");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      runningRef.current = true;
      setRuntimeStatus("Status: camera active, Worker + WebAssembly");
      void frameLoop();
    } catch (err) {
      setRuntimeStatus(`Status: camera error (${String(err)})`);
    }
  }, [frameLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (!supportsWorkerPipeline(canvas)) {
      setRuntimeStatus("Status: OffscreenCanvas or Web Worker unavailable");
      return undefined;
    }

    const worker = new Worker(new URL("./filterWorker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        workerReadyRef.current = true;
        return;
      }
      if (msg.type === "metrics") {
        setProcessMs(msg.processMs);
        return;
      }
      setRuntimeStatus(`Status: worker error (${msg.message})`);
    };

    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage(
      { type: "init", canvas: offscreen, width: CANVAS_SIZE.width, height: CANVAS_SIZE.height } satisfies WorkerInMessage,
      [offscreen],
    );
    worker.postMessage({ type: "params", params: paramsRef.current } satisfies WorkerInMessage);

    return () => {
      stop();
      worker.postMessage({ type: "shutdown" } satisfies WorkerInMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, [stop]);

  return (
    <main id="live-filter-app">
      <canvas ref={canvasRef} id="outputCanvas" width={CANVAS_SIZE.width} height={CANVAS_SIZE.height} />
      <video ref={videoRef} id="sourceVideo" autoPlay playsInline muted />

      <section className="overlay-top">
        <div className="chip">
          <div className="title">Live Camera Filters</div>
          <div className="status">{runtimeStatus}</div>
          <div className="status">Processing: {processMs === null ? "-" : processMs.toFixed(1)} ms</div>
        </div>
      </section>

      <section className="overlay-bottom">
        <div className="row">
          <button onClick={() => void start()}>Start Camera</button>
          <button className="secondary" onClick={stop}>
            Stop
          </button>
        </div>

        <div className="filter-switcher" aria-label="Filter slots">
          {FILTER_SLOTS.map((filter) => (
            <button
              key={filter.id}
              className={params.activeFilter === filter.id ? "filter-option active" : "filter-option"}
              type="button"
              aria-pressed={params.activeFilter === filter.id}
              onClick={() => selectFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {params.activeFilter === "filter-1" ? (
          <>
            <Control label="Brightness" value={params.brightness} min={-100} max={100} step={1} onChange={(value) => updateParam("brightness", value)} />
            <Control label="Contrast" value={params.contrast} min={50} max={250} step={1} onChange={(value) => updateParam("contrast", value)} />
            <Control label="Threshold" value={params.threshold} min={0} max={255} step={1} onChange={(value) => updateParam("threshold", value)} />
            <Control label="Edge Mix" value={params.edgeMix} min={0} max={1} step={0.01} onChange={(value) => updateParam("edgeMix", value)} />
          </>
        ) : null}

        {params.activeFilter === "filter-2" ? <div className="status">Sepia uses fixed tone coefficients.</div> : null}

        {params.activeFilter === "filter-3" ? (
          <Control
            label="Posterize Levels"
            value={params.posterizeLevels}
            min={2}
            max={8}
            step={1}
            onChange={(value) => updateParam("posterizeLevels", value)}
          />
        ) : null}

        {params.activeFilter === "filter-4" ? (
          <Control
            label="Solarize Threshold"
            value={params.solarizeThreshold}
            min={0}
            max={255}
            step={1}
            onChange={(value) => updateParam("solarizeThreshold", value)}
          />
        ) : null}

        {params.activeFilter === "filter-5" ? (
          <>
            <div className="status">Duotone Dark</div>
            <Control label="Dark R" value={params.duotoneDark.r} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneDark", "r", value)} />
            <Control label="Dark G" value={params.duotoneDark.g} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneDark", "g", value)} />
            <Control label="Dark B" value={params.duotoneDark.b} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneDark", "b", value)} />
            <div className="status">Duotone Light</div>
            <Control label="Light R" value={params.duotoneLight.r} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneLight", "r", value)} />
            <Control label="Light G" value={params.duotoneLight.g} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneLight", "g", value)} />
            <Control label="Light B" value={params.duotoneLight.b} min={0} max={255} step={1} onChange={(value) => updateDuotoneColor("duotoneLight", "b", value)} />
          </>
        ) : null}
      </section>
    </main>
  );
}

type ControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function Control({ label, value, min, max, step, onChange }: ControlProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const formattedValue = step < 1 ? value.toFixed(2) : String(value);

  return (
    <div>
      <label htmlFor={id}>
        {label}: <span>{formattedValue}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
