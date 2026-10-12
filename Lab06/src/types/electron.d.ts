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
  notifyReady: (component: "object2" | "object3") => void;
  startProcessing: (params: GenerationParams) => void;
  onGenerateData: (callback: (params: GenerationParams) => void) => void;
  writeToClipboard: (text: string) => void;
  notifyCopiedToClipboard: (payload: ClipboardPayload) => void;
  onReadClipboardAndDraw: (callback: (vector: number[]) => void) => void;
  readFromClipboard: () => string;
};

declare global {
  interface Window {
    electronAPI: ElectronApi;
  }
}