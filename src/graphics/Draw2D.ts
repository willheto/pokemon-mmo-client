import World from '../world/World';
import { canvas, canvas2d } from './Canvas';

export default class Draw2D {
	public static drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
		canvas2d.drawImage(image, x, y, width, height);
	}

	public static drawText(
		x: number,
		y: number,
		text: string,
		formatting: {
			color?: string;
			font?: string;
			align?: 'left' | 'center' | 'right';
			clip?: {
				maxWidth: number;
			};
			stroke?: {
				color: string;
				width: number;
			};
		},
	): void {
		const { color = 'black', font = '25px Pkmn', clip, stroke } = formatting;

		canvas2d.font = font;
		canvas2d.fillStyle = color;
		canvas2d.textAlign = formatting.align || 'left';

		// Set stroke settings if provided
		if (stroke) {
			canvas2d.lineWidth = stroke.width;
			canvas2d.strokeStyle = stroke.color;
		}

		// Split text into words for word-wrapping
		const words = text.split(' ');
		let line = '';
		const lineHeight = 20; // Adjust line height as needed
		let currentY = y;

		words.forEach((word, index) => {
			const testLine = line + word + ' ';
			const testWidth = canvas2d.measureText(testLine).width;

			if (clip && testWidth > clip.maxWidth && line !== '') {
				// Draw current line with optional stroke and fill, then move to the next line
				if (stroke) {
					canvas2d.strokeText(line, x, currentY);
				}
				canvas2d.fillText(line, x, currentY);

				line = word + ' ';
				currentY += lineHeight;
			} else {
				line = testLine;
			}

			// Draw the last line if we're at the end of the words
			if (index === words.length - 1) {
				if (stroke) {
					canvas2d.strokeText(line, x, currentY);
				}
				canvas2d.fillText(line, x, currentY);
			}
		});
		canvas2d.textAlign = 'left'; // Reset text alignment
	}

	public static async showProgress(progress: number, message: string): Promise<void> {
		const width: number = canvas2d.canvas.width;
		const height: number = canvas2d.canvas.height;

		const y: number = height / 2 - 18;

		// draw full progress bar
		canvas2d.fillStyle = 'rgb(140, 17, 17)';
		canvas2d.rect(((width / 2) | 0) - 152, y, 304, 34);
		canvas2d.fillRect(((width / 2) | 0) - 150, y + 2, progress * 3, 30);

		// cover up progress bar
		canvas2d.fillStyle = 'black';
		canvas2d.fillRect(((width / 2) | 0) - 150 + progress * 3, y + 2, 300 - progress * 3, 30);

		// draw text
		canvas2d.font = '14px Pkmn';
		canvas2d.textAlign = 'center';
		canvas2d.fillStyle = 'white';
		canvas2d.fillText(message, (width / 2) | 0, y + 22);
	}

	public static async fillCanvas(color: string): Promise<void> {
		canvas2d.fillStyle = color;
		canvas2d.fillRect(0, 0, canvas2d.canvas.width, canvas2d.canvas.height);
	}

	public static drawModal(world: World): void {
		if (!world.modalObject) return;
		const { modalX, modalY, modalOptions } = world.modalObject;

		const getLongestOptionsLengthPX = (): number => {
			let longestOptionLength = 0;
			modalOptions.forEach(option => {
				const optionLength = canvas2d.measureText(option.optionText).width;
				const optionLength2 = canvas2d.measureText(option.optionSecondaryText?.text || '').width;
				const totalOptionLength = optionLength + optionLength2;
				if (totalOptionLength > longestOptionLength) {
					longestOptionLength = totalOptionLength;
				}
			});
			return longestOptionLength;
		};
		const modalWidth = getLongestOptionsLengthPX() + 10 > 200 ? getLongestOptionsLengthPX() + 10 : 200;
		const modalHeight = modalOptions.length * 20;

		world.modalObject.modalWidth = modalWidth;
		world.modalObject.modalHeight = modalHeight;

		// check if modal x + width is out of bounds
		if (modalX + modalWidth > canvas.width) {
			world.modalObject.modalX = canvas.width - modalWidth;
		}

		// Draw the border (outer rectangle)
		canvas2d.fillStyle = '#5d5447'; // Modal background color
		canvas2d.strokeStyle = 'black'; // Border color
		canvas2d.lineWidth = 2; // Border thickness

		// Draw filled rectangle for modal content
		canvas2d.fillRect(modalX, modalY, modalWidth, modalHeight);

		// Draw the border around the modal (stroke only)
		canvas2d.strokeRect(modalX, modalY, modalWidth, modalHeight);

		// Set text properties
		canvas2d.font = '20px Pkmn';
		canvas2d.textAlign = 'left';
		canvas2d.textBaseline = 'top';

		// Draw the options
		modalOptions.forEach((option, index) => {
			const optionX = modalX + 2;
			const optionY = modalY + index * 20;

			const optionHeight = 15;

			const isMouseOverOption =
				world.mouseScreenX > optionX &&
				world.mouseScreenX < optionX + modalWidth &&
				world.mouseScreenY > optionY &&
				world.mouseScreenY < optionY + optionHeight;

			if (isMouseOverOption && option.optionFunction !== null) {
				canvas2d.fillStyle = 'yellow'; // Highlighted color
			} else {
				canvas2d.fillStyle = 'white'; // Default color
			}

			canvas2d.fillText(option.optionText, optionX, optionY);

			if (option.optionSecondaryText) {
				const optionTextWidth = canvas2d.measureText(option.optionText).width;

				canvas2d.fillStyle = option.optionSecondaryText.color;
				canvas2d.fillText(option.optionSecondaryText.text, optionX + optionTextWidth, optionY);
			}
		});

		// Check if the mouse clicks on an option
		if (world.mouseDown) {
			modalOptions.forEach((option, index) => {
				const optionX = modalX + 2;
				const optionY = modalY + index * 20;

				const optionHeight = 15;

				const isMouseOverOption =
					world.mouseScreenX > optionX &&
					world.mouseScreenX < optionX + modalWidth &&
					world.mouseScreenY > optionY &&
					world.mouseScreenY < optionY + optionHeight;

				if (isMouseOverOption && option.optionFunction !== null) {
					option.optionFunction();

					world.modalObject = null;
					world.modalJustClosed = true;
					setTimeout(() => {
						world.modalJustClosed = false;
					}, 100);
				}
			});
		}

		// Check if the mouse leaves the modal and remove it
		if (
			world.mouseScreenX < modalX - 10 ||
			world.mouseScreenX > modalX + modalWidth + 10 ||
			world.mouseScreenY < modalY - 10 ||
			world.mouseScreenY > modalY + modalHeight + 10
		) {
			world.modalObject = null;
		}

		canvas2d.textBaseline = 'alphabetic';
	}
}
