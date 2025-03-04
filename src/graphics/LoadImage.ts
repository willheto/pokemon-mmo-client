import Cache from '../cache';

export async function loadImage(name: string): Promise<HTMLImageElement | null> {
	const uri = await Cache.getObjectURLByAssetName(name);

	if (!uri) {
		return null;
	}

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = (): void => resolve(img);
		img.onerror = reject;
		img.src = uri;
	});
}
