import World from '../world/World';

export default abstract class Interaction {
	protected world: World;

	protected npcName: string = '';
	protected targetID: string;
	constructor(world: World, targetID: string, npcName: string) {
		this.world = world;
		this.targetID = targetID;
		this.npcName = npcName;
	}

	abstract startDialogue(): void;

	protected endDialogue(): void {
		this.world.hud.chat.talkModal = null;
	}

	protected async npcSays(text: string): Promise<void> {
		return new Promise(resolve => {
			this.world.hud.chat.talkModal = {
				talkName: this.npcName,
				currentDialogue: {
					dialogueText: text,
					clickToContinueFunction: (): void => {
						if (!this.world.hud.chat.talkModal) {
							throw new Error('Hud not found in world.client');
						}
						resolve();
					},
				},
				dialogueOptions: [],
			};
		});
	}

	protected async playerSays(text: string): Promise<void> {
		return new Promise(resolve => {
			this.world.hud.chat.talkModal = {
				talkName: 'You',
				currentDialogue: {
					dialogueText: text,
					clickToContinueFunction: (): void => {
						if (!this.world.hud.chat.talkModal) {
							throw new Error('Hud not found in world.client');
						}
						resolve();
					},
				},
				dialogueOptions: [],
			};
		});
	}

	protected async playerChoice(options: { optionText: string }[]): Promise<number> {
		return new Promise(resolve => {
			this.world.hud.chat.talkModal = {
				talkName: 'Choose an option',
				currentDialogue: null,
				dialogueOptions: options.map(option => ({
					optionText: option.optionText,
					optionFunction: (): void => {
						resolve(options.indexOf(option));
					},
				})),
			};
		});
	}

	protected npcBattlesPlayer(): void {
		this.world.actions?.forceNpcBattlePlayer(this.world.currentPlayerID, this.targetID);
	}
}
