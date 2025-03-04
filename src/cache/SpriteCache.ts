import { COLOR_MAPS } from '../graphics/ColorMap';
import { loadImage } from '../graphics/LoadImage';
import { recolorImageToElement } from '../graphics/RecolorImage';
import Cache from './index';

export default class SpriteCache {
	private cache: { [key: string]: HTMLImageElement } = {};
	public isPreloading: boolean = false;
	public cacheHits: number = 0;
	public cacheMisses: number = 0;

	constructor() {
		this.cache = {};
		this.preloadSprites();
	}

	private async preloadSprites(): Promise<void> {
		this.isPreloading = true;
		const blob = await Cache.getObjectURLByAssetName('npcs.json');

		if (!blob) {
			throw new Error('Entities blob not found');
		}

		const directions = ['down', 'left', 'right', 'up'];
		const frames = [1, 2];

		const entities: NpcData[] = await fetch(blob).then(response => response.json());
		for (const entity of entities) {
			if (entity.spriteName) {
				// preload all direction and frame combinations
				for (const direction of directions) {
					for (const frame of frames) {
						this.getSprite(`${entity.spriteName}_${direction}_${frame}.png`);
					}
				}
			}
		}

		this.isPreloading = false;
	}

	public async getSprite(spriteName: string): Promise<HTMLImageElement | null> {
		const cacheKey = spriteName;
		if (this.cache[cacheKey]) {
			this.cacheHits++;
			return this.cache[cacheKey];
		}

		let image = await loadImage(spriteName);
		if (!image) {
			return null;
		}

		this.cache[cacheKey] = image;
		this.cacheMisses++;
		return image;
	}
}
