import { canvas2d } from '../graphics/Canvas';
import Player from '../player/Player';
import World from './World';

export default class WildBattle {
	world: World;
	player: Player;
	wildPokemon: Pokemon;

	public currentEncounterFrame: number = 1;
	public encounterFrameCounter: number = 0;
	public currentBattleIntroFrame: number = 1;
	public battleIntroFrameCounter: number = 0;

	public trainerFrontImage: HTMLImageElement | null = null;
	public trainerBackImage: HTMLImageElement | null = null;
	public counterPokeBallImage: HTMLImageElement | null = null;

	private currentStep: number = 0;

	public battleBackgroundImage: {
		image: HTMLImageElement;
		name: string;
	} | null = null;

	public battleEncounterFrames: {
		frame: number;
		image: HTMLImageElement;
	}[] = [];

	public pokemonSpawnFrames: {
		frame: number;
		image: HTMLImageElement;
	}[] = [];

	public playerPokemonSprites: HTMLImageElement[] = [];
	public wildPokemonSprite: HTMLImageElement | null = null;
	private statsMeterEnemyImage: HTMLImageElement | null = null;
	private statsMeterPlayerImage: HTMLImageElement | null = null;
	private battleOptionsImage: HTMLImageElement | null = null;
	private hpGaugeImage: HTMLImageElement | null = null;

	public pokemonCounterImage: HTMLImageElement | null = null;
	public pokemonCounterCounter: number = 0;

	public enemySentOutCounter: number = 0;
	public playerSentOutCounter: number = 0;

	private playerCurrentPokemonIndex: number = 0;

	private isMouseOverFight: boolean = false;
	private activeOption: 'fight' | 'pkmn' | 'pack' | null = null;
	private hoveredMove: number | null = null;
	private isWaitingForOtherPlayer: boolean = false;
	private isPlayersTurnBeenExecuted: boolean = false;
	private isEnemysTurnBeenExecuted: boolean = false;
	private battleOver: boolean = false;
	private isPlayerWinner: boolean = false;

	private playerCurrentPokemonPreviousHp: number = 0;
	private enemyCurrentPokemonPreviousHp: number = 0;

	private isActionSelected: boolean = false;
	private isMouseOverPkmn: boolean = false;
	private isMouseOverPack: boolean = false;
	private isMouseOverRun: boolean = false;
	private hoveredPokemon: number | null = null;
	private hoveredItem: number | null = null;
	private currentMoveText: string = '';
	private isHoveringContinue: boolean = false;
	private pokemonWasCaught: boolean = false;
	private isDamageTakenFlashingShown: boolean = false;
	private damageTakenFlashingCounter: number = 0;

	constructor(world: World, player: Player, wildPokemon: Pokemon) {
		this.world = world;
		this.player = player;
		this.wildPokemon = wildPokemon;
		this.playerCurrentPokemonIndex = 0;

		this.loadAssets();

		this.setPlayerCurrentPokemonPreviousHp(
			this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].hp,
		);

		this.setEnemyCurrentPokemonPreviousHp(this.wildPokemon.hp);
	}

	private setPlayerCurrentPokemonPreviousHp(hp: number) {
		this.playerCurrentPokemonPreviousHp = hp;
	}

	private setEnemyCurrentPokemonPreviousHp(hp: number) {
		this.enemyCurrentPokemonPreviousHp = hp;
	}

	private async loadAssets(): Promise<void> {
		const sprite = await this.world.spriteCache.getSprite('blank_battle_screen.png');
		if (sprite) {
			this.battleBackgroundImage = {
				image: sprite,
				name: 'blank_battle_screen.png',
			};
		}

		const numberOfFrames = 28;

		for (let i = 1; i < numberOfFrames + 1; i++) {
			const battleEncounterFrame = await this.world.spriteCache.getSprite(`encounter_frame_${i}.png`);
			if (battleEncounterFrame) {
				this.battleEncounterFrames.push({
					frame: i,
					image: battleEncounterFrame,
				});
			}
		}

		for (let i = 1; i < 4 + 1; i++) {
			const pokemonSpawnFrame = await this.world.spriteCache.getSprite(`spawn_pokemon_frame_${i}.png`);
			if (pokemonSpawnFrame) {
				this.pokemonSpawnFrames.push({
					frame: i,
					image: pokemonSpawnFrame,
				});
			}
		}

		this.trainerFrontImage = await this.world.spriteCache.getSprite('trainer_front.png');
		this.trainerBackImage = await this.world.spriteCache.getSprite('trainer_back.png');
		this.pokemonCounterImage = await this.world.spriteCache.getSprite('pokemon_counter.png');
		this.counterPokeBallImage = await this.world.spriteCache.getSprite('counter_poke_ball.png');
		this.statsMeterEnemyImage = await this.world.spriteCache.getSprite('stats_meter_enemy.png');
		this.statsMeterPlayerImage = await this.world.spriteCache.getSprite('stats_meter_player.png');
		this.battleOptionsImage = await this.world.spriteCache.getSprite('battle_options.png');
		this.hpGaugeImage = await this.world.spriteCache.getSprite('hp_gauge.png');

		this.player.party.forEach(async (pokemon, index) => {
			const pokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			if (pokemon) {
				const sprite = await this.world.spriteCache.getSprite(`${pokemonData.sprite}_back.png`);
				if (sprite) {
					this.playerPokemonSprites[index] = sprite;
				} else {
					throw new Error(`Failed to load sprite for ${pokemonData.name}`);
				}
			}
		});

		const pokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(this.wildPokemon.id);
		if (!pokemonData) return;

		const wildPokemonSprite = await this.world.spriteCache.getSprite(`${pokemonData.sprite}.png`);
		if (wildPokemonSprite) {
			this.wildPokemonSprite = wildPokemonSprite;
		} else {
			throw new Error(`Failed to load sprite for ${pokemonData.name}`);
		}
	}

	public initBattle() {
		this.world.client.audioManager.playMusic('wild_battle_johto.mp3');
	}

	private runEncounterAnimation() {
		canvas2d.drawImage(this.battleEncounterFrames[this.currentEncounterFrame].image, 0, 0, 1000, 700);

		if (!this.encounterFrameCounter) this.encounterFrameCounter = 0;

		if (this.currentEncounterFrame < 26) {
			// Normal speed for frames 0-25 (increment every 6 frames)
			if (this.encounterFrameCounter % 3 === 0) {
				this.currentEncounterFrame++;
			}
		} else {
			// Triple time for frames 26 and 27 (increment every 18 frames)
			if (this.encounterFrameCounter % 60 === 0) {
				this.currentEncounterFrame++;
			}
		}

		if (this.currentEncounterFrame === 28) {
			this.currentStep = 1;
		}

		this.encounterFrameCounter++;
	}

	private drawMoves() {
		if (!this.battleOptionsImage) return;
		canvas2d.drawImage(this.battleOptionsImage, 520, 413, 473, 178);

		const mouseX = this.world.mouseScreenX;
		const mouseY = this.world.mouseScreenY;

		canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		canvas2d.lineWidth = 2;

		const moves = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].moves;

		// draw moves
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';

		for (let i = 0; i < 4; i++) {
			const move = this.world.pokemonMovesManager.getPokemonMoveInfoById(moves[i]);
			if (move) {
				canvas2d.fillText(move.name.toUpperCase(), 560, 460 + i * 35);
			} else {
				canvas2d.fillText('-', 560, 460 + i * 35);
			}

			if (
				mouseX >= 560 - 10 &&
				mouseX <= 910 + 10 &&
				mouseY >= 440 + i * 35 - 10 &&
				mouseY <= 440 + i * 35 + 25
			) {
				canvas2d.strokeRect(560 - 10, 440 + i * 35 - 10, 350, 35);
				this.hoveredMove = i;
			}
		}

		// if hoverin outside of the moves, reset hovered move
		if (mouseX < 560 - 10 || mouseX > 860 + 10 || mouseY < 440 - 10 || mouseY > 440 + 4 * 35 + 10) {
			this.hoveredMove = null;
		}

		if (this.hoveredMove !== null) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			const move = this.world.pokemonMovesManager.getPokemonMoveInfoById(moves[this.hoveredMove]);
			if (move) {
				canvas2d.fillText(move.type, 45, 460);
				canvas2d.fillText(`PP: ${move.pp} / ${move.pp}`, 45, 500);
			}
		}
	}

	public draw() {
		if (this.world.wildBattleTurnEvents.length > 0) {
			this.world.wildBattleTurnEvents.forEach(event => {
				if (event.actionType === 'ITEM') {
					const pokemonName = this.world.pokemonsManager.getPokemonInfoByIndex(this.wildPokemon.id)?.name;
					if (event.itemUsedId === 1) {
						if (event.isCaught) {
							this.pokemonWasCaught = true;
							this.world.client.audioManager.playMusic('wild_victory.mp3');
							this.isWaitingForOtherPlayer = false;
							this.isPlayersTurnBeenExecuted = false;
							this.isEnemysTurnBeenExecuted = false;
							this.isActionSelected = false;
							this.battleOver = true;
							this.isPlayerWinner = true;
						} else {
							this.currentMoveText = 'The wild ' + pokemonName + ' broke free!';
						}
					} else {
						this.currentMoveText = 'Absolutely nothing happened!';
					}
				}
				if (event.actionType === 'RUN') {
					if (event.isRunSuccessful) {
						this.currentMoveText = 'Got away safely!';

						setTimeout(() => {
							this.leaveBattle();
						}, 3000);
					} else {
						this.currentMoveText = "Can't escape!";
					}
				}
				if (event.switchedPokemonIndex !== -1) {
					if (event.isPlayersMove) {
						this.playerCurrentPokemonIndex = event.switchedPokemonIndex;
						this.playerCurrentPokemonPreviousHp = this.player.party.filter(pokemon => pokemon !== null)[
							this.playerCurrentPokemonIndex
						].hp;
						this.currentStep = 3;
						this.playerSentOutCounter = 0;
					} else {
						this.enemySentOutCounter = 0;
					}
				}

				if (event.isPlayersMove && event.moveId !== 0) {
					this.wildPokemon.hp = event.newHp;
				}

				const moveUsed = this.world.pokemonMovesManager.getPokemonMoveInfoById(event.moveId);
				if (moveUsed && !moveUsed.power) {
					const moveUserIsPlayer = event.isPlayersMove;

					const userPokemonId = moveUserIsPlayer
						? this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].id
						: this.wildPokemon.id;
					const moveUserName =
						this.world.pokemonsManager.getPokemonInfoByIndex(userPokemonId)?.name || 'Missing No.';
					const moveName = moveUsed.name;
					if (moveUserIsPlayer) {
						this.currentMoveText = `${moveUserName} used ${moveName}!`;
					} else {
						this.currentMoveText = `Enemy ${moveUserName} used ${moveName}!`;
					}
					this.world.client.audioManager.playSfx(
						`${moveUsed.name.toLowerCase().replace(/ /g, '')}.wav`,
						false,
					);
				}

				if (moveUsed && event.moveId !== 0 && moveUsed.power) {
					const moveNameLower = moveUsed.name.toLowerCase();
					const moveUserIsPlayer = event.isPlayersMove;

					const userPokemonId = moveUserIsPlayer
						? this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].id
						: this.wildPokemon.id;
					const moveUserName =
						this.world.pokemonsManager.getPokemonInfoByIndex(userPokemonId)?.name || 'Missing No.';
					const moveName = moveUsed.name;
					if (moveUserIsPlayer) {
						this.currentMoveText = `${moveUserName} used ${moveName}!`;
					} else {
						this.currentMoveText = `Enemy ${moveUserName} used ${moveName}!`;
					}
					const trimmedMoveName = moveNameLower.replace(/ /g, '');
					const sfxLength = this.world.client.audioManager.getAudioLength(`${trimmedMoveName}.wav`);
					this.world.client.audioManager.playSfx(`${trimmedMoveName}.wav`, false);

					setTimeout(() => {
						this.isDamageTakenFlashingShown = true;
						this.world.client.audioManager.playSfx(`take_damage.wav`, false);

						setTimeout(() => {
							this.isDamageTakenFlashingShown = false;
						}, 1000);

						if (event.effect === 1) {
							this.currentMoveText = `It's super effective!`;
						} else if (event.effect === -1) {
							this.currentMoveText = `It's not very effective...`;
						}

						const handleHpChange = (isPlayer: boolean) => {
							const currentHp = isPlayer
								? this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex]
										.hp
								: this.wildPokemon.hp;

							// interval time should depend on max hp. if liek 10, then it's kinda slow
							// if it's 100, it's fast. so we can do 100 / max hp * 30

							const intervalTime =
								(100 /
									(isPlayer
										? this.player.party.filter(pokemon => pokemon !== null)[
												this.playerCurrentPokemonIndex
											].maxHp
										: this.wildPokemon.maxHp)) *
								30;

							const interval = setInterval(() => {
								// Get the previous HP depending on whether it's the player's or enemy's
								const previousHp = isPlayer
									? this.playerCurrentPokemonPreviousHp
									: this.enemyCurrentPokemonPreviousHp;

								// Check if HP has changed
								if (previousHp !== currentHp) {
									// Update the HP values
									if (isPlayer) {
										this.setPlayerCurrentPokemonPreviousHp(this.playerCurrentPokemonPreviousHp - 1);
									} else {
										this.setEnemyCurrentPokemonPreviousHp(this.enemyCurrentPokemonPreviousHp - 1);
									}
								} else {
									// Once the HP stops changing, we check if the battle is over
									this.currentMoveText = '';

									// Check if battle is over
									if (event.isBattleOver) {
										setTimeout(() => {
											if (event.isPlayersMove) {
												this.battleOver = true;
												this.isPlayerWinner = event.isPlayerWinner;
												this.world.client.audioManager.playMusic('wild_victory.mp3');
											} else {
												if (event.isAllPokemonsFainted) {
													this.battleOver = true;
													this.isPlayerWinner = false;
													this.world.battle = null;
													this.world.isBattling = false;
													this.world.client.audioManager.playMusic('new_bark_town.mp3');
												} else {
													this.activeOption = 'pkmn';
													this.isPlayersTurnBeenExecuted = true;
													this.isEnemysTurnBeenExecuted = true;
													this.isWaitingForOtherPlayer = false;
													this.isActionSelected = false;
												}
											}
										}, 1000);
									}

									// Stop the interval once HP stops changing
									clearInterval(interval);
								}
							}, intervalTime);
						};

						if (event.isPlayersMove) {
							handleHpChange(false);
						} else {
							handleHpChange(true);
						}
					}, sfxLength + 1000);
				}

				if (event.isPlayersMove) {
					this.isPlayersTurnBeenExecuted = true;
				} else {
					this.isEnemysTurnBeenExecuted = true;
				}

				if (this.isPlayersTurnBeenExecuted && this.isEnemysTurnBeenExecuted) {
					this.isWaitingForOtherPlayer = false;
					this.isPlayersTurnBeenExecuted = false;
					this.isEnemysTurnBeenExecuted = false;
					this.isActionSelected = false;
				}

				// Remove the event from the array
				this.world.wildBattleTurnEvents = this.world.wildBattleTurnEvents.filter(
					turnEvent => turnEvent !== event,
				);
			});
		}

		if (this.currentStep !== 0) {
			if (!this.battleBackgroundImage) return;
			canvas2d.drawImage(this.battleBackgroundImage.image, 0, 0, 1000, 600);
		}

		if (this.playerSentOutCounter > 145) {
			this.drawPokemonAndItsStats(true);
		}
		if (this.currentStep !== 0 && this.currentStep !== 1 && this.currentStep !== 2) {
			this.drawPokemonAndItsStats(false);
		}

		if (this.activeOption === 'fight') {
			this.drawMoves();
			return;
		}

		if (this.activeOption === 'pkmn') {
			this.drawPokemonList();
			return;
		}

		if (this.activeOption === 'pack') {
			this.drawPack();
			return;
		}

		if (this.currentMoveText !== '') {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(this.currentMoveText, 45, 490);

			return;
		}

		if (this.battleOver) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';

			const wildPokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(this.wildPokemon.id);
			if (this.isPlayerWinner) {
				if (
					this.world.mouseScreenX >= 37 &&
					this.world.mouseScreenX <= 960 &&
					this.world.mouseScreenY >= 430 &&
					this.world.mouseScreenY <= 580
				) {
					// text color
					canvas2d.fillStyle = 'purple';
					this.isHoveringContinue = true;
				} else {
					canvas2d.fillStyle = 'black';
				}

				if (this.pokemonWasCaught) {
					canvas2d.fillText('Gotcha! Wild ' + wildPokemonData?.name.toUpperCase() + ' was caught!', 45, 490);
					canvas2d.fillText('Click here to continue...', 45, 550);
				} else {
					canvas2d.fillText(wildPokemonData?.name.toUpperCase(), 45, 490);
					canvas2d.fillText(`was defeated! Click here to continue...`, 45, 550);
				}
			} else {
				canvas2d.fillText('You', 45, 490);
				canvas2d.fillText(`were defeated!`, 45, 550);
			}

			return;
		}

		if (this.isWaitingForOtherPlayer && this.currentStep !== 3) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText('Waiting for other player...', 45, 490);
			return;
		}

		if (this.currentStep === 0) {
			this.runEncounterAnimation();
		} else if (this.currentStep === 1) {
			this.drawIntro();
		} else if (this.currentStep === 2) {
			this.drawIntro();
			this.drawPokemonCounter();
		} else if (this.currentStep === 3) {
			if (!this.battleBackgroundImage) return;
			this.sentOutPlayerPokemon();
		} else if (this.currentStep === 4) {
			const isCurrentPokemonFainted =
				this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].hp === 0;

			if (!isCurrentPokemonFainted) {
				this.drawBattleOptions();
			}
		}
	}

	private leaveBattle() {
		this.world.battle = null;
		this.world.isBattling = false;
		this.world.client.audioManager.playMusic('new_bark_town.mp3');
	}

	private drawPack() {
		// white screen first
		canvas2d.fillStyle = 'white';
		canvas2d.fillRect(0, 0, 1000, 600);

		// draw pokemon
		const playerPokemonCount = this.player.party.filter(pokemon => pokemon !== null).length;
		const playerInventory = this.player.inventory;

		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		for (let i = 0; i < playerInventory.length; i++) {
			const item = this.world.itemsManager.getItemInfoById(playerInventory[i]);
			if (!item) return;
			canvas2d.fillText(`${item.name.toUpperCase()}`, 45, 50 + i * 60);
			const itemAmount = this.player.inventoryAmounts[i];
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`x${itemAmount}`, 400, 50 + i * 60);

			if (!this.hpGaugeImage) return;
			canvas2d.drawImage(this.hpGaugeImage, 650, 22 + i * 60, 340, 30);

			if (
				this.world.mouseScreenX >= 45 - 10 &&
				this.world.mouseScreenX <= 45 - 10 + (1000 - 10 - 35) &&
				this.world.mouseScreenY >= 50 + i * 60 - 40 &&
				this.world.mouseScreenY <= 50 + i * 60 - 40 + 50
			) {
				canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
				canvas2d.lineWidth = 2;
				canvas2d.strokeRect(45 - 10, 50 + i * 60 - 40, 1000 - 10 - 35, 50);
				this.hoveredItem = i;
			}
		}

		// draw cancel
		canvas2d.fillStyle = 'black';
		canvas2d.fillText('CANCEL', 45, 50 + playerPokemonCount * 60);

		if (
			this.world.mouseScreenX >= 45 - 10 &&
			this.world.mouseScreenX <= 45 - 10 + (1000 - 10 - 35) &&
			this.world.mouseScreenY >= 50 + playerPokemonCount * 60 - 40 &&
			this.world.mouseScreenY <= 50 + playerPokemonCount * 60 - 40 + 50
		) {
			canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
			canvas2d.lineWidth = 2;
			canvas2d.strokeRect(45 - 10, 50 + playerPokemonCount * 60 - 40, 1000 - 10 - 35, 50);
			this.hoveredPokemon = -1;
		}
	}

	private drawPokemonList() {
		// white screen first
		canvas2d.fillStyle = 'white';
		canvas2d.fillRect(0, 0, 1000, 600);

		// draw pokemon
		const playerPokemonCount = this.player.party.filter(pokemon => pokemon !== null).length;

		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		for (let i = 0; i < playerPokemonCount; i++) {
			const pokemon = this.player.party.filter(pokemon => pokemon !== null)[i];
			const pokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;
			const isFainted = pokemon.hp === 0;
			canvas2d.fillStyle = isFainted ? 'gray' : 'black';
			canvas2d.fillText(`${pokemonData.name.toUpperCase()}`, 45, 50 + i * 60);

			// draw level

			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`Lv. ${pokemon.level}`, 400, 50 + i * 60);

			if (!this.hpGaugeImage) return;
			canvas2d.drawImage(this.hpGaugeImage, 650, 22 + i * 60, 340, 30);

			const pokemonsCurrentHp = pokemon.hp;
			const pokemonMaxHp = pokemon.maxHp;

			canvas2d.fillStyle = pokemonsCurrentHp / pokemonMaxHp > 0.5 ? 'green' : 'orange';
			canvas2d.fillRect(730, 22 + 5 + i * 60, (pokemonsCurrentHp / pokemonMaxHp) * 240, 15);

			if (
				this.world.mouseScreenX >= 45 - 10 &&
				this.world.mouseScreenX <= 45 - 10 + (1000 - 10 - 35) &&
				this.world.mouseScreenY >= 50 + i * 60 - 40 &&
				this.world.mouseScreenY <= 50 + i * 60 - 40 + 50
			) {
				canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
				canvas2d.lineWidth = 2;
				canvas2d.strokeRect(45 - 10, 50 + i * 60 - 40, 1000 - 10 - 35, 50);
				this.hoveredPokemon = i;
			}
		}

		// draw cancel only if current pkmn is not fainted
		if (this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].hp > 0) {
			// draw cancel
			canvas2d.fillStyle = 'black';
			canvas2d.fillText('CANCEL', 45, 50 + playerPokemonCount * 60);

			if (
				this.world.mouseScreenX >= 45 - 10 &&
				this.world.mouseScreenX <= 45 - 10 + (1000 - 10 - 35) &&
				this.world.mouseScreenY >= 50 + playerPokemonCount * 60 - 40 &&
				this.world.mouseScreenY <= 50 + playerPokemonCount * 60 - 40 + 50
			) {
				canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
				canvas2d.lineWidth = 2;
				canvas2d.strokeRect(45 - 10, 50 + playerPokemonCount * 60 - 40, 1000 - 10 - 35, 50);
				this.hoveredPokemon = -1;
			}
		}
	}

	private drawBattleOptions() {
		if (!this.battleOptionsImage) return;
		canvas2d.drawImage(this.battleOptionsImage, 520, 413, 473, 178);

		const mouseX = this.world.mouseScreenX;
		const mouseY = this.world.mouseScreenY;

		canvas2d.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		canvas2d.lineWidth = 2;

		// draw fight
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('FIGHT', 580, 485);

		// draw pokemon
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('PACK', 580, 545);

		// draw bag
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('PKMN', 830, 485);

		// draw run
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('RUN', 830, 545);

		if (mouseX >= 580 - 10 && mouseX <= 720 + 10 && mouseY >= 465 - 15 && mouseY <= 490) {
			canvas2d.strokeRect(580 - 10, 465 - 15, 160, 40);
			this.isMouseOverFight = true;
		} else if (mouseX >= 580 - 10 && mouseX <= 720 + 10 && mouseY >= 525 - 15 && mouseY <= 550) {
			canvas2d.strokeRect(580 - 10, 525 - 15, 160, 40);
			this.isMouseOverPack = true;
		} else if (mouseX >= 830 - 10 && mouseX <= 970 + 10 && mouseY >= 465 - 15 && mouseY <= 490) {
			canvas2d.strokeRect(830 - 10, 465 - 15, 135, 40);
			this.isMouseOverPkmn = true;
		} else if (mouseX >= 830 - 10 && mouseX <= 970 + 10 && mouseY >= 525 - 15 && mouseY <= 550) {
			canvas2d.strokeRect(830 - 10, 525 - 15, 135, 40);
			this.isMouseOverRun = true;
		} else {
			this.isMouseOverFight = false;
			this.isMouseOverPkmn = false;
		}
	}

	private drawPokemonAndItsStats(isPlayer: boolean) {
		if (!isPlayer) {
			if (!this.wildPokemonSprite) return;

			canvas2d.drawImage(this.wildPokemonSprite, 750, 0, 200, 200);

			if (!this.statsMeterEnemyImage) return;
			canvas2d.drawImage(this.statsMeterEnemyImage, 45, 50, 400, 76);
			const pokemon = this.wildPokemon;
			const pokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			// draw name
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${pokemonData.name.toUpperCase()} Lv. ${pokemon.level}`, 45, 30);

			// draw hp bar
			canvas2d.fillStyle = 'green';
			canvas2d.fillRect(161, 63, (this.enemyCurrentPokemonPreviousHp / pokemon.maxHp) * 243, 13);
		} else {
			canvas2d.drawImage(this.playerPokemonSprites[this.playerCurrentPokemonIndex], 50, 200, 200, 200);

			if (!this.statsMeterPlayerImage) return;
			// 3.59 ratio
			canvas2d.drawImage(this.statsMeterPlayerImage, 550, 280, 400, 111);

			const pokemon = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex];
			const pokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			// draw name
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${pokemonData.name.toUpperCase()} Lv. ${pokemon.level}`, 590, 260);

			// draw hp bar
			canvas2d.fillStyle = 'green';
			canvas2d.fillRect(672, 288, (this.playerCurrentPokemonPreviousHp / pokemon.maxHp) * 243, 13);

			// draw hp / hp
			canvas2d.fillStyle = 'black';
			canvas2d.font = '40px Pkmn';
			canvas2d.fillText(this.playerCurrentPokemonPreviousHp.toString(), 680, 350);
			canvas2d.fillText(`${pokemon.maxHp}`, 820, 350);
		}
	}

	private sentOutPlayerPokemon() {
		const pokemon = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex];
		const pokemonName = this.world.pokemonsManager.getPokemonInfoByIndex(pokemon?.id)?.name;

		this.playerSentOutCounter++;

		if (this.playerSentOutCounter > 120) {
			// draw spawn animation
			if (this.playerSentOutCounter < 125) {
				if (this.playerSentOutCounter === 121) {
					this.world.client.audioManager.playSfx('ball_poof.wav', false);
				}
				canvas2d.drawImage(this.pokemonSpawnFrames[0].image, 50, 200, 200, 200);
			} else if (this.playerSentOutCounter < 130) {
				canvas2d.drawImage(this.pokemonSpawnFrames[1].image, 50, 200, 200, 200);
			} else if (this.playerSentOutCounter < 135) {
				canvas2d.drawImage(this.pokemonSpawnFrames[2].image, 50, 200, 200, 200);
			} else if (this.playerSentOutCounter < 140) {
				canvas2d.drawImage(this.pokemonSpawnFrames[3].image, 50, 200, 200, 200);
			}

			if (this.playerSentOutCounter > 165) {
				this.currentStep = 4;
			}
		} else {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`Go! ${pokemonName.toUpperCase()}!`, 45, 490);
		}
	}

	public drawIntro() {
		if (!this.trainerBackImage) return;

		if (this.currentBattleIntroFrame * 5 < 751) this.currentBattleIntroFrame++;
		canvas2d.drawImage(this.wildPokemonSprite, this.currentBattleIntroFrame * 5, 0, 200, 200);
		canvas2d.drawImage(this.trainerBackImage, 800 - this.currentBattleIntroFrame * 5, 200, 200, 200);

		if (this.currentBattleIntroFrame * 5 === 750) {
			this.world.client.audioManager.playSfx('positioned.ogg', false);
		}

		const wildPokemonData = this.world.pokemonsManager.getPokemonInfoByIndex(this.wildPokemon.id);

		if (this.currentBattleIntroFrame * 5 >= 750) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`Wild ${wildPokemonData?.name.toUpperCase()} appeared!`, 45, 490);
			this.currentStep = 2;
		}

		return;
	}

	private drawPokemonCounter() {
		if (!this.pokemonCounterImage) return;

		canvas2d.save();
		canvas2d.scale(-1, 1);

		canvas2d.translate(-490, 0); // Move it back to the correct position after flipping

		// Adjust x position for mirrored drawing
		canvas2d.drawImage(this.pokemonCounterImage, -45 - 400, 300, 400, 76);
		canvas2d.restore();

		const playerPokemonCount = this.player.party.filter(pokemon => pokemon !== null).length;

		Array.from({ length: playerPokemonCount }, (_, i) => i).forEach(i => {
			if (!this.counterPokeBallImage) return;
			// from left to right
			canvas2d.drawImage(this.counterPokeBallImage, 579 + 38 * (i + 1) + i * 2, 304, 38, 38);
		});

		this.pokemonCounterCounter++;

		if (this.pokemonCounterCounter > 120) {
			this.currentStep = 3;
		}
	}

	public handleClick(event: MouseEvent) {
		if (this.isHoveringContinue) {
			this.leaveBattle();
			return;
		}
		if (this.battleOver) return;
		if (this.isWaitingForOtherPlayer) return;
		if (this.isActionSelected) return;

		if (this.activeOption === null) {
			if (this.isMouseOverFight) {
				this.activeOption = 'fight';
				return;
			}

			if (this.isMouseOverPkmn) {
				this.activeOption = 'pkmn';
				return;
			}

			if (this.isMouseOverPack) {
				this.activeOption = 'pack';
				return;
			}

			if (this.isMouseOverRun) {
				this.world.actions?.sendBattleAction(this.player.entityID, 'RUN');
				return;
			}
		}

		if (this.activeOption === 'fight') {
			const hoveredMove = this.hoveredMove;
			if (hoveredMove !== null) {
				const moveId = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex]
					.moves[hoveredMove];

				this.world.actions?.sendBattleAction(this.player.entityID, 'FIGHT', moveId);
				this.isWaitingForOtherPlayer = true;
				this.activeOption = null;
				this.isActionSelected = true;
			}
		} else if (this.activeOption === 'pkmn') {
			if (this.hoveredPokemon !== null) {
				if (this.hoveredPokemon === -1) {
					this.activeOption = null;
					return;
				}
				this.world.actions?.sendBattleAction(this.player.entityID, 'POKEMON', this.hoveredPokemon);
				this.isWaitingForOtherPlayer = true;
				this.activeOption = null;
				this.isActionSelected = true;
			}
		} else if (this.activeOption === 'pack') {
			if (this.hoveredItem !== null) {
				if (this.hoveredItem === -1) {
					this.activeOption = null;
					return;
				}
				this.world.actions?.sendBattleAction(this.player.entityID, 'ITEM', this.hoveredItem);
				this.isWaitingForOtherPlayer = true;
				this.activeOption = null;
				this.isActionSelected = true;
			}
		}
	}
}
