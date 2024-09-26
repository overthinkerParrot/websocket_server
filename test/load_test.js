const WebSocket = require('ws');

const NUM_CLIENTS = 25000;
const SERVER_URL = 'ws://localhost:8080';

let totalFailures = 0;
let totalMessagesSent = 0;
let totalMessagesReceived = 0;

const startTime = Date.now();

class SimulatedClient {
  constructor(id) {
    this.id = id;
    this.sessionId = null;
    this.ws = null;
    this.connected = false;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(SERVER_URL);

    this.ws.on('open', () => {
      console.log(`Client ${this.id} connected`);
      this.connected = true;
      this.sendMessage({ type: 'connect' });
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      console.log(`Client ${this.id} disconnected. Attempting to reconnect...`);
      this.connected = false;
      totalFailures++;
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (error) => {
      console.error(`Client ${this.id} encountered an error:`, error);
      totalFailures++;
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connect_id':
        this.sessionId = message.data;
        console.log(`Client ${this.id} received session ID: ${this.sessionId}`);
        this.startSimulation();
        break;
      case 'benchmark':
        console.log(`Client ${this.id} received benchmark data:`, message.data);
        break;
      case 'message':
        console.log(`Client ${this.id} received message:`, message.data);
        totalMessagesReceived++;
        break;
      case 'SSE':
        console.log(`Client ${this.id} received SSE:`, message.data);
        break;
      default:
        console.log(`Client ${this.id} received unknown message type:`, message.type);
    }
  }

  startSimulation() {

    setInterval(() => {
      if (this.connected) {
        this.sendMessage({ type: 'message', sessionID: this.sessionId });
        totalMessagesSent++;
      }
    }, 10000);

  }

  sendMessage(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

const clients = Array.from({ length: NUM_CLIENTS }, (_, i) => new SimulatedClient(i + 1));

console.log(`Started ${NUM_CLIENTS} simulated clients`);

process.on('SIGINT', () => {
  console.log('Terminating all clients...');

  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.sendMessage({ type: 'disconnect', sessionID: client.sessionId });
      client.ws.close();
    }
  });

  const timeElapsedInSeconds = (Date.now() - startTime) / 1000;
  const throughput = totalMessagesReceived / timeElapsedInSeconds;

  console.log('--- Final Statistics ---');
  console.log(`Total Failures: ${totalFailures}`);
  console.log(`Total Messages Sent: ${totalMessagesSent}`);
  console.log(`Total Messages Received: ${totalMessagesReceived}`);
  console.log(`Throughput: ${throughput.toFixed(2)} messages/second`);
  
  process.exit();
});
