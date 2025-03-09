import { canvas, canvas2d } from '../graphics/Canvas';
import Draw2D from '../graphics/Draw2D';
import { loadImage } from '../graphics/LoadImage';
import NpcInteraction from '../npcInteractions/NpcInteraction';
import World from '../world/World';

export default class Player {
	private world: World;
	public nextTileDirection: Direction | null = null;
	public entityID: string;
	public worldX: number = 0;
	public worldY: number = 0;
	public name: string = '';
	public type: number = 0;
	public facingDirection: string = 'DOWN';
	public currentChunk: number = 0;
	public currentPath: {
		x: number;
		y: number;
	}[] = [];
	public inventory: number[] = [];
	public inventoryAmounts: number[] = [];

	public party: Pokemon[] = [];

	public playerWalkSprites: {
		image: HTMLImageElement;
		name: string;
	}[] = [];

	public lastPlayerSpriteNumber: number = 1;
	public spriteCounter: number = 0;
	public playerSprite: {
		image: HTMLImageElement;
		name: string;
	} | null = null;

	public storyProgress: number = 0;

	constructor(world: World, entityID: string) {
		this.entityID = entityID;
		this.world = world;
		this.loadAssets();
	}

	private async loadPlayerWalkSprites(): Promise<void> {
		const directions = ['down', 'left', 'right', 'up'];
		const frames = [1, 2];
		this.playerWalkSprites = [];

		for (const direction of directions) {
			for (const frame of frames) {
				const sprite = await this.loadAndRecolorImage(`player_${direction}_${frame}.png`);
				if (!sprite) continue;
				this.playerWalkSprites.push({
					image: sprite,
					name: `${direction.toUpperCase()}_${frame}`,
				});
			}
		}

		// Set default player sprite
		this.playerSprite = this.playerWalkSprites[0];
	}

	private async loadAndRecolorImage(imagePath: string): Promise<HTMLImageElement | null> {
		let image = await loadImage(imagePath);
		if (!image) {
			return null;
		}

		return image;
	}

	public async loadAssets(): Promise<void> {
		await Promise.all([this.loadPlayerWalkSprites()]);
	}

	update(player: PlayerInterface): void {
		this.currentPath = player.currentPath;
		this.worldX = player.worldX;
		this.worldY = player.worldY;

		this.currentChunk = player.currentChunk;

		this.nextTileDirection = player.nextTileDirection;

		this.name = player.name;

		this.facingDirection = player.facingDirection;
		this.party = player.party;
		this.inventory = player.inventory;
		this.inventoryAmounts = player.inventoryAmounts;
		this.storyProgress = player.storyProgress;
	}

	// Helper function to retrieve the correct walking sprite
	private getWalkingSprite(direction: string, step: number): { image: HTMLImageElement; name: string } | undefined {
		return this.playerWalkSprites.find(sprite => sprite.name === `${direction}_${step}`);
	}

	private handleWalkingAnimation(): void {
		const step = this.lastPlayerSpriteNumber === 1 ? 2 : 1;
		const sprite = this.getWalkingSprite(this.facingDirection, step);
		if (!sprite) return;

		this.playerSprite = sprite;
		this.lastPlayerSpriteNumber = step;
		this.spriteCounter = 0;
	}

	drawPlayer(): void {
		const { worldX, worldY, nextTileDirection } = this;

		const isCurrentPlayer = this.world.currentPlayerID === this.entityID;

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

			// Update the camera offset only if the current player moves
			if (isCurrentPlayer) {
				this.world.tileManager.offsetX = canvas.width / 2 - screenX - 100;
				this.world.tileManager.offsetY = canvas.height / 2 - screenY;
			}
		} else if (isCurrentPlayer) {
			// If the player is stationary, ensure the camera stays centered on them
			this.world.tileManager.offsetX = canvas.width / 2 - screenX - 100;
			this.world.tileManager.offsetY = canvas.height / 2 - screenY;
		}

		this.spriteCounter += 1;

		if (this.spriteCounter > 7 && this.nextTileDirection) {
			this.handleWalkingAnimation.call(this);
		} else {
			//if sprite direction doesn't match facing direction, change sprite
			if (this.playerSprite?.name.includes(this.facingDirection.toUpperCase()) === false) {
				const sprite = this.getWalkingSprite(this.facingDirection, 1);
				if (!sprite) return;
				this.playerSprite = sprite;
			}
		}

		if (!this.playerSprite?.image) return;

		let tempScreenX = screenX;
		let tempScreenY = screenY;

		// Calculate the vertical offset for entities with a height multiplier
		const heightOffset = this.world.tileSize / 2;

		canvas2d.imageSmoothingEnabled = false;

		canvas2d.drawImage(
			this.playerSprite.image,
			tempScreenX + this.world.tileManager.offsetX,
			tempScreenY + this.world.tileManager.offsetY - heightOffset - heightOffset,
			64, // Keep the original width
			64,
		);

		const playersMostRecentChatMessage = this.world.chatMessages
			.filter(chatMessage => {
				return chatMessage.senderName === this.name && chatMessage.isGlobal;
			})
			.slice(-7)
			.sort((a, b) => b.timeSent - a.timeSent)[0];

		const isSentWithing5Seconds =
			playersMostRecentChatMessage && Date.now() - playersMostRecentChatMessage.timeSent < 5000;

		if (playersMostRecentChatMessage && isSentWithing5Seconds) {
			this.drawChatMessage(
				screenX + this.world.tileManager.offsetX,
				tempScreenY + this.world.tileManager.offsetY - heightOffset - heightOffset * 0.5 - 0,
				playersMostRecentChatMessage,
			);
		}

		const playerTalkEvents = this.world.talkEvents.filter(event => event.talkerID === this.world.currentPlayerID);

		if (playerTalkEvents.length > 0) {
			new NpcInteraction(this.world).startNpcInteraction(
				playerTalkEvents[0].targetIndex,
				playerTalkEvents[0].targetID,
			);
			// remove talk event
			this.world.talkEvents = this.world.talkEvents.filter(event => event.talkerID !== this.entityID);
		}
	}

	private drawChatMessage(screenX: number, screenY: number, chatMessage: ChatMessage): void {
		canvas2d.fillStyle = 'yellow';
		Draw2D.drawText(screenX + this.world.tileSize, screenY - 15, chatMessage.message, {
			color: 'white',
			align: 'center',
			stroke: {
				color: 'black',
				width: 4,
			},

			font: '20px Pkmn',
		});
	}
}
