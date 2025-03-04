import Cache from '../cache';

const missingNo: PokemonData = {
	pokemonIndex: 0,
	name: 'MissingNo',
	type1: 0,
	type2: 0,
	sprite: 'missingNo',
	hp: 33,
	attack: 136,
	defense: 0,
	specialAttack: 6,
	specialDefense: 6,
	speed: 29,
};

export default class PokemonsManager {
	private pokemonData: PokemonData[] = [];

	constructor() {
		this.loadPokemons();
	}

	private async loadPokemons(): Promise<void> {
		const blob = await Cache.getObjectURLByAssetName('pokemons.json');

		if (!blob) {
			throw new Error('Pokemons blob not found');
		}

		const pokemons = await fetch(blob).then(response => response.json());
		this.pokemonData = pokemons;
	}

	public getPokemonInfoByIndex(index: number): PokemonData {
		return this.pokemonData.find(pokemon => pokemon.pokemonIndex === index) || missingNo;
	}

	public getAllPokemons(): PokemonData[] {
		return this.pokemonData;
	}
}
