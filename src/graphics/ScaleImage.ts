export async function scaleImage(image: HTMLImageElement, width: number, height: number): Promise<HTMLImageElement> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');

	if (ctx) {
		ctx.drawImage(image, 0, 0, width, height);
	}

	const scaledImage = new Image();
	return new Promise(resolve => {
		scaledImage.onload = (): void => resolve(scaledImage);
		scaledImage.src = canvas.toDataURL();
	});
}
