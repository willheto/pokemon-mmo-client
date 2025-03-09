import SpriteCache from '../cache/SpriteCache';
import Client from '../client/Client';
import { canvas, canvas2d } from '../graphics/Canvas';
import Draw2D from '../graphics/Draw2D';
import NpcsManager from '../managers/NpcsManager';
import EventListenersManager from '../managers/EventListenersManager';
import PokemonMovesManager from '../managers/PokemonMovesManager';
import Npc from '../npcs/Npc';
import { Actions } from '../net/Actions';
import Player from '../player/Player';
import { TileManager } from '../tile/TileManager';
import Battle from './Battle';
import Hud from './Hud';
import WildBattle from './WildBattle';
import PokemonsManager from '../managers/PokemonsManager';
import ItemsManager from '../managers/ItemsManager';
import Tutorial from './Tutorial';

export type ModalObject = {
	modalX: number;
	modalY: number;
	modalWidth: number;
	modalHeight: number;
	clickedObjectName: string | null;
	modalOptions: {
		optionText: string;
		optionSecondaryText?: {
			text: string;
			color: string;
		};
		optionFunction: () => void | null;
	}[];
};

export default class World {
	public readonly maxWorldCol: number = 400;
	public readonly maxWorldRow: number = 400;
	public readonly originalTileSize: number = 8;
	public readonly scale: number = 4;
	public readonly tileSize: number = this.originalTileSize * this.scale;

	private lastFrameTime: number = Date.now(); // Store the initial frame time
	private previousFps: number = 0; // Store the previous FPS value
	private fpsShowCounter: number = 0; // Counter for FPS calculation

	// The range of tiles to render based on visibility.
	// Will be updated as map is dragged around.
	public renderStartX: number;
	public renderStartY: number;
	public renderFinishX: number;
	public renderFinishY: number;
	public mapOffsetX: number;
	public mapOffsetY: number;

	public mouseDown: boolean;
	public mouseScreenX: number;
	public mouseScreenY: number;
	public mouseTileX: number;
	public mouseTileY: number;

	public eventListenersManager: EventListenersManager = new EventListenersManager();
	public npcsManager: NpcsManager = new NpcsManager();
	public tileManager: TileManager = new TileManager(this);
	public pokemonMovesManager: PokemonMovesManager = new PokemonMovesManager();
	public pokemonsManager: PokemonsManager = new PokemonsManager();
	public itemsManager: ItemsManager = new ItemsManager();

	public battle: Battle | WildBattle | null = null;
	private tutorial: Tutorial | null = null;

	public hud: Hud = new Hud(this);
	public actions: Actions | null = null;
	public spriteCache: SpriteCache;
	public tickUpdateTime: number = 0;

	public showDebug: boolean = true;

	public gameSocket: WebSocket | null = null;

	public client: Client;

	public currentPlayerID: string = '';
	public players: Player[] = [];
	public npcs: Npc[] = [];
	public modalJustClosed: boolean = false;
	public chatMessages: ChatMessage[] = [];

	public modalObject: ModalObject | null = null;

	public talkEvents: TalkEvent[] = [];
	public soundEvents: SoundEvent[] = [];
	public battleEvents: BattleEvent[] = [];
	public wildPokemonEvents: WildPokemonEvent[] = [];
	public battleTurnEvents: BattleTurnEvent[] = [];
	public wildBattleTurnEvents: WildBattleTurnEvent[] = [];
	public openShopID: string | null = null;

	public shouldRenderTutorial: boolean = false;

	constructor(client: Client) {
		this.client = client;

		this.mapOffsetX = 0;
		this.mapOffsetY = 0;

		this.mouseDown = false;
		this.mouseScreenX = 0;
		this.mouseScreenY = 0;
		this.mouseTileX = 0;
		this.mouseTileY = 0;

		this.renderStartX = 0;
		this.renderStartY = 0;
		this.renderFinishX = 0;
		this.renderFinishY = 0;
		this.spriteCache = new SpriteCache();
	}

	public setSocket(socket: WebSocket): void {
		this.gameSocket = socket;
		this.actions = new Actions(socket, this);
	}

	public init(): void {
		this.initializeEventListeners();
		if (!this.shouldRenderTutorial) {
			this.client.audioManager.playMusic('new_bark_town.mp3');
		}
	}

	public async update(): Promise<void> {
		const timeNow = Date.now();
		const deltaTime = timeNow - this.lastFrameTime;
		const fps = 1000 / deltaTime;
		this.fpsShowCounter += deltaTime;
		this.lastFrameTime = timeNow;
		if (this.shouldRenderTutorial) {
			if (!this.tutorial) {
				this.tutorial = new Tutorial(this);
			}
			this.tutorial.update();
			this.tutorial.draw();
			return;
		}

		if (this.battle !== null) {
			this.battle?.update();
			this.battle?.draw();

			if (this.showDebug) {
				this.drawDebug(fps);
			}

			return;
		}

		this.tileManager.drawLayer(1);

		const entities = [...this.players, ...this.npcs];

		entities.sort((a, b) => {
			return a.worldY - b.worldY;
		});

		for (const entity of entities) {
			if (entity instanceof Player) {
				entity.drawPlayer();
			} else if (entity instanceof Npc) {
				entity.drawNpc();
			}
		}

		if (this.showDebug) {
			this.drawDebug(fps);
		}

		this.hud.drawHud();

		if (this.modalObject) {
			Draw2D.drawModal(this);
		}

		// play sound events
		for (const soundEvent of this.soundEvents) {
			if (soundEvent.isSfx) {
				this.client.audioManager.playSfx(soundEvent.soundName, soundEvent.shouldInterrupt);
			}
		}

		for (const battleEvent of this.battleEvents) {
			const isPlayerEntity1 = this.currentPlayerID === battleEvent.entity1ID;
			const player = this.players.find(player => player.entityID === this.currentPlayerID);

			const enemyEntityID = isPlayerEntity1 ? battleEvent.entity2ID : battleEvent.entity1ID;
			const enemy =
				this.players.find(player => player.entityID === enemyEntityID) ||
				this.npcs.find(npc => npc.entityID === enemyEntityID);
			if (!player || !enemy) return;

			const battle = new Battle(this, player, enemy);

			this.battle = battle;
			this.battle.initBattle();
		}

		for (const wildPokemonEvent of this.wildPokemonEvents) {
			const player = this.players.find(player => player.entityID === this.currentPlayerID);

			if (player) {
				const battle = new WildBattle(this, player, wildPokemonEvent.wildPokemon);
				this.battle = battle;
				this.battle.initBattle();
			}
		}

		// clear events
		this.soundEvents = [];
		this.battleEvents = [];
		this.wildPokemonEvents = [];
	}

	private onMouseMove(e: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();

		this.mouseScreenX = e.clientX - rect.left;
		this.mouseScreenY = e.clientY - rect.top;
		// Adjust mouse position for the current scroll offset
		const adjustedX = this.mouseScreenX - this.tileManager.offsetX;
		const adjustedY = this.mouseScreenY - this.tileManager.offsetY;

		// Calculate the tile indices based on adjusted mouse coordinates and tile size
		this.mouseTileX = Math.floor(adjustedX / this.tileSize);
		this.mouseTileY = Math.floor(adjustedY / this.tileSize);

		const npcsOnClickedTile = this.npcs.filter(npc => this.isEntityOnTile(npc, this.mouseTileX, this.mouseTileY));

		const playersOnClickedTile = this.players.filter(
			player =>
				player.entityID !== this.currentPlayerID &&
				this.isEntityOnTile(player, this.mouseTileX, this.mouseTileY),
		);

		if (playersOnClickedTile.length > 0 || npcsOnClickedTile.length > 0) {
			// change mouse cursor to pointer
			canvas.style.cursor = 'pointer';
		} else {
			canvas.style.cursor = 'default';
		}

		this.tileManager.highlightTile(this.mouseTileX, this.mouseTileY);
	}

	private getTilesByScreenPosition(x: number, y: number): { x: number; y: number } {
		const adjustedX = x - this.tileManager.offsetX;
		const adjustedY = y - this.tileManager.offsetY;

		const tileX = Math.floor(adjustedX / this.tileSize);
		const tileY = Math.floor(adjustedY / this.tileSize);

		return { x: tileX, y: tileY };
	}

	private isEntityOnTile = (entity: Player | Npc, mouseX: number, mouseY: number): boolean => {
		const onTile = entity.worldX === mouseX && (entity.worldY === mouseY || entity.worldY - 1 === mouseY);

		// Fix: Ensure pseudo-tile logic correctly allows clicking on adjacent tiles
		const isOnPseudoTile =
			(mouseX === entity.worldX && mouseY === entity.worldY + 1) || // Below
			(mouseX === entity.worldX + 1 && mouseY === entity.worldY) || // Right
			(mouseX === entity.worldX + 1 && mouseY === entity.worldY + 1); // Bottom-right diagonal

		if (onTile || isOnPseudoTile) return true;

		// Check for next tile direction movement
		if (entity.nextTileDirection) {
			const nextTile = {
				UP: { x: entity.worldX, y: entity.worldY - 1 },
				DOWN: { x: entity.worldX, y: entity.worldY + 1 },
				LEFT: { x: entity.worldX - 1, y: entity.worldY },
				RIGHT: { x: entity.worldX + 1, y: entity.worldY },
			}[entity.nextTileDirection] || { x: entity.worldX, y: entity.worldY };

			return nextTile.x === mouseX && nextTile.y === mouseY;
		}

		return false;
	};

	private initializeEventListeners(): void {
		this.eventListenersManager.addCanvasEventListener('world_context_menu', 'contextmenu', (e: any) => {
			e.preventDefault(); // Prevent the context menu from appearing
		});

		canvas.onmouseup = (): boolean => {
			this.mouseDown = false;
			return false;
		};

		canvas.onmousedown = (): boolean => {
			this.mouseDown = true;
			return false;
		};

		canvas.onclick = (e: any): void => {
			if (this.shouldRenderTutorial) {
				this.tutorial?.handleClick(e);
				return;
			}
			if (this.battle !== null) {
				this.battle?.handleClick(e);
				return;
			}

			if (this.modalJustClosed) return;

			if (this.hud.chat.mouseOverChallengeFromID !== null) {
				this.actions?.startBattle(this.currentPlayerID, this.hud.chat.mouseOverChallengeFromID);
			}

			if (this.hud.chat.isMouseOverTalkModal() === true) {
				return;
			}
			if (this.isMouseOverModalObject() === true) {
				return;
			}

			if (this.hud.isMouseOverHud()) {
				this.hud.handleClick();
				return;
			}

			this.handleClick(e);
		};

		canvas.onmousemove = (e: MouseEvent): void => {
			this.onMouseMove(e);
			// highlight the tile the mouse is over
		};

		canvas.oncontextmenu = (e: MouseEvent): void => {
			if (this.modalJustClosed) return;

			if (this.hud.chat.isMouseOverTalkModal() === true) {
				return;
			}
			if (this.isMouseOverModalObject() === true) {
				return;
			}

			if (this.hud.isMouseOverHud()) {
				this.hud.handleContextClick();
				return;
			}

			const npcsOnClickedTile = this.npcs.filter(npc =>
				this.isEntityOnTile(npc, this.mouseTileX, this.mouseTileY),
			);

			const playersOnClickedTile = this.players.filter(
				player =>
					player.entityID !== this.currentPlayerID &&
					this.isEntityOnTile(player, this.mouseTileX, this.mouseTileY),
			);

			const tiles = this.getTilesByScreenPosition(this.mouseScreenX, this.mouseScreenY);

			this.modalObject = {
				modalX: this.mouseScreenX,
				modalY: this.mouseScreenY,
				modalWidth: 200,
				modalHeight: 50,
				clickedObjectName: null,
				modalOptions: [
					{
						optionText: 'Walk here',
						optionFunction: (): void => {
							this.actions?.movePlayer(this.currentPlayerID, tiles.x, tiles.y);
						},
					},
				],
			};
			if (playersOnClickedTile.length > 0) {
				for (const player of playersOnClickedTile) {
					this.modalObject.modalOptions.push({
						optionText: 'Battle ',
						optionSecondaryText: {
							text: ' ' + player.name,
							color: 'yellow',
						},

						optionFunction: (): void => {
							this.actions?.challengePlayer(this.currentPlayerID, player.entityID);
						},
					});
				}
			}

			if (npcsOnClickedTile.length > 0) {
				for (const npc of npcsOnClickedTile) {
					const npcInfo = this.npcsManager.getNpcInfoByIndex(npc.entityIndex);
					const isTalkable = npcInfo?.isTalkable || false;

					if (isTalkable) {
						this.modalObject.modalOptions.push({
							optionText: 'Talk-to ',
							optionSecondaryText: {
								text: ' ' + npc.name,
								color: 'yellow',
							},
							optionFunction: (): void => {
								this.actions?.moveAndTalk(this.currentPlayerID, npc.entityID);
								this.modalObject = null;
							},
						});
					}

					this.modalObject.modalOptions.push({
						optionText: 'Battle ',
						optionSecondaryText: {
							text: ' ' + npc.name,
							color: 'yellow',
						},

						optionFunction: (): void => {
							console.log('Battle ' + npc.name);
						},
					});
				}
			}

			e.stopPropagation();
			e.preventDefault();
		};
	}

	private handleClick(e: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// if clicked on minimap, ignore
		const tileMapWidth = 210;
		const tileMapHeight = 210;

		if (mouseX >= canvas.width - tileMapWidth - 5 && mouseY <= tileMapHeight + 5) {
			return;
		}

		// Adjust mouse position for the current scroll offset
		const adjustedX = mouseX - this.tileManager.offsetX;
		const adjustedY = mouseY - this.tileManager.offsetY;

		// Calculate the tile indices based on adjusted mouse coordinates and tile size
		this.mouseTileX = Math.floor(adjustedX / this.tileSize);
		this.mouseTileY = Math.floor(adjustedY / this.tileSize);

		this.actions?.movePlayer(this.currentPlayerID, this.mouseTileX, this.mouseTileY);
	}

	public destroy(): void {
		canvas.onmouseup = null;
		canvas.onmousedown = null;
		canvas.onclick = null;
		canvas.onmousemove = null;
		canvas.oncontextmenu = null;
		this.client.audioManager.stopMusic();
		this.eventListenersManager.destroyAllCanvasEventListeners();
	}

	private isMouseOverModalObject(): boolean {
		if (this.modalObject) {
			if (
				this.mouseScreenX >= this.modalObject.modalX &&
				this.mouseScreenX <= this.modalObject.modalX + this.modalObject.modalWidth &&
				this.mouseScreenY >= this.modalObject.modalY &&
				this.mouseScreenY <= this.modalObject.modalY + this.modalObject.modalHeight
			) {
				return true;
			}
		}
		return false;
	}

	private drawDebug(fps: number): void {
		canvas2d.fillStyle = 'rgba(0, 0, 0, 0.5)';
		canvas2d.fillRect(0, 0, 350, 205);

		canvas2d.font = '16px Pkmn';
		canvas2d.fillStyle = 'white';
		canvas2d.fillText('FPS: ' + Math.floor(this.previousFps), 10, 25);
		canvas2d.fillText('Latency: ', 10, 45);
		const latencyTextWidth = canvas2d.measureText('Latency: ').width;
		if (this.client?.latency <= 250) {
			canvas2d.fillStyle = 'yellow';
		} else {
			canvas2d.fillStyle = 'red';
		}

		canvas2d.fillText(Math.floor(this.client.latency || 0) + 'ms', 10 + latencyTextWidth, 45);
		canvas2d.fillStyle = 'white';
		canvas2d.fillText('Last packet size: ' + Math.floor(this.client?.lastPacketSize || 0) + ' bytes', 10, 65);
		const currentPlayer = this.players.find(player => player.entityID === this.currentPlayerID);
		canvas2d.fillText('Player tile: ' + currentPlayer?.worldX + ', ' + currentPlayer?.worldY, 10, 85);
		canvas2d.fillText('Mouse tile: ' + this.mouseTileX + ', ' + this.mouseTileY, 10, 105);
		canvas2d.fillText('Mouse screen: ' + this.mouseScreenX + ', ' + this.mouseScreenY, 10, 125);
		canvas2d.fillText(
			'Sprite cache hit %: ' +
				(
					(this.spriteCache.cacheHits / (this.spriteCache.cacheHits + this.spriteCache.cacheMisses)) *
					100
				).toFixed(2) +
				'%',
			10,
			145,
		);
		canvas2d.fillText('Current chunk: ' + currentPlayer?.currentChunk, 10, 165);

		canvas2d.fillStyle = 'yellow';
		canvas2d.fillText('Type ::debug to hide', 10, 195);

		if (this.fpsShowCounter > 200) {
			this.fpsShowCounter = 0;
			this.previousFps = Math.floor(fps);
		}
	}
}
