declare const LOGIN_SERVER_ADDRESS: string;
declare const UPDATE_SERVER_ADDRESS: string;
declare const GAME_SERVER_ADDRESS: string;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

type PokemonMove = {
	id: number;
	name: string;
	type: string;
	category: number;
	power: number | null;
	accuracy: number | null;
	pp: number;
	effect: string;
};

type BattleActionType = 'FIGHT' | 'ITEM' | 'POKEMON' | 'RUN';

type Pokemon = {
	id: number;
	hp: number;
	maxHp: number;
	level: number;
	moves: number[];
};

type Item = {
	itemID: number;
	uniqueID: string;
	name: string;
	examine: string;
	isEdible: boolean;
	spriteName: string;
	isStackable: boolean;
	amount: number;
	value: number;
	worldX: number | null;
	worldY: number | null;
};

type PokemonData = {
	pokemonIndex: number;
	name: string;
	sprite: string;
	type1: number;
	type2: number;
	hp: number;
	attack: number;
	defense: number;
	specialAttack: number;
	specialDefense: number;
	speed: number;
};

type NpcData = {
	entityIndex: number;
	name: string;
	tpye: number;
	spriteName: string;
	isTalkable: boolean;
}


type NpcInterface = {
	entityID: string;
	entityIndex: number;
	worldX: number;
	worldY: number;
	nextTileDirection: Direction | null;
	facingDirection: Direction;
	name: string;
	currentChunk: number;
	currentPath: {
		x: number;
		y: number;
	}[] = [];
	party: Pokemon[];
};

interface Steps {
	[stepNumber: string]: Step;
}

interface Step {
	description: string;
}

interface PlayerInterface {
	entityID: string;
	entityIndex: number;
	worldX: number;
	worldY: number;
	nextTileDirection: Direction | null;
	facingDirection: Direction;
	name: string;
	currentChunk: number;
	currentPath: {
		x: number;
		y: number;
	}[] = [];
	party: Pokemon[];
	inventory: number[];
	inventoryAmounts: number[];
	storyProgress: number;
}

type GameState = {
	playerID?: string;
	tickUpdateTime: number;
	players: PlayerInterface[];
	npcs: NpcInterface[];
	tickTalkEvents: TalkEvent[];
	tickSoundEvents: SoundEvent[];
	tickBattleEvents: BattleEvent[];
	tickBattleTurnEvents: BattleTurnEvent[];
	tickWildPokemonEvents: WildPokemonEvent[];
	tickWildBattleTurnEvents: WildBattleTurnEvent[];
	chatMessages: ChatMessage[];
	onlinePlayers: string[];
};


type WildBattleTurnEvent = {
	playerID: string;
	moveId: number;
	newHp: number;
	isPlayersMove: boolean;
	isAllPokemonsFainted: boolean;
	isBattleOver: boolean;
	isPlayerWinner: boolean;
	isRunSuccessful: boolean;
	itemUsedId: number;
	switchedPokemonIndex: number;
	effect: number;
	actionType: string;
	isCaught: boolean;
};

type ChatMessage = {
	senderName: string;
	timeSent: number;
	message: string;
	isGlobal: boolean;
	isChallenge?: boolean;
	challengerID?: string;
};

type SoundEvent = {
	soundName: string;
	isSfx: boolean;
	shouldInterrupt: boolean;
	entityID: string;
	isGlobal: boolean;
};

type TalkEvent = {
	talkerID: string;
	targetID: string;
	targetIndex: number;
};

type WildPokemonEvent = {
	entityID: string;
	wildPokemon: Pokemon;
};

type BattleEvent = {
	entity1ID: string;
	entity2ID: string;
};

type BattleTurnEvent = {
	playerID: string;
	targetID: string;
	moveId: number;
	isBattleOver?: boolean;
	winnerEntityID?: string;
};

interface DialogueStep {
	speaker: string;
	text: string;
	options?: DialogueOption[];
	onStepComplete?: () => void;
}

interface DialogueOption {
	optionText: string;
	optionAction: () => void;
}
