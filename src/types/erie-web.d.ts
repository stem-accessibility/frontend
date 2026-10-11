declare module "erie-web" {
  // You can refine these later; this is enough to get moving.
  export class Stream {
    constructor();
    data(kind: "url" | "values" | "name", value: any): this;
    transform: any;
    tone: any;
    encoding: any;
    title(text: string): this;
    description(text: string): this;
    get(): any;
  }

  export function compileAudioGraph(spec: any): Promise<{
    queue: {
      play: (startIndex?: number, endIndex?: number) => void;
      pause: () => void;
      resume: () => void;
      stop: () => void;
    };
  }>;
}
