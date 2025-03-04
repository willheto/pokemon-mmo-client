import Tile from './Tile';
import World from '../world/World';
import { loadImage } from '../graphics/LoadImage';
import { canvas2d } from '../graphics/Canvas';
import Cache from '../cache';

export class TileManager {
	world: World;
	tile: Tile[];
	mapTileNums: number[][][] = [];
	offsetX: number = 0;
	offsetY: number = 0;
	scrollSpeed: number = 5; // Speed of the scrolling, adjust as needed
	edgeThreshold: number = 50;
	isScrolling: boolean = false;
	currentScrollDirection: string = '';
	tilesheet: HTMLImageElement | null = null;
	highlightedTileX: number = 0;
	highlightedTileY: number = 0;

	constructor(world: World) {
		this.world = world;
		this.tile = new Array(100); // Adjust if needed
		this.mapTileNums = Array.from({ length: 1 }, () =>
			Array.from({ length: world.maxWorldCol }, () => new Array(world.maxWorldRow).fill(0)),
		);

		this.loadTilesheet('pokemon_online_tilesheet.png'); // Load the tilesheet image
		this.loadMap('pokemon_online_map.csv', 1);
	}

	handleMouseMove(event: MouseEvent): void {
		const rect = canvas2d.canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Determine scroll direction based on edge threshold
		this.isScrolling = false;

		if (mouseX < this.edgeThreshold && mouseX > this.edgeThreshold - 20) {
			this.currentScrollDirection = 'left';
			this.isScrolling = true;
		} else if (
			mouseX > canvas2d.canvas.width - this.edgeThreshold &&
			mouseX < canvas2d.canvas.width - this.edgeThreshold + 20
		) {
			this.currentScrollDirection = 'right';
			this.isScrolling = true;
		}

		if (mouseY < this.edgeThreshold && mouseY > this.edgeThreshold - 20) {
			this.currentScrollDirection = 'up';
			this.isScrolling = true;
		} else if (
			mouseY > canvas2d.canvas.height - this.edgeThreshold &&
			mouseY < canvas2d.canvas.height - this.edgeThreshold + 20
		) {
			this.currentScrollDirection = 'down';
			this.isScrolling = true;
		}
	}

	public highlightTile(mouseTileX: number, mouseTileY: number): void {
		// Highlight the tile the player is currently standing on
		this.highlightedTileX = mouseTileX;
		this.highlightedTileY = mouseTileY;
	}
	// Load the tilesheet
	private async loadTilesheet(tilesheetPath: string): Promise<void> {
		try {
			this.tilesheet = await loadImage(tilesheetPath);
			this.getTileImages(); // Once the tilesheet is loaded, extract tiles
		} catch (e) {
			console.error('Failed to load tilesheet:', e);
		}
	}

	// Extract tiles from the tilesheet
	private getTileImages(): void {
		if (!this.tilesheet) {
			console.error('Tilesheet not loaded.');
			return;
		}

		const tileSize = 8; // Tile size (16x16)
		const cols = Math.floor(this.tilesheet.width / tileSize);
		const rows = Math.floor(this.tilesheet.height / tileSize);

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				const tileIndex = i * cols + j;
				const x = j * tileSize;
				const y = i * tileSize;
				this.setup(tileIndex, x, y, tileSize, tileSize);
			}
		}
	}

	// Setup the tile with a specific portion of the tilesheet
	private async setup(index: number, x: number, y: number, width: number, height: number): Promise<void> {
		try {
			this.tile[index] = new Tile();
			this.tile[index].collision = false; // Default collision setting, modify as needed
			const croppedImage = await this.cropImage(this.tilesheet!, x, y, width, height);
			this.tile[index].image = croppedImage;
		} catch (e) {
			console.error('Failed to setup tile:', e);
		}
	}

	// Crop the image from the tilesheet
	private cropImage(
		image: HTMLImageElement,
		x: number,
		y: number,
		width: number,
		height: number,
	): Promise<HTMLImageElement> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return Promise.reject('Unable to get canvas context');
		}

		canvas.width = width;
		canvas.height = height;
		ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

		const croppedImage = new Image();
		return new Promise(resolve => {
			croppedImage.onload = (): void => resolve(croppedImage);
			croppedImage.src = canvas.toDataURL();
		});
	}

	async loadMap(filePath: string, layer: number): Promise<void> {
		try {
			const blob = await Cache.getObjectURLByAssetName(filePath);
			if (!blob) {
				console.error('Failed to load map file');
				return;
			}
			const text = await fetch(blob).then(r => r.text());
			const lines = text.split('\n');

			let col = 0;
			let row = 0;

			for (const line of lines) {
				if (col >= this.world.maxWorldCol || row >= this.world.maxWorldRow) break;

				const numbers = line.split(',');

				for (col = 0; col < this.world.maxWorldCol; col++) {
					const num = parseInt(numbers[col], 10);
					if (layer >= 1 && layer <= 4) this.mapTileNums[layer - 1][col][row] = num;
				}
				col = 0;
				row++;
			}
		} catch (e) {
			console.error(e);
		}
	}

	drawLayer(layer: number): void {
		const tileMap = this.mapTileNums[layer - 1];
		const tileSize = this.world.tileSize;
		const playerMoveSize = tileSize * 2; // 16px (since player moves in 16x16)

		// Calculate the starting tile based on the current offsets
		const startCol = Math.floor(-this.offsetX / tileSize);
		const startRow = Math.floor(-this.offsetY / tileSize);

		// Define the range to draw
		const range = 13; // Number of tiles to draw in each direction
		const endCol = startCol + range * 4; // 10 tiles in each direction
		const endRow = startRow + range * 2; // 10 tiles in each direction

		for (let worldRow = startRow; worldRow <= endRow; worldRow++) {
			for (let worldCol = startCol; worldCol <= endCol; worldCol++) {
				if (
					worldCol < 0 ||
					worldCol >= this.world.maxWorldCol ||
					worldRow < 0 ||
					worldRow >= this.world.maxWorldRow
				) {
					continue; // Skip out-of-bounds tiles
				}

				try {
					const tileNum = tileMap[worldCol][worldRow];
					const screenX = worldCol * tileSize + this.offsetX;
					const screenY = worldRow * tileSize + this.offsetY;

					if (!this.tile[tileNum] || this.tile[tileNum].image === null) {
						continue; // Skip to the next tile if the image is not available
					}

					canvas2d.drawImage(this.tile[tileNum].image, screenX, screenY, tileSize, tileSize);

					// Highlighting Fix: Adjust to 16x16 grid
					if (
						Math.floor(this.highlightedTileX / 2) === Math.floor(worldCol / 2) &&
						Math.floor(this.highlightedTileY / 2) === Math.floor(worldRow / 2) &&
						this.world.modalObject === null
					) {
						const highlightX = Math.floor(worldCol / 2) * playerMoveSize + this.offsetX;
						const highlightY = Math.floor(worldRow / 2) * playerMoveSize + this.offsetY;

						canvas2d.strokeStyle = 'brown';
						canvas2d.lineWidth = 2;
						canvas2d.strokeRect(highlightX, highlightY, playerMoveSize, playerMoveSize);
					}
				} catch (e) {
					console.error(e);
				}
			}
		}
	}
}
