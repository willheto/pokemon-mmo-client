export async function recolorImageToElement(
	img: HTMLImageElement,
	targetColor: string,
	replacementColor: string,
	tolerance: number = 30,
): Promise<HTMLImageElement> {
	// Create an ImageBitmap from the img to work without canvas flickering
	const imgBitmap = await createImageBitmap(img);

	// Convert target and replacement colors to RGB
	const [targetR, targetG, targetB] = hexToRgb(targetColor);
	const [replaceR, replaceG, replaceB] = hexToRgb(replacementColor);

	// Create a new canvas (without drawing to it) to work with ImageBitmap
	const tempCanvas = document.createElement('canvas');
	const ctx = tempCanvas.getContext('2d');

	// Set canvas size to image size
	tempCanvas.width = img.width;
	tempCanvas.height = img.height;

	// Draw the ImageBitmap (no flicker, it's an off-screen image object)
	ctx?.drawImage(imgBitmap, 0, 0);

	// Get the pixel data from the image on the canvas
	const imageData = ctx?.getImageData(0, 0, img.width, img.height);
	const data = imageData?.data;

	// Helper function to check if colors are within tolerance
	function colorsAreClose(r: number, g: number, b: number): boolean {
		return (
			Math.abs(r - targetR) <= tolerance &&
			Math.abs(g - targetG) <= tolerance &&
			Math.abs(b - targetB) <= tolerance
		);
	}

	// Loop through all pixels and recolor the target color
	if (data) {
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i]; // Red channel
			const g = data[i + 1]; // Green channel
			const b = data[i + 2]; // Blue channel

			// If the pixel color is within the tolerance of the target color, replace it
			if (colorsAreClose(r, g, b)) {
				data[i] = replaceR;
				data[i + 1] = replaceG;
				data[i + 2] = replaceB;
			}
		}

		// Put the updated pixel data back into the image
		ctx?.putImageData(imageData, 0, 0);
	}

	// Create a new image element from the updated canvas data
	const newImg = new Image();
	newImg.src = tempCanvas.toDataURL();

	return new Promise(resolve => {
		newImg.onload = (): void => {
			resolve(newImg); // Resolve the promise with the loaded image element
		};
	});
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
	const match = hex.match(/^#([a-fA-F0-9]{6})$/);
	if (!match) throw new Error('Invalid hex color');
	const r = parseInt(match[1].substring(0, 2), 16);
	const g = parseInt(match[1].substring(2, 4), 16);
	const b = parseInt(match[1].substring(4, 6), 16);
	return [r, g, b];
}
