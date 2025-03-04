import Draw2D from '../graphics/Draw2D';

export default class Cache {
	public static async getAllWavFileURLs(): Promise<{ name: string; url: string }[]> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('pokemonOnlineCache');

			request.onerror = (event): void => {
				console.error('Error opening database:', event);
				reject(new Error('Database error'));
			};

			request.onsuccess = (): void => {
				const db = request.result as IDBDatabase;
				const transaction = db.transaction('assets', 'readonly');
				const objectStore = transaction.objectStore('assets');

				const wavFiles: { name: string; url: string }[] = [];

				// Open a cursor instead of fetching everything at once
				const cursorRequest = objectStore.openCursor();

				cursorRequest.onerror = (event): void => {
					console.error('Error fetching assets:', event);
					reject(new Error('Fetch error'));
				};

				cursorRequest.onsuccess = (event): void => {
					const cursor = (event.target as IDBRequest).result;
					if (cursor) {
						const asset = cursor.value;
						if (
							asset.type === 'file' &&
							(asset.name.endsWith('.wav') || asset.name.endsWith('.ogg') || asset.name.endsWith('.mp3'))
						) {
							const uint8Array = new Uint8Array(asset.data);
							const blob = new Blob([uint8Array]);
							const url = URL.createObjectURL(blob);

							wavFiles.push({ name: asset.name, url });
						}

						cursor.continue(); // Move to the next file
					} else {
						// Done processing all files
						resolve(wavFiles);
					}
				};
			};
		});
	}

	public static async getObjectURLByAssetName(assetName: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('pokemonOnlineCache');

			request.onerror = (event): void => {
				console.error('Error opening database:', event);
				reject(new Error('Database error'));
			};

			request.onsuccess = (): void => {
				const db = request.result as IDBDatabase;
				const transaction = db.transaction('assets', 'readonly');
				const objectStore = transaction.objectStore('assets');

				const getRequest = objectStore.get(assetName);

				getRequest.onerror = (event): void => {
					console.error('Error fetching asset:', event);
					reject(new Error('Fetch error'));
				};

				getRequest.onsuccess = (): void => {
					const result = getRequest.result;
					if (result) {
						const byteArray = result.data; // This should be your byte array

						// Convert the byte array to a Uint8Array
						const uint8Array = new Uint8Array(byteArray);

						// Create a Blob from the Uint8Array
						const blob = new Blob([uint8Array]);

						// Create an object URL from the Blob
						const objectURL = URL.createObjectURL(blob);

						// Resolve with the object URL
						resolve(objectURL);
					} else {
						console.warn('No asset found with name:', assetName);
						resolve(null);
					}
				};
			};
		});
	}

	public static async getCacheNumber(): Promise<number | null> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('pokemonOnlineCache');

			request.onerror = (event): void => {
				console.error('Error opening database:', event);
				resolve(-1);
			};

			request.onsuccess = (): void => {
				const db = request.result as IDBDatabase;
				let objectStore: IDBObjectStore;
				try {
					const transaction = db.transaction('cacheInfo', 'readonly');
					objectStore = transaction.objectStore('cacheInfo');
					const getRequest = objectStore.get('cacheNumber');

					getRequest.onerror = (event): void => {
						console.error('Error fetching cache number:', event);
						reject(new Error('Fetch error'));
					};

					getRequest.onsuccess = (): void => {
						const result = getRequest.result;
						resolve(result ? result.cacheNumber : -1);
					};
				} catch (error) {
					console.error(error);
					resolve(-1);
				}
			};
		});
	}

	public static async saveNewCache(
		assets: {
			name: string;
			type: string;
			data: { name: string; type: string; data: ArrayBuffer }[];
		}[],
		cacheNumber: number,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			let progress = 0;
			const request = indexedDB.open('pokemonOnlineCache', cacheNumber);

			request.onerror = (event): void => {
				console.error('Error opening database:', event);
				Draw2D.showProgress(0, 'Something went wrong');
				reject(new Error('Error opening database'));
			};

			request.onupgradeneeded = (event): void => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains('assets')) {
					db.createObjectStore('assets', { keyPath: 'name' });
				}
				if (!db.objectStoreNames.contains('cacheInfo')) {
					db.createObjectStore('cacheInfo', { keyPath: 'key' });
				}
				Draw2D.showProgress(60, 'Creating object stores');
			};

			request.onsuccess = (event): void => {
				Draw2D.showProgress(70, 'Clearing old cache');
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains('assets') || !db.objectStoreNames.contains('cacheInfo')) {
					console.error('Required object stores are missing.');
					reject(new Error('Object stores not found'));
					Draw2D.showProgress(0, 'Something went wrong');
					return;
				}

				const assetTransaction = db.transaction('assets', 'readwrite');
				const assetObjectStore = assetTransaction.objectStore('assets');

				const clearRequest = assetObjectStore.clear();
				clearRequest.onsuccess = (): void => {
					const addAssetPromises = assets.flatMap(asset => {
						if (asset.name && asset.type === 'directory' && Array.isArray(asset.data)) {
							return asset.data.map(content => {
								if (content.name && content.type === 'file' && content.data) {
									const assetToStore = {
										name: content.name,
										type: content.type,
										data: content.data,
									};

									return new Promise<void>((resolveAdd, rejectAdd) => {
										const addRequest = assetObjectStore.put(assetToStore); // Use `put` instead of `add`
										addRequest.onsuccess = (): void => {
											resolveAdd();
											progress++;
											Draw2D.showProgress(75 + progress, 'Unpacking assets');
										};
										addRequest.onerror = (): void => {
											console.error('Error adding asset:', assetToStore, addRequest.error);
											rejectAdd(
												new Error(
													`Failed to add asset: ${content.name}, error: ${addRequest.error?.message}`,
												),
											);
										};
									});
								} else {
									console.warn('Invalid content format', content);
									return Promise.resolve(); // Ignore invalid content formats
								}
							});
						} else {
							console.warn('Invalid asset format', asset);
							return [];
						}
					});

					Promise.all(addAssetPromises)
						.then(() => {
							const cacheTransaction = db.transaction('cacheInfo', 'readwrite');
							const cacheObjectStore = cacheTransaction.objectStore('cacheInfo');
							cacheObjectStore.put({ key: 'cacheNumber', cacheNumber });

							cacheTransaction.oncomplete = (): void => resolve();
							cacheTransaction.onerror = (): void => {
								console.error('Error saving cache number');
								reject(new Error('Cache number save error'));
							};
						})
						.catch(error => {
							console.error('Error during asset additions:', error);
							reject(error);
						});
				};

				clearRequest.onerror = (): void => {
					console.error('Error clearing object store.');
					Draw2D.showProgress(0, 'Something went wrong');

					reject(new Error('Error clearing object store'));
				};

				assetTransaction.onerror = (e): void => {
					console.error('Transaction error when adding assets:', e);
					Draw2D.showProgress(0, 'Something went wrong');

					reject(new Error('Transaction error'));
				};
			};
		});
	}
}
