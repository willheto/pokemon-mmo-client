import Cache from '../cache';

export default class AudioManager {
	public audioFiles: {
		audio: HTMLAudioElement;
		name: string;
	}[] = [];

	public currentSong: string = '';
	public isLoadingAudioFiles: boolean = true;

	constructor() {
		//
	}

	public async loadAudio(): Promise<void> {
		this.isLoadingAudioFiles = true;

		const allWavFiles = await Cache.getAllWavFileURLs();

		// Load all Audio instances in parallel
		this.audioFiles = allWavFiles.map(wavFile => ({
			audio: new Audio(wavFile.url),
			name: wavFile.name,
		}));

		this.isLoadingAudioFiles = false;
	}

	public playMusic(fileName: string): void {
		const audio = this.audioFiles.find(audio => audio.name === fileName);

		this.audioFiles.forEach(audio => {
			audio.audio.pause();
			audio.audio.currentTime = 0;
		});

		if (!audio) return;
		audio.audio.volume = 0.1;
		audio.audio.loop = true;

		audio.audio.play();
		this.currentSong = fileName;
	}

	public playSfx(fileName: string, pauseMusic: boolean = false): void {
		const audio = this.audioFiles.find(audio => audio.name.toLowerCase() === fileName.toLowerCase());
		if (!audio) {
			console.error('Audio file not found:', fileName);
			return;
		}
		const audioLength = audio.audio.duration * 1000;

		if (pauseMusic) {
			// briefly silence the music
			this.audioFiles.forEach(audio => {
				audio.audio.volume = 0;
			});

			// resume the music
			setTimeout(() => {
				this.audioFiles.forEach(audio => {
					audio.audio.volume = 0.1;

					if (audio.audio.loop) {
						audio.audio.play();
					}
				});
			}, audioLength);
		}

		audio.audio.volume = 0.1;
		audio.audio.play();
	}

	public getAudioLength(fileName: string): number {
		const audio = this.audioFiles.find(audio => audio.name.toLowerCase() === fileName.toLowerCase());
		if (!audio) {
			console.error('Audio file not found:', fileName);
			return 0;
		}
		return audio.audio.duration * 1000;
	}

	public stopMusic(): void {
		this.audioFiles.forEach(audio => {
			audio.audio.pause();
			audio.audio.currentTime = 0;
		});
	}
}
