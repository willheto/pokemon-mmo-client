import { canvas2d } from '../graphics/Canvas';
import World from './World';

export default class Tutorial {
	private world: World;
	private tutorialBackgroundImage: HTMLImageElement | null = null;
	private oakImage: HTMLImageElement | null = null;
	private continueButton: HTMLImageElement | null = null;
	private shouldDisplayContinueButton: boolean = true;
	private continueButtonFlashingCounter: number = 0;

	private displayedTextRow1: string = 'Hello! Sorry to keep you waiting!';
	private displayedTextRow2: string = 'Click here to continue...';
	private step: number = 0;

	constructor(world: World) {
		this.world = world;
		this.loadAssets();
		this.world.client.audioManager.playMusic('route_30.mp3');
	}

	public update(): void {
		this.continueButtonFlashingCounter++;
		if (this.step === 0) {
			this.displayedTextRow1 = 'Hello! Sorry to keep you waiting!';
			this.displayedTextRow2 = 'Click on the flashing button to continue...';
		}

		if (this.step === 1) {
			this.displayedTextRow1 = 'Welcome to the world of Pokemon online!';
			this.displayedTextRow2 = '';
		}

		if (this.step === 2) {
			this.displayedTextRow1 = 'My name is Oak!';
			this.displayedTextRow2 = 'People call me the Pokemon Prof.';
		}

		if (this.step === 3) {
			this.displayedTextRow1 = 'In this world, some things are different ';
			this.displayedTextRow2 = 'than what you are used to.';
		}

		if (this.step === 4) {
			this.displayedTextRow1 = 'For example, you not alone in this world.';
			this.displayedTextRow2 = 'There are other players around you.';
		}

		if (this.step === 5) {
			this.displayedTextRow1 = 'You can see them and interact with them.';
			this.displayedTextRow2 = '';
		}

		if (this.step === 6) {
			this.displayedTextRow1 = 'Or battle them!';
			this.displayedTextRow2 = '';
		}

		if (this.step === 7) {
			this.displayedTextRow1 = "Also, as you've already learned,";
			this.displayedTextRow2 = 'You interact with the world using the mouse.';
		}

		if (this.step === 8) {
			this.displayedTextRow1 = "Also, as you've already learned,";
			this.displayedTextRow2 = 'You interact with the world using the mouse.';
		}
		if (this.step === 7) {
			this.displayedTextRow1 = 'But no more talking for now.';
			this.displayedTextRow2 = "Your journey awaits! Let's go!";
		}

		if (this.step === 8) {
			this.world.shouldRenderTutorial = false;
			this.world.client.audioManager.stopMusic();
			this.world.client.audioManager.playMusic('new_bark_town.mp3');
			this.world.actions?.updateStoryProgress(this.world.currentPlayerID, 1);
		}
	}

	public draw() {
		if (!this.tutorialBackgroundImage) return;
		canvas2d.drawImage(this.tutorialBackgroundImage, 0, 0, 1000, 600);
		// draw oak in th emiddle of the canvas
		if (this.oakImage) {
			canvas2d.drawImage(this.oakImage, canvas2d.canvas.width / 2 - 100, 100, 200, 200);
		}

		if (this.displayedTextRow1 !== '') {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(this.displayedTextRow1, 45, 485);
		}

		if (this.displayedTextRow2 !== '') {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(this.displayedTextRow2, 45, 545);
		}

		if (this.shouldDisplayContinueButton && this.continueButton) {
			if (this.continueButtonFlashingCounter % 60 < 30) {
				canvas2d.drawImage(this.continueButton, 890, 570, 40, 30);
			}
			if (this.isMouseOverContinueButton()) {
				// draw a rectangle around the button
				canvas2d.strokeStyle = 'black';
				canvas2d.lineWidth = 2;

				canvas2d.strokeRect(890, 570, 40, 30);
			}
		}
	}

	private async loadAssets(): Promise<void> {
		const sprite = await this.world.spriteCache.getSprite('blank_battle_screen.png');
		if (sprite) {
			this.tutorialBackgroundImage = sprite;
		}

		const oakSprite = await this.world.spriteCache.getSprite('oak.png');
		if (oakSprite) {
			this.oakImage = oakSprite;
		}

		const continueButton = await this.world.spriteCache.getSprite('continue_button.png');
		if (continueButton) {
			this.continueButton = continueButton;
		}
	}

	private isMouseOverContinueButton(): boolean {
		return (
			this.continueButton &&
			this.world.mouseScreenX > 890 &&
			this.world.mouseScreenX < 930 &&
			this.world.mouseScreenY > 570 &&
			this.world.mouseScreenY < 600
		);
	}

	public handleClick(): void {
		if (this.isMouseOverContinueButton()) {
			this.step++;
		}
	}
}
