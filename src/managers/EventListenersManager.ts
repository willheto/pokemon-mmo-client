import { canvas } from '../graphics/Canvas';

export default class EventListenersManager {
	// Store all event listeners with event type as part of the key
	public eventListeners: { [key: string]: (event: Event) => void } = {};

	// Add an event listener to the canvas
	public addCanvasEventListener(name: string, event: string, callback: (event: Event) => void): void {
		// Store the listener with a unique key (name + event type)
		const key = `${name}-${event}`;
		this.eventListeners[key] = callback;
		canvas.addEventListener(event, callback);
	}

	// Remove a specific event listener from the canvas
	public destroyCanvasEventListener(name: string, event: string): void {
		const key = `${name}-${event}`;
		if (this.eventListeners[key]) {
			canvas.removeEventListener(event, this.eventListeners[key]);
			delete this.eventListeners[key]; // Clean up the stored listener
		}
	}

	// Remove all event listeners from the canvas
	public destroyAllCanvasEventListeners(): void {
		for (const key in this.eventListeners) {
			const [_, event] = key.split('-');
			canvas.removeEventListener(event, this.eventListeners[key]);
		}
		this.eventListeners = {}; // Clear the stored listeners
	}
}
