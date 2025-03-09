import Cache from '../cache';

export default class AudioManager {
	public currentSong: HTMLAudioElement | null = null;
	public isLoadingAudioFiles: boolean = true;

	constructor() {
		//
	}

	public async playMusic(fileName: string): Promise<void> {
		const audioFile = await Cache.getObjectURLByAssetName(fileName);

		if (audioFile === null) {
			console.error('Audio file not found:', fileName);
			return;
		}

		this.currentSong?.pause();

		const audio = new Audio(audioFile);
		audio.volume = 0.1;
		audio.loop = true;
		audio.play();

		this.currentSong = audio;
	}

	public async playSfx(fileName: string, pauseMusic: boolean = false): Promise<void> {
		const audioFile = await Cache.getObjectURLByAssetName(fileName);

		if (audioFile === null) {
			console.error('Audio file not found:', fileName);
			return;
		}
		const audioLength = await this.getAudioLength(fileName);

		if (pauseMusic) {
			// briefly silence the music
			this.currentSong?.pause();

			// resume the music
			setTimeout(() => {
				this.currentSong?.play();
			}, audioLength);
		}

		const audio = new Audio(audioFile);
		audio.volume = 0.1;
		audio.play();
	}

	public async getAudioLength(fileName: string): Promise<number> {
		const audioFile = await Cache.getObjectURLByAssetName(fileName);

		if (audioFile === null) {
			console.error('Audio file not found:', fileName);
			return 0;
		}

		return new Promise((resolve, reject) => {
			const audio = new Audio(audioFile);

			// Event listener to wait for the metadata to load
			audio.addEventListener('loadedmetadata', () => {
				// Resolve with the audio duration in milliseconds
				resolve(audio.duration * 1000);
			});

			// Error handling in case the audio file cannot be loaded
			audio.addEventListener('error', err => {
				console.error('Error loading audio file:', err);
				reject(0);
			});
		});
	}

	public stopMusic(): void {
		this.currentSong?.pause();
	}
}
