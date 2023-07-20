class WebSocketClass {
    private websocket: WebSocket | null;
    private url = "ws://belkhiri.dev"

    constructor() {
        this.websocket = null;
    }

    connect(): void {
        if (this.websocket) {
            console.warn("WebSocket is already connected.");
            return;
        }

        this.websocket = new WebSocket(this.url);

        console.log(this.websocket)

        this.websocket.onopen = () => {
            console.log("WebSocket connection established.");
        };

        this.websocket.onmessage = (event: MessageEvent) => {
            console.log("Received message:", event.data);
        };

        this.websocket.onclose = (event: CloseEvent) => {
            console.log("WebSocket connection closed with code:", event.code);
            this.websocket = null;
        };

        this.websocket.onerror = (error: Event) => {
            console.error("WebSocket error:", error);
        };
    }

    send(message: string): void {
        if (!this.websocket) {
            console.warn("WebSocket is not connected. Cannot send message.");
            return;
        }

        this.websocket.send(message);
    }

    close(): void {
        if (!this.websocket) {
            console.warn("WebSocket is not connected. Cannot close.");
            return;
        }

        this.websocket.close();
    }
}

export default WebSocketClass;
