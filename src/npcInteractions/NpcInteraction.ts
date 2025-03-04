import World from '../world/World';
import Rival from './Rival';

import Duke from './Rival';

export default class NpcInteraction {
	private world: World;

	constructor(world: World) {
		this.world = world;
	}

	public startNpcInteraction(npcIndex: number, targetID: string): void {
		if (npcIndex === 1) {
			new Rival(this.world, targetID);
		} else {
			this.world.actions?.sendChatMessage(
				this.world.currentPlayerID,
				"He doesn't seem to want to talk to you.",
				false,
			);
		}
	}
}
