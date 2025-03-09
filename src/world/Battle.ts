import { canvas, canvas2d } from '../graphics/Canvas';
import PokemonsManager from '../managers/PokemonsManager';
import Npc from '../npcs/Npc';
import Player from '../player/Player';
import World from './World';

export default class Battle {
	world: World;
	player: Player;
	enemy: Player | Npc;

	private pokemonsManager: PokemonsManager = new PokemonsManager();

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
	public enemyPokemonSprites: HTMLImageElement[] = [];
	private statsMeterEnemyImage: HTMLImageElement | null = null;
	private statsMeterPlayerImage: HTMLImageElement | null = null;
	private battleOptionsImage: HTMLImageElement | null = null;

	public pokemonCounterImage: HTMLImageElement | null = null;
	public pokemonCounterCounter: number = 0;

	public enemySentOutCounter: number = 0;
	public playerSentOutCounter: number = 0;

	private playerCurrentPokemonIndex: number = 0;
	private enemyCurrentPokemonIndex: number = 0;

	private isMouseOverFight: boolean = false;
	private activeOption: 'fight' | null = null;
	private hoveredMove: number | null = null;
	private isWaitingForOtherPlayer: boolean = false;
	private isPlayersTurnBeenExecuted: boolean = false;
	private isEnemysTurnBeenExecuted: boolean = false;
	private mostRecentBattleEvent: BattleTurnEvent | null = null;
	private battleOver: boolean = false;
	private battleWinnerEntityID: string | null = null;

	private playerCurrentPokemonPreviousHp: number = 0;
	private enemyCurrentPokemonPreviousHp: number = 0;

	private isActionSelected: boolean = false;

	constructor(world: World, player: Player, enemy: Player | Npc) {
		this.world = world;
		this.player = player;
		this.enemy = enemy;

		this.loadAssets();

		this.setPlayerCurrentPokemonPreviousHp(
			this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].hp,
		);

		this.setEnemyCurrentPokemonPreviousHp(
			this.enemy.party.filter(pokemon => pokemon !== null)[this.enemyCurrentPokemonIndex].hp,
		);
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

		this.player.party.forEach(async (pokemon, index) => {
			const pokemonData = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			if (pokemon) {
				const sprite = await this.world.spriteCache.getSprite(`${pokemonData.sprite}_back.png`);
				if (sprite) {
					this.playerPokemonSprites[index] = sprite;
				} else {
					const sprite = await this.world.spriteCache.getSprite('missingNo.png');
					if (sprite) {
						this.playerPokemonSprites[index] = sprite;
					}
				}
			}
		});

		this.enemy.party.forEach(async (pokemon, index) => {
			const pokemonData = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;
			if (pokemon) {
				const sprite = await this.world.spriteCache.getSprite(`${pokemonData.sprite}.png`);
				if (sprite) {
					this.enemyPokemonSprites[index] = sprite;
				} else {
					const sprite = await this.world.spriteCache.getSprite('missingNo.png');
					if (sprite) {
						this.enemyPokemonSprites[index] = sprite;
					}
				}
			}
		});
	}

	public initBattle() {
		this.world.client.audioManager.playMusic('battle_rival.mp3');
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
		if (this.world.battleTurnEvents.length > 0) {
			this.world.battleTurnEvents.forEach(event => {
				this.mostRecentBattleEvent = event;
				setTimeout(() => {
					this.mostRecentBattleEvent = null;
				}, 4000);

				if (event.playerID === this.player.entityID) {
					this.isPlayersTurnBeenExecuted = true;
				} else if (event.playerID === this.enemy.entityID) {
					this.isEnemysTurnBeenExecuted = true;
				} else if (event.targetID === this.player.entityID) {
					this.isEnemysTurnBeenExecuted = true;
				} else if (event.targetID === this.enemy.entityID) {
					this.isPlayersTurnBeenExecuted = true;
				}

				const moveUsed = this.world.pokemonMovesManager.getPokemonMoveInfoById(event.moveId);
				if (moveUsed && moveUsed.power) {
					const moveNameLower = moveUsed.name.toLowerCase();
					const trimmedMoveName = moveNameLower.replace(/ /g, '');
					const sfxLength = this.world.client.audioManager.getAudioLength(`${trimmedMoveName}.ogg`);
					this.world.client.audioManager.playSfx(`${trimmedMoveName}.ogg`, false);

					setTimeout(() => {
						this.world.client.audioManager.playSfx(`take_damage.ogg`, false);

						const handleHpChange = (
							entity: Player | Npc,
							currentPokemonIndex: number,
							isPlayer: boolean,
						) => {
							const currentHp = entity.party.filter(pokemon => pokemon !== null)[currentPokemonIndex].hp;

							const interval = setInterval(
								() => {
									const previousHp = isPlayer
										? this.playerCurrentPokemonPreviousHp
										: this.enemyCurrentPokemonPreviousHp;

									if (previousHp !== currentHp) {
										if (isPlayer) {
											this.setPlayerCurrentPokemonPreviousHp(previousHp - 1);
										} else {
											this.setEnemyCurrentPokemonPreviousHp(previousHp - 1);
										}
									} else {
										clearInterval(interval); // Stop the interval once the health stops changing

										// Check if battle is over
										if (event.isBattleOver && event.winnerEntityID) {
											setTimeout(() => {
												this.battleOver = true;
												this.battleWinnerEntityID = event.winnerEntityID || null;
												this.world.client.audioManager.playMusic('victory.mp3');

												setTimeout(() => {
													this.world.battle = null;
													this.world.isBattling = false;
													this.world.client.audioManager.playMusic('new_bark_town.mp3');
												}, 10000);
											}, 4000);
										}
									}
								},
								isPlayer ? 10 : 30,
							); // Shorter interval for the player
						};

						if (event.targetID === this.player.entityID) {
							handleHpChange(this.player, this.playerCurrentPokemonIndex, true);
						}

						if (event.targetID === this.enemy.entityID) {
							handleHpChange(this.enemy, this.enemyCurrentPokemonIndex, false);
						}
					}, sfxLength + 1000);
				}

				if (this.isPlayersTurnBeenExecuted && this.isEnemysTurnBeenExecuted) {
					this.isWaitingForOtherPlayer = false;
					this.isPlayersTurnBeenExecuted = false;
					this.isEnemysTurnBeenExecuted = false;
					this.isActionSelected = false;
				}
			});
			this.world.battleTurnEvents = [];
		}

		if (this.currentStep !== 0) {
			if (!this.battleBackgroundImage) return;
			canvas2d.drawImage(this.battleBackgroundImage.image, 0, 0, 1000, 600);
		}

		if (this.enemySentOutCounter > 205) {
			this.drawPokemonAndItsStats(false);
		}

		if (this.playerSentOutCounter > 145) {
			this.drawPokemonAndItsStats(true);
		}

		if (this.activeOption === 'fight') {
			this.drawMoves();
			return;
		}

		if (this.mostRecentBattleEvent) {
			const moveUserIsPlayer = this.mostRecentBattleEvent.playerID === this.player.entityID;
			const userPokemonId = moveUserIsPlayer
				? this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex].id
				: this.enemy.party.filter(pokemon => pokemon !== null)[this.enemyCurrentPokemonIndex].id;
			const moveUserName = this.pokemonsManager.getPokemonInfoByIndex(userPokemonId)?.name || 'Missing No.';

			const moveName = this.world.pokemonMovesManager.getPokemonMoveInfoById(
				this.mostRecentBattleEvent.moveId,
			)?.name;

			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${moveUserName} used ${moveName}!`, 45, 485);
			return;
		}

		if (this.battleOver) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';

			const isPlayerWinner = this.battleWinnerEntityID === this.player.entityID;

			if (isPlayerWinner) {
				canvas2d.fillText(this.enemy.name, 45, 490);
				canvas2d.fillText(`was defeated!`, 45, 550);
			} else {
				canvas2d.fillText('You', 45, 490);
				canvas2d.fillText(`were defeated!`, 45, 550);
			}

			return;
		}

		if (this.isWaitingForOtherPlayer) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText('Waiting for other player...', 45, 485);
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
			if (!this.trainerBackImage) return;
			canvas2d.drawImage(this.battleBackgroundImage.image, 0, 0, 1000, 600);
			canvas2d.drawImage(this.trainerBackImage, 800 - this.currentBattleIntroFrame * 5, 200, 200, 200);
			this.sentOutEnemyPokemon(0);
		} else if (this.currentStep === 4) {
			if (!this.battleBackgroundImage) return;
			this.sentOutPlayerPokemon(0);
		} else if (this.currentStep === 5) {
			this.drawBattleOptions();
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
		canvas2d.fillText('FIGHT', 620, 485);

		// draw pokemon
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('PKMN', 620, 545);

		// draw bag
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('BAG', 870, 485);

		// draw run
		canvas2d.fillStyle = 'black';
		canvas2d.font = '30px Pkmn';
		canvas2d.fillText('RUN', 870, 545);

		if (mouseX >= 593 - 10 && mouseX <= 796 + 10 && mouseY >= 465 - 10 && mouseY <= 493 + 10) {
			canvas2d.strokeRect(593 - 10, 465 - 10, 203 + 20, 28 + 20);
			this.isMouseOverFight = true;
		}

		if (mouseX >= 593 - 10 && mouseX <= 796 + 10 && mouseY >= 528 - 10 && mouseY <= 554 + 10) {
			canvas2d.strokeRect(593 - 10, 528 - 10, 203 + 20, 28 + 20);
		}

		if (mouseX >= 845 - 10 && mouseX <= 962 + 10 && mouseY >= 465 - 10 && mouseY <= 497 + 10) {
			canvas2d.strokeRect(845 - 10, 465 - 10, 117 + 20, 32 + 20);
		}

		if (mouseX >= 845 - 10 && mouseX <= 962 + 10 && mouseY >= 528 - 10 && mouseY <= 554 + 10) {
			canvas2d.strokeRect(845 - 10, 528 - 10, 117 + 20, 26 + 20);
		}
	}

	private drawPokemonAndItsStats(isPlayer: boolean) {
		if (!isPlayer) {
			canvas2d.drawImage(this.enemyPokemonSprites[this.enemyCurrentPokemonIndex], 750, 0, 200, 200);

			if (!this.statsMeterEnemyImage) return;
			canvas2d.drawImage(this.statsMeterEnemyImage, 45, 50, 400, 76);
			const pokemon = this.enemy.party.filter(pokemon => pokemon !== null)[this.enemyCurrentPokemonIndex];
			const pokemonData = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			// draw name
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${pokemonData.name.toUpperCase()}`, 45, 30);

			// draw hp bar
			canvas2d.fillStyle = 'green';
			canvas2d.fillRect(161, 63, (this.enemyCurrentPokemonPreviousHp / pokemonData.hp) * 243, 13);
		} else {
			canvas2d.drawImage(this.playerPokemonSprites[this.playerCurrentPokemonIndex], 50, 200, 200, 200);

			if (!this.statsMeterPlayerImage) return;
			// 3.59 ratio
			canvas2d.drawImage(this.statsMeterPlayerImage, 550, 280, 400, 111);

			const pokemon = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex];
			const pokemonData = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id);
			if (!pokemonData) return;

			// draw name
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${pokemonData.name.toUpperCase()}`, 590, 260);

			// draw hp bar
			canvas2d.fillStyle = 'green';
			canvas2d.fillRect(672, 288, (this.playerCurrentPokemonPreviousHp / pokemonData.hp) * 243, 13);

			// draw hp / hp
			canvas2d.fillStyle = 'black';
			canvas2d.font = '40px Pkmn';
			canvas2d.fillText(this.playerCurrentPokemonPreviousHp.toString(), 680, 350);
			canvas2d.fillText(`${pokemonData.hp}`, 820, 350);
		}
	}

	private sentOutPlayerPokemon(pokemonIndex: number = 0) {
		this.playerCurrentPokemonIndex = pokemonIndex;
		const pokemon = this.player.party.filter(pokemon => pokemon !== null)[pokemonIndex];
		const pokemonName = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id)?.name;

		this.playerSentOutCounter++;

		if (this.playerSentOutCounter > 120) {
			// draw spawn animation
			if (this.playerSentOutCounter < 125) {
				if (this.playerSentOutCounter === 121) {
					this.world.client.audioManager.playSfx('ball_poof.ogg', false);
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
				this.currentStep = 5;
			}
		} else {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`Go! ${pokemonName.toUpperCase()}!`, 45, 490);
		}
	}

	private sentOutEnemyPokemon(pokemonIndex: number = 0) {
		this.enemyCurrentPokemonIndex = pokemonIndex;
		const enemyName = this.enemy.name;
		const pokemon = this.enemy.party.filter(pokemon => pokemon !== null)[pokemonIndex];
		const pokemonName = this.pokemonsManager.getPokemonInfoByIndex(pokemon?.id).name;

		this.enemySentOutCounter++;

		if (this.enemySentOutCounter > 180) {
			// draw spawn animation
			if (this.enemySentOutCounter < 185) {
				if (this.enemySentOutCounter === 181) {
					this.world.client.audioManager.playSfx('ball_poof.ogg', false);
				}
				canvas2d.drawImage(this.pokemonSpawnFrames[0].image, 750, 0, 200, 200);
			} else if (this.enemySentOutCounter < 190) {
				canvas2d.drawImage(this.pokemonSpawnFrames[1].image, 750, 0, 200, 200);
			} else if (this.enemySentOutCounter < 195) {
				canvas2d.drawImage(this.pokemonSpawnFrames[2].image, 750, 0, 200, 200);
			} else if (this.enemySentOutCounter < 200) {
				canvas2d.drawImage(this.pokemonSpawnFrames[3].image, 750, 0, 200, 200);
			}

			if (this.enemySentOutCounter > 235) {
				this.currentStep = 4;
			}
		} else if (this.enemySentOutCounter > 120) {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText('sent out', 45, 490);
			canvas2d.fillText(`${pokemonName.toUpperCase()}!`, 45, 550);
		} else {
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${enemyName}`, 45, 490);
			canvas2d.fillText('sent out', 45, 550);
		}
	}

	public drawIntro() {
		if (!this.trainerFrontImage) return;
		if (!this.trainerBackImage) return;

		if (this.currentBattleIntroFrame * 5 < 751) this.currentBattleIntroFrame++;
		canvas2d.drawImage(this.trainerFrontImage, this.currentBattleIntroFrame * 5, 0, 200, 200);
		canvas2d.drawImage(this.trainerBackImage, 800 - this.currentBattleIntroFrame * 5, 200, 200, 200);

		if (this.currentBattleIntroFrame * 5 === 750) {
			this.world.client.audioManager.playSfx('positioned.ogg', false);
		}

		if (this.currentBattleIntroFrame * 5 >= 750) {
			const enemyName = this.enemy.name;
			canvas2d.fillStyle = 'black';
			canvas2d.font = '30px Pkmn';
			canvas2d.fillText(`${enemyName}`, 45, 490);
			canvas2d.fillText('wants to battle!', 45, 550);

			this.currentStep = 2;
		}

		return;
	}

	private drawPokemonCounter() {
		if (!this.pokemonCounterImage) return;

		// Ratio for image is 5.27
		canvas2d.drawImage(this.pokemonCounterImage, 45, 50, 400, 76);

		const enemyPokemonCount = this.enemy.party.filter(pokemon => pokemon !== null).length;

		Array.from({ length: enemyPokemonCount }, (_, i) => i).forEach(i => {
			if (!this.counterPokeBallImage) return;
			canvas2d.drawImage(this.counterPokeBallImage, 365 - 38 * (i + 1) - i * 2, 54, 38, 38);
		});

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
		if (this.battleOver) return;
		if (this.isWaitingForOtherPlayer) return;
		if (this.isActionSelected) return;

		if (this.activeOption === null) {
			if (this.isMouseOverFight) {
				this.activeOption = 'fight';
				return;
			}
		}

		if (this.activeOption === 'fight') {
			const hoveredMove = this.hoveredMove;
			if (hoveredMove !== null) {
				const moveId = this.player.party.filter(pokemon => pokemon !== null)[this.playerCurrentPokemonIndex]
					.moves[hoveredMove];
				this.world.actions?.selectMove(this.player.entityID, moveId);
				this.isWaitingForOtherPlayer = true;
				this.activeOption = null;
				this.isActionSelected = true;
			}
		}
	}
}
