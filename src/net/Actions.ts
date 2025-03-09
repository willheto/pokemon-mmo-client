import World from '../world/World';

export class Actions {
	private gameSocket: WebSocket;
	private world: World;

	constructor(gameSocket: WebSocket, world: World) {
		this.gameSocket = gameSocket;
		this.world = world;
	}

	public movePlayer(playerID: string, x: number, y: number): void {
		this.gameSocket.send(
			JSON.stringify({
				action: 'playerMove',
				playerID: playerID,
				data: {
					x: x,
					y: y,
				},
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
	}

	public moveAndTalk(playerID: string, entityID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'playerTalkMove',
				playerID: playerID,
				data: {
					entityID: entityID,
				},
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
	}

	public moveAndAttack(playerID: string, entityID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'playerAttackMove',
				playerID: playerID,
				data: {
					entityID: entityID,
				},
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
		this.world.modalObject = null;
	}

	public sendChatMessage(playerID: string, message: string, isGlobal: boolean): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'chatMessage',
				playerID: playerID,
				data: {
					message: message,
					timeSent: Date.now(),
					isGlobal: isGlobal,
				},
			}),
		);
	}

	public moveAndTakeItem(playerID: string, itemID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'playerTakeMove',
				playerID: playerID,
				data: {
					uniqueItemID: itemID,
				},
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
	}

	public questProgressUpdate(playerID: string, questID: number, progress: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'questProgressUpdate',
				playerID: playerID,
				data: {
					questID: questID,
					progress: progress,
				},
			}),
		);
	}

	public removeItemFromInventory(playerID: string, itemID: number, amount: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'removeItemFromInventory',
				playerID: playerID,
				itemID: itemID,
				amount: amount,
			}),
		);
	}

	public changeAttackStyle(playerID: string, attackStyle: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'changeAttackStyle',
				playerID: playerID,
				data: {
					attackStyle: attackStyle,
				},
			}),
		);
	}

	public useItem(playerID: string, itemID: number, targetID: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'useItem',
				playerID: playerID,
				data: {
					itemID: itemID,
					targetID: targetID,
				},
			}),
		);
	}

	public dropItem(playerID: string, inventoryIndex: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'dropItem',
				playerID: playerID,
				data: {
					inventoryIndex: inventoryIndex,
				},
			}),
		);
	}

	public unwieldItem(playerID: string, inventoryIndex: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'unwieldItem',
				playerID: playerID,
				data: {
					inventoryIndex: inventoryIndex,
				},
			}),
		);
	}

	public wieldItem(playerID: string, inventoryIndex: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'wieldItem',
				playerID: playerID,
				data: {
					inventoryIndex: inventoryIndex,
				},
			}),
		);
	}

	public eatItem(playerID: string, inventoryIndex: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'eatItem',
				playerID: playerID,
				data: {
					inventoryIndex: inventoryIndex,
				},
			}),
		);
	}

	public logOut(playerID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'logOut',
				playerID: playerID,
			}),
		);
	}

	public forceNpcBattlePlayer(playerID: string, npcID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'forceNpcBattlePlayer',
				playerID: playerID,
				npcID: npcID,
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
	}

	public startBattle(playerID: string, targetID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'startBattle',
				playerID: playerID,
				targetID: targetID,
			}),
		);
		this.world.hud.chat.talkModal = null;
	}

	public challengePlayer(playerID: string, targetID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'challengePlayer',
				playerID: playerID,
				targetID: targetID,
			}),
		);
	}

	public buyItem(playerID: string, shopID: string, itemID: number, amount: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'buyItem',
				playerID: playerID,
				shopID: shopID,
				itemID: itemID,
				amount: amount,
			}),
		);
	}

	public sellItem(playerID: string, shopID: string, inventoryIndex: number, amount: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'sellItem',
				playerID: playerID,
				shopID: shopID,
				inventoryIndex: inventoryIndex,
				amount: amount,
			}),
		);
	}

	public moveAndTrade(playerID: string, entityID: string): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'tradeMove',
				playerID: playerID,
				entityID: entityID,
			}),
		);
		this.world.openShopID = null;
		this.world.hud.chat.talkModal = null;
		this.world.modalObject = null;
	}

	public castSpell(playerID: string, spellID: number, targetID: string | null): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'castSpell',
				playerID: playerID,
				spellID: spellID,
				targetID: targetID,
			}),
		);
	}

	public sendBattleAction(playerID: string, actionType: 'FIGHT' | 'ITEM' | 'POKEMON' | 'RUN', value?: number): void {
		const actionData: any = {
			action: 'battleAction',
			playerID: playerID,
			option: actionType,
		};

		// Add relevant data based on action type
		if (actionType === 'FIGHT' && value !== undefined) {
			actionData.moveId = value;
		} else if (actionType === 'ITEM' && value !== undefined) {
			actionData.itemId = value;
		} else if (actionType === 'POKEMON' && value !== undefined) {
			actionData.pokemonIndex = value;
		}

		this.gameSocket?.send(JSON.stringify(actionData));
	}

	public updateStoryProgress(playerID: string, progress: number): void {
		this.gameSocket?.send(
			JSON.stringify({
				action: 'updateStoryProgress',
				playerID: playerID,
				progress: progress,
			}),
		);
	}
}
