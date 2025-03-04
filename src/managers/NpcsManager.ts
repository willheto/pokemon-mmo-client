import Cache from '../cache';

export default class NpcsManager {
	private npcs: NpcData[] = [];

	constructor() {
		this.loadNpcs();
	}

	private async loadNpcs(): Promise<void> {
		const blob = await Cache.getObjectURLByAssetName('npcs.json');

		if (!blob) {
			throw new Error('Npcs blob not found');
		}

		const npcs = await fetch(blob).then(response => response.json());
		this.npcs = npcs;
	}

	public getNpcInfoByIndex(index: number): NpcData | null {
		return this.npcs.find(npc => npc.entityIndex === index) || null;
	}

	public getAllNpcs(): NpcData[] {
		return this.npcs;
	}
}
