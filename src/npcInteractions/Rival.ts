import World from '../world/World';
import Interaction from './Interaction';

export default class Rival extends Interaction {
	constructor(world: World, targetID: string) {
		super(world, targetID, 'Rival');
		this.startDialogue();
	}

	public async startDialogue(): Promise<void> {
		await this.npcSays('... You got a POKEMON at the LAB. What a waste. A wimp like you.');
		await this.npcSays("... Don't you get what I'm saying? Well, I too, have a good POKEMON.");
		await this.npcSays("I'll show you what I mean!");

		this.world.actions?.forceNpcBattlePlayer(this.world.currentPlayerID, this.targetID);

		this.endDialogue();
	}
}
