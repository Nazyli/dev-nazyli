export function supportsWebGL(): boolean {
  let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  try {
    const canvas = document.createElement("canvas");
    if (!window.WebGLRenderingContext) return false;
    context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(context);
  } catch {
    return false;
  } finally {
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
