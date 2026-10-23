declare module "liquid-gl" {
  interface LiquidLens { destroy(): void }
  interface LiquidOptions {
    target: string;
    snapshot?: string;
    content?: string | false;
    engine?: "auto" | "webgpu" | "webgl2" | "webgl";
    resolution?: number;
    refraction?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    tilt?: boolean;
    interaction?: "none" | "fluid";
    interactionStrength?: number;
    tint?: string;
    zIndex?: number;
  }
  export default function liquidGL(options: LiquidOptions): LiquidLens | LiquidLens[] | undefined;
}
