import Cache from '../cache';

export default class PokemonMovesManager {
	private pokemonMoves: PokemonMove[] = [];

	constructor() {
		this.loadPokemonMoves();
	}

	private async loadPokemonMoves(): Promise<void> {
		const blob = await Cache.getObjectURLByAssetName('pokemonMoves.json');

		if (!blob) {
			throw new Error('PokemonMoves blob not found');
		}

		const pokemonMoves = await fetch(blob).then(response => response.json());
		this.pokemonMoves = pokemonMoves;
	}

	public getPokemonMoveInfoById(id: number): PokemonMove | null {
		return this.pokemonMoves.find(pokemonMove => pokemonMove.id === id) || null;
	}

	public getAllPokemonMoves(): PokemonMove[] {
		return this.pokemonMoves;
	}
}
