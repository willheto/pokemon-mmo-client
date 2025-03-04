import { canvas2d } from '../graphics/Canvas';
import World from '../world/World';

export default class Npc {
	private world: World;
	public nextTileDirection: Direction | null = null;
	public entityID: string;
	public worldX: number = 0;
	public worldY: number = 0;
	public name: string = '';
	public type: number = 0;
	public facingDirection: Direction = 'DOWN';
	public currentChunk: number = 0;
	public currentPath: {
		x: number;
		y: number;
	}[] = [];

	public party: Pokemon[] = [];

	public entityIndex: number;

	public npcWalkSprites: {
		image: HTMLImageElement;
		name: string;
	}[] = [];

	public lastNpcSpriteNumber: number = 1;
	public spriteCounter: number = 0;
	public npcSprite: {
		image: HTMLImageElement;
		name: string;
	} | null = null;

	constructor(world: World, entityID: string, entityIndex: number) {
		this.entityID = entityID;
		this.entityIndex = entityIndex;
		this.world = world;
		this.loadAssets();
	}

	public async loadAssets(): Promise<void> {
		await Promise.all([this.loadNpcWalkSprites()]);
	}

	private async loadNpcWalkSprites(): Promise<void> {
		const directions = ['down', 'left', 'right', 'up'];
		const frames = [1, 2];
		this.npcWalkSprites = [];

		const entityInfo = this.world.npcsManager.getNpcInfoByIndex(this.entityIndex);
		if (!entityInfo) {
			throw new Error('Entity info not found');
		}

		const spriteName = entityInfo.spriteName;

		const spritePromises = directions.flatMap(direction =>
			frames.map(async frame => {
				const sprite = await this.world.spriteCache.getSprite(`${spriteName}_${direction}_${frame}.png`);
				if (!sprite) return null;

				return {
					image: sprite,
					name: `${direction.toUpperCase()}_${frame}`,
				};
			}),
		);

		const sprites = await Promise.all(spritePromises);
		this.npcWalkSprites = sprites.filter(Boolean) as { image: HTMLImageElement; name: string }[];

		const randomIndex = Math.floor(Math.random() * this.npcWalkSprites.length);
		this.npcSprite = this.npcWalkSprites[randomIndex];
	}

	update(npc: NpcInterface): void {
		this.worldX = npc.worldX;
		this.worldY = npc.worldY;
		this.nextTileDirection = npc.nextTileDirection;
		this.name = npc.name;
		this.facingDirection = npc.facingDirection;
		this.party = npc.party;
	}

	private getWalkingSprite(direction: string, step: number): { image: HTMLImageElement; name: string } | undefined {
		return this.npcWalkSprites.find(sprite => sprite.name === `${direction}_${step}`);
	}

	// Handle the walking animation
	private handleWalkingAnimation(): void {
		const step = this.lastNpcSpriteNumber === 1 ? 2 : 1;
		const sprite = this.getWalkingSprite(this.facingDirection, step);
		if (!sprite) return;

		this.npcSprite = sprite;
		this.lastNpcSpriteNumber = step;
		this.spriteCounter = 0;
	}

	drawNpc(): void {
		const { worldX, worldY, nextTileDirection } = this;

		const tickRate = 200; // ms
		const latestTickUpdateTime = this.world.tickUpdateTime;

		const timeSinceLastUpdate = Date.now() - latestTickUpdateTime;
		const interpolationPercentage = Math.min(timeSinceLastUpdate / tickRate, 1);

		// Calculate base screen position based on player's current position
		let screenX = worldX * this.world.tileSize;
		let screenY = worldY * this.world.tileSize;

		// If there's a next direction, calculate the interpolated position
		if (nextTileDirection) {
			let nextX = worldX;
			let nextY = worldY;

			switch (nextTileDirection) {
				case 'UP':
					nextY -= 1;
					break;
				case 'DOWN':
					nextY += 1;
					break;
				case 'LEFT':
					nextX -= 1;
					break;
				case 'RIGHT':
					nextX += 1;
					break;
			}

			const nextScreenX = nextX * this.world.tileSize;
			const nextScreenY = nextY * this.world.tileSize;

			// Interpolate between the current and next tile positions
			screenX = screenX + (nextScreenX - screenX) * interpolationPercentage;
			screenY = screenY + (nextScreenY - screenY) * interpolationPercentage;
		}

		this.spriteCounter += 1;

		if (this.spriteCounter > 7 && this.nextTileDirection) {
			this.handleWalkingAnimation.call(this);
		} else {
			//if sprite direction doesn't match facing direction, change sprite
			if (this.npcSprite?.name.includes(this.facingDirection.toUpperCase()) === false) {
				const sprite = this.getWalkingSprite(this.facingDirection, 1);
				if (!sprite) return;
				this.npcSprite = sprite;
			}
		}

		if (!this.npcSprite?.image) return;

		let tempScreenX = screenX;
		let tempScreenY = screenY;

		// Calculate the vertical offset for entities with a height multiplier
		const heightOffset = this.world.tileSize / 2;

		canvas2d.save();

		// Draw the image normally
		canvas2d.drawImage(
			this.npcSprite.image,
			tempScreenX + this.world.tileManager.offsetX,
			tempScreenY + this.world.tileManager.offsetY - heightOffset - heightOffset,
			64,
			64,
		);

		canvas2d.restore();
	}
}
