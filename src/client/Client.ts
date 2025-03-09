import Draw2D from '../graphics/Draw2D';
import LoginServerEvents from './LoginServerEvents';
import Login, { LOGIN_REQUEST } from '../login/Login';
import Cache from '../cache';
import World from '../world/World';
import Player from '../player/Player';
import Npc from '../npcs/Npc';
import pako from 'pako';
import AudioManager from '../managers/AudioManager';
import { canvas2d } from '../graphics/Canvas';

const UPDATE_REQUEST = {
	CHECK_FOR_UPDATES: 1,
};

const UPDATE_RESPONSE = {
	CACHE_UP_TO_DATE: 1,
	UPDATE_AVAILABLE: 2,
};

export default class Client {
	private targetFPS: number = 60;
	private frameInterval: number = 1000 / this.targetFPS;
	private lastFrameTime: number = Date.now();

	private loginTime: number = Date.now();

	// DEBUG
	public latency: number = 0;
	private lastPingTime: number = 0;
	public lastPacketSize: number = 0;

	public loginSocket: WebSocket | null = null;

	public login: Login | null = null;
	public world: World | null = null;

	public cacheNumber: number | null = null;

	private pingInterval: any;
	private animationFrame: number = 0;

	public audioManager: AudioManager = new AudioManager();

	constructor() {
		//
	}

	public stopGameAndGoToLogin(): void {
		this.disconnectFromGameServer();
		this.world?.destroy();
		this.world = null;
		clearInterval(this.pingInterval);
		cancelAnimationFrame(this.animationFrame);

		this.loginSocket?.send(
			JSON.stringify({
				world: 1,
				type: LOGIN_REQUEST.LOGOUT,
			}),
		);

		this.login = new Login(this);
		if (!this.loginSocket) return;
		this.login.init(this.loginSocket);
	}

	private disconnectFromGameServer(): void {
		const playerID = this.world?.currentPlayerID;
		if (!playerID) return;
		this.world?.actions?.logOut(playerID);
	}

	public async startClient(): Promise<void> {
		canvas2d.imageSmoothingEnabled = false;

		Draw2D.fillCanvas('black');
		Draw2D.showProgress(0, 'Connecting to update server');
		const updateServerSocket = await this.connectToUpdateServer();
		Draw2D.fillCanvas('black');
		Draw2D.showProgress(20, 'Downloading assets');

		updateServerSocket.onmessage = async (event): Promise<void> => {
			const data = JSON.parse(event.data);
			if (data.type === UPDATE_RESPONSE.UPDATE_AVAILABLE) {
				Draw2D.fillCanvas('black');
				Draw2D.showProgress(50, 'Unpacking assets');
				await Cache.saveNewCache(data.assets, data.cacheNumber);
				this.cacheNumber = data.cacheNumber;
				Draw2D.fillCanvas('black');
				Draw2D.showProgress(90, 'Connecting to login server');

				await this.connectToLoginServer();
			} else if (data.type === UPDATE_RESPONSE.CACHE_UP_TO_DATE) {
				this.cacheNumber = await Cache.getCacheNumber();
				Draw2D.fillCanvas('black');
				Draw2D.showProgress(30, 'Already up to date');
				Draw2D.fillCanvas('black');
				Draw2D.showProgress(70, 'Connecting to login server');

				await this.connectToLoginServer();
			}
		};

		const currentCacheNumber = await Cache.getCacheNumber();
		updateServerSocket.send(
			JSON.stringify({
				cacheNumber: currentCacheNumber,
				type: UPDATE_REQUEST.CHECK_FOR_UPDATES,
			}),
		);
	}

	private async connectToUpdateServer(): Promise<WebSocket> {
		return new Promise(resolve => {
			const socket = new WebSocket(UPDATE_SERVER_ADDRESS);
			socket.onopen = (): void => {
				resolve(socket);
			};
			socket.onerror = (): void => {
				Draw2D.showProgress(0, 'Error connecting to update server, trying again in 10 seconds...');
				setTimeout(() => {
					this.startClient();
				}, 10000);
			};
		});
	}

	public async startGame(loginToken: string, reconnectInterval?: any): Promise<void> {
		this.world = new World(this);

		setTimeout(async (): Promise<void> => {
			if (!this.world) return;
			const socket = await this.connectToGameServer(loginToken);
			this.world.setSocket(socket);

			socket.onmessage = async (event): Promise<void> => {
				if (reconnectInterval) clearInterval(reconnectInterval);
				try {
					if (event.data == 'pong') {
						const endTime = Date.now();
						this.latency = endTime - this.lastPingTime;
						return;
					}
				} catch (error) {
					console.error('Error parsing event data:', error);
				}

				const arrayBuffer = await event.data.arrayBuffer();
				this.lastPacketSize = arrayBuffer.byteLength;
				const compressedData = new Uint8Array(arrayBuffer);
				const decompressedData = pako.inflate(compressedData, { to: 'string' });
				const gameData = JSON.parse(decompressedData);

				if (gameData.playerID) {
					if (!this.world) return;
					this.world.currentPlayerID = gameData.playerID;
					const currentPlayer = gameData.players.find(player => {
						return player.entityID === gameData.playerID;
					});

					if (currentPlayer) {
						this.world.shouldRenderTutorial = currentPlayer.storyProgress === 0;
					}
					this.updateGameState(gameData);
					this.world.init();

					this.startGameLoop();
				} else {
					this.updateGameState(gameData);
				}
			};
		}, 2000);
	}

	public sendPing(): void {
		const startTime = Date.now();
		this.lastPingTime = startTime;
		this.world?.gameSocket?.send(JSON.stringify({ action: 'ping', time: startTime }));
	}

	async connectToGameServer(loginToken: string): Promise<WebSocket> {
		return new Promise((resolve, reject) => {
			const socket = new WebSocket(`${GAME_SERVER_ADDRESS}/?loginToken=${loginToken}`);
			socket.onopen = (): void => {
				this.login?.destroy();
				resolve(socket);
			};
			socket.onerror = (): void => {
				console.error('Error connecting to game server');
				const reconnectInterval = setInterval(() => {
					this.startGame(loginToken, reconnectInterval);
				}, 5000);
				reject();
			};
			socket.onclose = (): void => {
				console.error('Connection to game server closed');
				reject();
			};
		});
	}

	private startGameLoop(): void {
		if (!this.world) return;
		this.animationFrame = requestAnimationFrame(() => this.gameLoop());
		this.pingInterval = setInterval(() => {
			this.sendPing();
		}, 1000);
	}

	private gameLoop(): void {
		const now = Date.now();
		const deltaTime = now - this.lastFrameTime;

		// Only run the update if enough time has passed
		if (deltaTime >= this.frameInterval) {
			this.world?.update();
			this.lastFrameTime = now - (deltaTime % this.frameInterval); // Adjust for any time "overhang"
		}

		// Schedule the next frame
		this.animationFrame = requestAnimationFrame(() => this.gameLoop());
	}

	private async connectToLoginServer(): Promise<void> {
		const loginPromise = new Promise(resolve => {
			const socket = new WebSocket(LOGIN_SERVER_ADDRESS);

			// Listen for successful connection
			socket.onopen = (): void => {
				resolve(socket);
			};
		});

		this.loginSocket = (await loginPromise) as WebSocket;
		new LoginServerEvents(this);
		this.login = new Login(this);
		this.login.init(this.loginSocket);
	}

	private updateGameState(gameData: GameState): void {
		if (!this.world) return;
		const { players, npcs, chatMessages, onlinePlayers } = gameData;

		// remove players that are no longer online
		this.world.players = this.world.players.filter(player => onlinePlayers.includes(player.entityID));

		players.forEach(player => {
			const matchingPlayer = this.world?.players.find(p => p.entityID === player.entityID);
			if (!matchingPlayer) {
				if (!this.world) return;
				const newPlayer = new Player(this.world, player.entityID);
				newPlayer.update(player);
				this.world?.players.push(newPlayer);

				setTimeout((): void => {
					newPlayer.loadAssets();
				}, 1000);

				return;
			}

			matchingPlayer.update(player);
		});

		if (!this.world) return;

		// Create a map of existing NPCs by entityID (as a string) for fast lookup
		const npcMap = new Map<string, Npc>();
		this.world.npcs.forEach(existingNpc => {
			npcMap.set(existingNpc.entityID, existingNpc);
		});

		npcs.forEach(npc => {
			const matchingNpc = npcMap.get(npc.entityID);

			if (matchingNpc) {
				// Update existing NPC
				matchingNpc.update(npc);
			} else {
				if (!this.world) return;
				// Create a new NPC if it doesn't exist and add it to the world
				const newNpc = new Npc(this.world, npc.entityID, npc.entityIndex);
				newNpc.update(npc);
				this.world.npcs.push(newNpc);
			}
		});

		this.world.chatMessages = chatMessages.filter(chatMessage => {
			// time sent after login
			if (chatMessage.timeSent < this.loginTime) {
				return false;
			}

			const currentPlayer = this.world?.players.find(player => player.entityID === this.world?.currentPlayerID);

			if (chatMessage.senderName === currentPlayer?.name || chatMessage.isGlobal === true) {
				return true;
			}
		});

		this.world.tickUpdateTime = Date.now();
		this.world.talkEvents = gameData.tickTalkEvents;
		this.world.soundEvents = gameData.tickSoundEvents;

		this.world.battleEvents = gameData.tickBattleEvents;
		this.world.battleTurnEvents = gameData.tickBattleTurnEvents;
		this.world.wildPokemonEvents = gameData.tickWildPokemonEvents;
		this.world.wildBattleTurnEvents = gameData.tickWildBattleTurnEvents;
	}
}
