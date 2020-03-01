export class MyEvent {
    listeners: any[];
    constructor() {
        this.listeners = [];
    }

    subscribe (obj, handler) {
        this.listeners.push({ obj: obj, handler: handler });
    }

    unsubscribe (obj) {
        for (let index = 0; index < this.listeners.length; index++) {
            const listener: any = this.listeners[index];
            if (listener.obj === obj) {
                this.listeners.splice(index, 1);
            }
        }
    };

    notifyListeners (source, args) {
        this.listeners.forEach(value => { 
            value.handler.call(value.obj, source, args); 
        });
    };      
}
