export {};

type GenerationParams = {
  n: number;
  min: number;
  max: number;
};

type ClipboardPayload = {
  textData: string;
  vector: number[];
};

type ElectronApi = {
  startProcessing: (params: GenerationParams) => void;
  onGenerateData: (callback: (params: GenerationParams) => void) => void;
  notifyCopiedToClipboard: (payload: ClipboardPayload) => void;
  onReadClipboardAndDraw: (callback: (vector: number[]) => void) => void;
  readFromClipboard: () => string;
  notifyReady: (component: "object2" | "object3") => void;
};

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}