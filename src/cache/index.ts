import Draw2D from '../graphics/Draw2D';

export default class Cache {
	private static cacheName = 'pokemonOnlineCache';

	public static async getObjectURLByAssetName(assetName: string): Promise<string | null> {
		const cache = await caches.open(this.cacheName);
		const response = await cache.match(assetName.toLowerCase());
		if (!response) {
			console.warn('No asset found with name:', assetName);
			return null;
		}
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	}

	public static async getCacheNumber(): Promise<number | null> {
		const cache = await caches.open(this.cacheName);
		const response = await cache.match('cacheNumber');
		if (!response) return -1;
		return await response.json();
	}

	public static async saveNewCache(
		assets: { name: string; type: string; data: { name: string; type: string; data: ArrayBuffer }[] }[],
		cacheNumber: number,
	): Promise<void> {
		const cache = await caches.open(this.cacheName);
		await cache.keys().then(keys => Promise.all(keys.map(key => cache.delete(key))));

		let progress = 0;
		const addAssetPromises = assets.flatMap(asset => {
			if (asset.name && asset.type === 'directory' && Array.isArray(asset.data)) {
				return asset.data.map(async content => {
					if (content.name && content.type === 'file' && content.data) {
						const blob = new Blob([new Uint8Array(content.data)]);

						// Determine MIME type based on file extension
						const fileExtension = content.name.toLowerCase().split('.').pop();
						let mimeType = 'application/octet-stream'; // Default fallback

						if (fileExtension === 'wav') {
							mimeType = 'audio/wav';
						} else if (fileExtension === 'mp3') {
							mimeType = 'audio/mpeg';
						} else if (fileExtension === 'ogg') {
							mimeType = 'audio/ogg';
						}

						const response = new Response(blob, {
							headers: { 'Content-Type': mimeType },
						});

						await cache.put(content.name.toLowerCase(), response);
						progress++;
						Draw2D.showProgress(75 + progress, 'Unpacking assets');
					}
				});
			} else {
				console.warn('Invalid asset format', asset);
				return [];
			}
		});

		await Promise.all(addAssetPromises);
		await cache.put('cacheNumber', new Response(JSON.stringify(cacheNumber)));
		Draw2D.showProgress(100, 'Cache update complete');
	}
}
