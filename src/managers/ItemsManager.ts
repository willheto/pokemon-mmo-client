import Cache from '../cache';

export default class ItemsManager {
	private items: Item[] = [];
	public itemSprites: {
		sprite: HTMLImageElement;
		name: string;
	}[] = [];

	constructor() {
		this.loadItems();
	}

	private async loadItems(): Promise<void> {
		const blob = await Cache.getObjectURLByAssetName('items.json');

		if (!blob) {
			throw new Error('Items blob not found');
		}

		const items = await fetch(blob).then(response => response.json());
		this.items = items;

		items.forEach(async (item: Item) => {
			const sprite = await Cache.getObjectURLByAssetName(item.spriteName);
			if (!sprite) return;

			const image = new Image();
			image.src = sprite;
			this.itemSprites.push({ sprite: image, name: item.spriteName });
		});
	}

	public getItemInfoById(id: number): Item | null {
		return this.items.find(item => item.itemID === id) || null;
	}
}
