import type { FilterParams, WorkerInMessage, WorkerOutMessage } from "./filterTypes";

type WorkerScope = {
  onmessage: ((event: MessageEvent<WorkerInMessage>) => void) | null;
  postMessage: (message: WorkerOutMessage) => void;
  close: () => void;
};

type FilterKernelExports = {
  luma: (r: number, g: number, b: number) => number;
  adjustLuma: (r: number, g: number, b: number, brightness: number, contrast: number) => number;
  edgeMagnitude: (left: number, right: number, top: number, bottom: number) => number;
  blendThresholdEdge: (lum: number, edge: number, threshold: number, edgeMixPermille: number) => number;
  sepiaR: (r: number, g: number, b: number) => number;
  sepiaG: (r: number, g: number, b: number) => number;
  sepiaB: (r: number, g: number, b: number) => number;
  posterizeChannel: (value: number, levels: number) => number;
  solarize: (r: number, g: number, b: number, threshold: number) => number;
  duotoneChannel: (lum: number, darkColor: number, lightColor: number) => number;
};

const workerScope = self as unknown as WorkerScope;
const wasmUrl = new URL("./wasm/filter-kernel.wasm", import.meta.url);

let params: FilterParams = {
  activeFilter: "filter-1",
  brightness: 0,
  contrast: 100,
  threshold: 128,
  edgeMix: 0.25,
  posterizeLevels: 4,
  solarizeThreshold: 128,
  duotoneDark: { r: 20, g: 30, b: 60 },
  duotoneLight: { r: 255, g: 220, b: 170 },
};
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let kernel: FilterKernelExports | null = null;

async function initWasm(): Promise<void> {
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`WASM HTTP ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.instantiate(bytes, {});
  kernel = module.instance.exports as FilterKernelExports;
}

function processFrame(bitmap: ImageBitmap): void {
  if (!ctx || !kernel) {
    bitmap.close();
    workerScope.postMessage({ type: "ready" });
    return;
  }

  const t0 = performance.now();
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;
  const pixelCount = width * height;
  const edgeMixPermille = Math.round(params.edgeMix * 1000);

  if (params.activeFilter === "filter-1") {
    const lum = new Uint8Array(pixelCount);

    for (let i = 0, p = 0; p < pixelCount; i += 4, p += 1) {
      lum[p] = kernel.adjustLuma(data[i], data[i + 1], data[i + 2], params.brightness, params.contrast);
    }

    for (let y = 1; y < height - 1; y += 1) {
      const row = y * width;
      for (let x = 1; x < width - 1; x += 1) {
        const p = row + x;
        const edge = kernel.edgeMagnitude(lum[p - 1], lum[p + 1], lum[p - width], lum[p + width]);
        const blended = kernel.blendThresholdEdge(lum[p], edge, params.threshold, edgeMixPermille);
        const i = p * 4;
        data[i] = blended;
        data[i + 1] = blended;
        data[i + 2] = blended;
      }
    }

    ctx.putImageData(frame, 0, 0);
    workerScope.postMessage({ type: "metrics", processMs: performance.now() - t0 });
    workerScope.postMessage({ type: "ready" });
    return;
  }

  for (let p = 0, i = 0; p < pixelCount; p += 1, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (params.activeFilter === "filter-2") {
      data[i] = kernel.sepiaR(r, g, b);
      data[i + 1] = kernel.sepiaG(r, g, b);
      data[i + 2] = kernel.sepiaB(r, g, b);
      continue;
    }

    if (params.activeFilter === "filter-3") {
      data[i] = kernel.posterizeChannel(r, params.posterizeLevels);
      data[i + 1] = kernel.posterizeChannel(g, params.posterizeLevels);
      data[i + 2] = kernel.posterizeChannel(b, params.posterizeLevels);
      continue;
    }

    if (params.activeFilter === "filter-4") {
      const solarized = kernel.solarize(r, g, b, params.solarizeThreshold);
      data[i] = solarized;
      data[i + 1] = solarized;
      data[i + 2] = solarized;
      continue;
    }

    const lum = kernel.luma(r, g, b);
    data[i] = kernel.duotoneChannel(lum, params.duotoneDark.r, params.duotoneLight.r);
    data[i + 1] = kernel.duotoneChannel(lum, params.duotoneDark.g, params.duotoneLight.g);
    data[i + 2] = kernel.duotoneChannel(lum, params.duotoneDark.b, params.duotoneLight.b);
  }

  ctx.putImageData(frame, 0, 0);
  workerScope.postMessage({ type: "metrics", processMs: performance.now() - t0 });
  workerScope.postMessage({ type: "ready" });
}

initWasm()
  .then(() => workerScope.postMessage({ type: "ready" }))
  .catch((err) => {
    workerScope.postMessage({ type: "error", message: String(err) });
  });

workerScope.onmessage = (event) => {
  const msg = event.data;

  if (msg.type === "init") {
    width = msg.width;
    height = msg.height;
    msg.canvas.width = width;
    msg.canvas.height = height;
    ctx = msg.canvas.getContext("2d", { willReadFrequently: true });
    return;
  }

  if (msg.type === "params") {
    params = msg.params;
    return;
  }

  if (msg.type === "frame") {
    processFrame(msg.bitmap);
    return;
  }

  workerScope.close();
};
