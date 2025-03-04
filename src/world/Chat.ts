import { canvas, canvas2d } from '../graphics/Canvas';
import Draw2D from '../graphics/Draw2D';
import World from './World';

export type TalkModal = {
	talkName: string;
	currentDialogue: {
		dialogueText: string;
		clickToContinueFunction: () => void;
	} | null;
	dialogueOptions: {
		optionText: string;
		optionFunction?: () => void;
	}[];
};

export default class Chat {
	private world: World;
	private currentChatMessage: string = '';
	public talkModal: TalkModal | null = null;
	private optionClickListeners: { [key: string]: () => void } = {};
	private chatWidth: number = 600;
	private chatHeight: number = 140;
	public mouseOverChallengeFromID: string | null = null;

	constructor(world: World) {
		this.world = world;
		this.initializeEventListeners();
	}

	private initializeEventListeners(): void {
		this.world.eventListenersManager.addCanvasEventListener('chat_keydown', 'keydown', (e: any) => {
			e.preventDefault();

			if (e.key === 'Enter') {
				if (this.currentChatMessage.trim() === '') {
					return;
				}

				if (this.currentChatMessage.trim().startsWith('::')) {
					if (this.currentChatMessage.trim() === '::debug') {
						this.world.showDebug = !this.world.showDebug;
						this.currentChatMessage = '';
						return;
					}
				}

				this.world.actions?.sendChatMessage(this.world.currentPlayerID, this.currentChatMessage.trim(), true);
				this.currentChatMessage = '';
			}

			if (e.key === 'Backspace') {
				this.currentChatMessage = this.currentChatMessage.slice(0, -1);
			}

			if (e.key.length === 1) {
				if (this.currentChatMessage.length < 35) {
					this.currentChatMessage += e.key;
				}
			}
		});
	}

	public drawChat(): void {
		if (this.talkModal) {
			this.drawTalkModal(this.talkModal);
			return;
		}

		canvas2d.fillStyle = 'rgba(0, 0, 0, 0.5)';
		canvas2d.fillRect(5, canvas.height - 140 - 5, this.chatWidth, this.chatHeight);
		canvas2d.strokeStyle = 'white';

		canvas2d.fillStyle = 'white';
		canvas2d.font = '16px Pkmn';
		canvas2d.textAlign = 'left';

		this.world.chatMessages
			.sort((a, b) => a.timeSent - b.timeSent)
			.slice(-5)
			.forEach((chatMessage, index) => {
				const senderName =
					chatMessage.senderName !== '' && chatMessage.isGlobal === true ? chatMessage.senderName + ': ' : '';

				const senderNameWidth = canvas2d.measureText(senderName).width;
				const messageYPosition = canvas.height - 140 - 5 + 20 + index * 20;

				// Define the area where the sender name and message will be drawn
				const senderNameXPosition = 15;
				const senderNameWidthEnd = senderNameXPosition + senderNameWidth;

				const isMouseOverChallengeText =
					this.world.mouseScreenX > senderNameXPosition &&
					this.world.mouseScreenX < senderNameXPosition + this.chatWidth &&
					this.world.mouseScreenY > messageYPosition - 20 &&
					this.world.mouseScreenY < messageYPosition;

				if (isMouseOverChallengeText && chatMessage.challengerID) {
					this.mouseOverChallengeFromID = chatMessage.challengerID;
				} else {
					this.mouseOverChallengeFromID = null;
				}

				// Draw sender name
				canvas2d.fillText(senderName, senderNameXPosition, messageYPosition);

				// Set color for chat message based on challenge condition
				canvas2d.fillStyle = chatMessage.isChallenge
					? isMouseOverChallengeText
						? 'yellow'
						: 'purple'
					: 'white';

				// Draw the message text next to sender name
				canvas2d.fillText(chatMessage.message, senderNameWidthEnd, messageYPosition);
			});

		// draw chat input

		const currentPlayer = this.world.players.find(player => player.entityID === this.world.currentPlayerID);
		if (!currentPlayer) {
			return;
		}

		canvas2d.strokeStyle = 'white';

		canvas2d.beginPath();
		canvas2d.moveTo(5, canvas.height - 5 - 30);
		canvas2d.lineTo(600, canvas.height - 5 - 30);
		canvas2d.stroke();

		canvas2d.fillStyle = 'white';
		canvas2d.textAlign = 'left';
		canvas2d.fillText(currentPlayer.name + ': ' + this.currentChatMessage, 15, canvas.height - 5 - 10);
	}

	private drawTalkModal(talkModal: TalkModal): void {
		canvas2d.font = '20px Pkmn';

		canvas2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
		canvas2d.fillRect(5, canvas.height - 140 - 5, this.chatWidth, this.chatHeight);

		if (talkModal.dialogueOptions.length === 0) {
			if (talkModal.currentDialogue === null) {
				return;
			}

			const npcNameX = 312;
			const npcNameY = canvas.height - 140 - 5 + 30;

			Draw2D.drawText(npcNameX, npcNameY, talkModal.talkName, {
				color: 'white',
				font: '20px Pkmn',
				align: 'center',
			});

			const dialogueTextX = 312;
			const dialogueTextY = canvas.height - 140 - 5 + 60;

			Draw2D.drawText(dialogueTextX, dialogueTextY, talkModal.currentDialogue.dialogueText, {
				color: 'white',
				font: '18px Pkmn',
				align: 'center',
				clip: { maxWidth: 400 },
			});

			// Draw click to continue text
			const clickToContinueText = 'Click to continue...';
			const clickToContinueWidth = clickToContinueText.length * 10;
			const clickToContinueHeight = 20;
			const clickToContinueX = 312;
			const clickToContinueY = canvas.height - 140 - 5 + 130;

			const isMouseOverClickToContinue =
				this.world.mouseScreenX > clickToContinueX - clickToContinueWidth &&
				this.world.mouseScreenX < clickToContinueX + clickToContinueWidth &&
				this.world.mouseScreenY > clickToContinueY - clickToContinueHeight &&
				this.world.mouseScreenY < clickToContinueY + clickToContinueHeight / 2;

			if (isMouseOverClickToContinue) {
				canvas2d.fillStyle = 'yellow'; // Highlighted color
			} else {
				canvas2d.fillStyle = 'white';
			}

			Draw2D.drawText(clickToContinueX, clickToContinueY, clickToContinueText, {
				color: isMouseOverClickToContinue ? 'yellow' : 'white',
				font: '20px Pkmn',
				align: 'center',
			});

			if (this.optionClickListeners['clickToContinueFunction'] === undefined) {
				this.optionClickListeners['clickToContinueFunction'] =
					talkModal.currentDialogue.clickToContinueFunction;
				this.world.eventListenersManager.addCanvasEventListener('chat_click_to_continue', 'click', () => {
					if (
						this.world.mouseScreenX > clickToContinueX - clickToContinueWidth &&
						this.world.mouseScreenX < clickToContinueX + clickToContinueWidth &&
						this.world.mouseScreenY > clickToContinueY - clickToContinueHeight &&
						this.world.mouseScreenY < clickToContinueY + clickToContinueHeight / 2
					) {
						if (this.optionClickListeners['clickToContinueFunction']) {
							this.optionClickListeners['clickToContinueFunction']();
						}
						this.optionClickListeners = {};
					}
				});
			}
		} else {
			const selectAnOptionX = 312;
			const selectAnOptionY = canvas.height - 140 - 5 + 30;

			Draw2D.drawText(selectAnOptionX, selectAnOptionY, 'Select an option', {
				color: 'white',
				font: '22px Pkmn',
				align: 'center',
			});

			// draw text options
			talkModal.dialogueOptions.forEach((option, index) => {
				const optionX = 312;
				const optionY = canvas.height - 140 - 5 + 60 + index * 20;

				const optionWidth = option.optionText.length * 10;
				const optionHeight = 15;

				const isMouseOverOption =
					this.world.mouseScreenX > optionX - optionWidth &&
					this.world.mouseScreenX < optionX + optionWidth &&
					this.world.mouseScreenY + 10 > optionY &&
					this.world.mouseScreenY + 10 < optionY + optionHeight;

				if (isMouseOverOption && option.optionFunction !== null) {
					canvas2d.fillStyle = 'yellow'; // Highlighted color
				} else {
					canvas2d.fillStyle = 'white';
				}

				Draw2D.drawText(optionX, optionY, option.optionText, {
					color: isMouseOverOption ? 'yellow' : 'white',
					font: '20px Pkmn',
					align: 'center',
					clip: { maxWidth: 400 },
				});

				if (this.optionClickListeners[option.optionText] === undefined) {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					this.optionClickListeners[option.optionText] = option.optionFunction || ((): void => {});

					this.world.eventListenersManager.addCanvasEventListener(
						'chat_dialogue_option' + index,
						'click',
						(): void => {
							if (
								this.world.mouseScreenX > optionX - optionWidth &&
								this.world.mouseScreenX < optionX + optionWidth &&
								this.world.mouseScreenY + 10 > optionY &&
								this.world.mouseScreenY + 10 < optionY + optionHeight
							) {
								this.optionClickListeners[option.optionText]();
								// Remove all event listeners
								talkModal.dialogueOptions.forEach((): void => {
									// eslint-disable-next-line @typescript-eslint/no-empty-function
									canvas2d.canvas.removeEventListener('click', () => {});
								});
							}
						},
					);
				}
			});
		}
	}

	public isMouseOverTalkModal(): boolean {
		if (!this.talkModal) {
			return false;
		}
		if (
			this.world.mouseScreenX >= 5 &&
			this.world.mouseScreenX <= this.chatWidth + 5 &&
			this.world.mouseScreenY >= canvas.height - this.chatHeight - 5 &&
			this.world.mouseScreenY <= canvas.height - 5
		) {
			return true;
		}

		return false;
	}
}
