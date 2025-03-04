import { LOGIN_REQUEST, LOGIN_RESPONSE } from '../login/Login';
import Client from './Client';

export default class LoginServerEvents {
	public client: Client | null = null;
	public socket: WebSocket | null = null;

	constructor(client: Client) {
		this.client = client;
		this.socket = client.loginSocket;

		if (!this.socket) {
			throw new Error('Login socket is not connected');
		}

		this.socket.onmessage = (event): void => {
			const data = JSON.parse(event.data);

			if (data.response === LOGIN_RESPONSE.INVALID_CREDENTIALS) {
				if (client.login) {
					client.login.addErrorMessage('Invalid credentials');
				}
			}

			if (data.response === LOGIN_RESPONSE.LOGGED_INTO_THIS_WORLD) {
				if (client.login) {
					client.login.addErrorMessage('Already logged in');
				}
			}

			if (data.response === LOGIN_RESPONSE.LOGGED_INTO_ANOTHER_WORLD) {
				if (client.login) {
					client.login.addErrorMessage('Already logged in');
				}
			}

			if (data.response === LOGIN_RESPONSE.LOGIN_SUCCESS) {
				if (client.login) {
					client.login.errorMessage = '';
					client.startGame(data.loginToken);
					client.login.destroy();
					client.login = null;
				}
			}
			if (data.type === LOGIN_REQUEST.LOGOUT) {
				// TODO: Implement logout
			}
		};
	}
}
