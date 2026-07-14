export type FilterSlot = "filter-1" | "filter-2" | "filter-3" | "filter-4" | "filter-5";

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type FilterParams = {
  activeFilter: FilterSlot;
  brightness: number;
  contrast: number;
  threshold: number;
  edgeMix: number;
  posterizeLevels: number;
  solarizeThreshold: number;
  duotoneDark: RgbColor;
  duotoneLight: RgbColor;
};

export const DEFAULT_PARAMS: FilterParams = {
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

export type WorkerInMessage =
  | { type: "init"; canvas: OffscreenCanvas; width: number; height: number }
  | { type: "params"; params: FilterParams }
  | { type: "frame"; bitmap: ImageBitmap }
  | { type: "shutdown" };

export type WorkerOutMessage =
  | { type: "ready" }
  | { type: "metrics"; processMs: number }
  | { type: "error"; message: string };
