export const canvas: HTMLCanvasElement = document.getElementById(
  "viewport"
) as HTMLCanvasElement;

export const canvas2d: CanvasRenderingContext2D = canvas.getContext("2d", {
  willReadFrequently: true,
})!;
