import Client from '../client/Client';
import { canvas, canvas2d } from '../graphics/Canvas';
import Draw2D from '../graphics/Draw2D';

export const LOGIN_RESPONSE = {
	INVALID_CREDENTIALS: 3,
	LOGGED_INTO_THIS_WORLD: 4,
	LOGGED_INTO_ANOTHER_WORLD: 5,
	LOGIN_SUCCESS: 6,
};

export const LOGIN_REQUEST = {
	LOGIN: 1,
	LOGOUT: 2,
	RESET_WORLD: 3,
	COUNT_PLAYERS: 4,
	REGISTER: 5,
};

export default class Login {
	private client: Client;
	private loginDrawInterval: NodeJS.Timeout | null = null;
	private socket: WebSocket | null = null;
	private currentlyActiveScreen: 'title' | 'login' = 'title';

	public username: string = '';
	public password: string = '';
	private currentInput: 'username' | 'password' = 'username';
	private loginText = 'Enter your username & password.';
	public errorMessage: string = '';
	public handleKeyPressBound: (event: KeyboardEvent) => void;
	public handleMouseClickBound: (event: MouseEvent) => void;
	public indicatorCounter: number = 0;
	public indicator: string = '|';

	constructor(client: Client) {
		this.client = client;
		this.handleKeyPressBound = this.handleKeyPress.bind(this);
		this.handleMouseClickBound = this.handleMouseClick.bind(this);

		canvas.addEventListener('keydown', this.handleKeyPressBound);
		canvas.addEventListener('click', this.handleMouseClickBound);

		canvas.tabIndex = 0; // Make the canvas focusable
		canvas.focus(); // Focus the canvas to receive keyboard events
	}

	public addErrorMessage(message: string): void {
		this.errorMessage = message;
		this.loginText = message;
		this.drawLoginScreen(); // Redraw to reflect changes
	}

	async login(): Promise<void> {
		// Replace login text with loading text
		this.loginText = 'Connecting to server...';
		this.drawLoginScreen(); // Redraw to reflect changes

		this.socket?.send(
			JSON.stringify({
				world: 1,
				type: LOGIN_REQUEST.LOGIN,
				username: this.username,
				password: this.password,
			}),
		);
	}

	public destroy(): void {
		// Remove event listeners
		canvas.removeEventListener('keydown', this.handleKeyPressBound);
		canvas.removeEventListener('click', this.handleMouseClickBound);
		if (this.loginDrawInterval) {
			clearInterval(this.loginDrawInterval);
		}
	}

	public async init(socket: WebSocket): Promise<void> {
		this.socket = socket;

		this.drawLoginScreen();
		this.client.audioManager.playMusic('login_theme.mp3');

		this.loginDrawInterval = setInterval(() => {
			this.drawLoginScreen();
		}, 1000 / 30);
	}

	private drawLoginScreen(): void {
		canvas2d.clearRect(0, 0, canvas.width, canvas.height);
		canvas2d.fillStyle = 'black';
		canvas2d.fillRect(0, 0, canvas.width, canvas.height);

		if (this.currentlyActiveScreen === 'title') {
			Draw2D.drawText(canvas.width / 2, canvas.height / 2 - 120, 'Pokemon Online', {
				color: 'yellow',
				font: 'bold 14px Pkmn, sans-serif',
				align: 'center',
			});

			Draw2D.drawText(canvas.width / 2, canvas.height / 2 - 80, 'Login', {
				color: 'white',
				font: 'bold 14px Pkmn, sans-serif',
				align: 'center',
			});

			// draw border around login button
			canvas2d.strokeStyle = 'white';
			canvas2d.lineWidth = 2;
			canvas2d.strokeRect(canvas.width / 2 - 77, canvas.height / 2 - 104, 144, 40);
		} else if (this.currentlyActiveScreen === 'login') {
			Draw2D.drawText(canvas.width / 2, canvas.height / 2 - 150, this.loginText, {
				color: 'yellow',
				font: 'bold 13px Pkmn, sans-serif',
				align: 'center',
			});

			const drawIndicator = this.indicatorCounter > 10 ? true : false;
			this.indicatorCounter = this.indicatorCounter > 20 ? 0 : this.indicatorCounter + 1;

			Draw2D.drawText(
				canvas.width / 2 - 100,
				canvas.height / 2 - 110,
				'Username: ' +
					this.username +
					(drawIndicator && this.currentInput === 'username' ? this.indicator : ''),
				{
					color: 'white',
					font: 'bold 13px Pkmn, sans-serif',
				},
			);

			Draw2D.drawText(
				canvas.width / 2 - 97,
				canvas.height / 2 - 90,
				'Password: ' +
					'*'.repeat(this.password.length) +
					(drawIndicator && this.currentInput === 'password' ? this.indicator : ''),
				{
					color: 'white',
					font: 'bold 13px Pkmn, sans-serif',
				},
			);

			Draw2D.drawText(canvas.width / 2 - 77, canvas.height / 2 - 45, 'Login', {
				color: 'white',
				font: 'bold 13px Pkmn, sans-serif',
				align: 'center',
			});

			// draw border around login button
			canvas2d.strokeStyle = 'white';
			canvas2d.lineWidth = 2;
			canvas2d.strokeRect(canvas.width / 2 - 70 - 80, canvas.height / 2 - 70, 142, 40);

			Draw2D.drawText(canvas.width / 2 + 85, canvas.height / 2 - 45, 'Cancel', {
				color: 'white',
				font: 'bold 13px Pkmn, sans-serif',
				align: 'center',
			});

			// draw border around cancel button
			canvas2d.strokeStyle = 'white';
			canvas2d.lineWidth = 2;
			canvas2d.strokeRect(canvas.width / 2 - 70 + 80, canvas.height / 2 - 70, 142, 40);
		}
	}

	private handleKeyPress(event: KeyboardEvent): void {
		if (this.currentlyActiveScreen === 'title') return;
		if (event.key === 'Tab' || event.key === 'Enter') {
			// Toggle between username and password input
			this.currentInput = this.currentInput === 'username' ? 'password' : 'username';
			event.preventDefault(); // Prevent the default tab behavior
			this.drawLoginScreen(); // Redraw to reflect focus change
		} else if (event.key === 'Backspace') {
			// Handle backspace
			if (this.currentInput === 'username') {
				this.username = this.username.slice(0, -1);
			} else {
				this.password = this.password.slice(0, -1);
			}
			this.drawLoginScreen(); // Redraw to reflect changes
		} else if (event.key.length === 1) {
			// Handle character input
			if (this.currentInput === 'username') {
				this.username += event.key;
			} else {
				this.password += event.key;
			}
			this.drawLoginScreen(); // Redraw to reflect changes
		}
	}

	private handleMouseClick(event: MouseEvent): void {
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		if (this.currentlyActiveScreen === 'title') {
			if (
				x >= canvas.width / 2 - 80 &&
				x <= canvas.width / 2 + 70 &&
				y >= canvas.height / 2 - 104 &&
				y <= canvas.height / 2 - 64
			) {
				this.client.audioManager.playSfx('click.ogg');
				this.currentlyActiveScreen = 'login';
			}
		} else if (this.currentlyActiveScreen === 'login') {
			if (x >= 509 && x <= 649 && y >= 279 && y <= 318) {
				this.currentlyActiveScreen = 'title';
				this.drawLoginScreen();
				this.client.audioManager.playSfx('click.ogg');
			} else if (x >= 349 && x <= 489 && y >= 279 && y <= 317) {
				this.login();
				this.drawLoginScreen();
				this.client.audioManager.playSfx('click.ogg');
			}
		}
	}
}
