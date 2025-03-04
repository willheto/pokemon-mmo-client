import { canvas, canvas2d } from '../graphics/Canvas';
import Chat from './Chat';
import World from './World';

export default class Hud {
	private world: World;
	public chat: Chat;
	public hudOpen: boolean = true;
	public hudWidth: number = 270;
	public hudHeight: number = 365;
	public hudX: number = canvas.width - this.hudWidth - 5;
	public hudY: number = canvas.height - this.hudHeight - 5;

	constructor(world: World) {
		this.world = world;
		this.chat = new Chat(world);
	}

	public drawHud(): void {
		this.drawInventory();
		this.chat.drawChat();
	}

	public isMouseOverHud(): boolean {
		return (
			this.world.mouseScreenX >= this.hudX &&
			this.world.mouseScreenX <= this.hudX + this.hudWidth &&
			this.world.mouseScreenY >= this.hudY - 30 &&
			this.world.mouseScreenY <= this.hudY + this.hudHeight
		);
	}

	private drawInventory(): void {
		canvas2d.fillStyle = 'rgba(0, 0, 0, 0.5)';
		canvas2d.fillRect(this.hudX, this.hudY, this.hudWidth, this.hudHeight);

		canvas2d.fillStyle = 'white';
		canvas2d.font = '20px Pkmn';
		canvas2d.fillText('Items', this.hudX + 10, this.hudY + 20);
		// draw line

		// path color white
		canvas2d.strokeStyle = 'white';
		canvas2d.beginPath();
		canvas2d.moveTo(this.hudX + 10, this.hudY + 30);
		canvas2d.lineTo(this.hudX + this.hudWidth - 10, this.hudY + 30);
		canvas2d.stroke();

		const currentPlayer = this.world.players.find(player => player.entityID === this.world.currentPlayerID);

		if (!currentPlayer) {
			return;
		}

		const inventory = currentPlayer.inventory;

		// list inventory items. just name and x amount if more than 1
		inventory.forEach((itemID, index) => {
			const itemAmount = currentPlayer.inventoryAmounts[index];
			const item = this.world.itemsManager.getItemInfoById(itemID);

			if (!item) {
				return;
			}

			canvas2d.fillText(
				item.name + (itemAmount > 1 ? ' x' + itemAmount : ''),
				this.hudX + 10,
				this.hudY + 60 + index * 20,
			);
		});
	}

	public handleClick(): void {}
	public handleContextClick(): void {}
}
