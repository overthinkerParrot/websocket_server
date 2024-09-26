const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { Worker } = require('worker_threads');
const WebSocket = require("ws");
const RedisClient = require("./redisClient");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {

  const wss = new WebSocket.Server({ port: 8080 });

  console.log(`Worker ${process.pid} started`);

  const getBenchmarksWorker = new Worker('./benchmarkWorker.js');

  wss.on("connection", (ws) => {
    const rClient = new RedisClient();

    const sseInterval = setInterval(() => {
      const message = "Server Side Event from Server";
      ws.send(JSON.stringify({ type: "SSE", data: message }));
    }, 30000);

    ws.on("message", async (req) => {
      const data = JSON.parse(req);
      switch (data.type) {
        case "benchmark":
          getBenchmarksWorker.on('message', (benchmarks) => {
            ws.send(JSON.stringify({ type: "benchmark", data: benchmarks }));
          });
          getBenchmarksWorker.postMessage('start');
          break;

        case "connect":
          const sessionID = uuidv4();
          await rClient.connect(sessionID);
          ws.send(JSON.stringify({ type: "connect_id", data: sessionID }));
          break;

        case "disconnect":
          await rClient.disconnect(data.sessionID);
          break;

        case "connect_id":
          const sessionFound = await rClient.find(data.sessionID);
          if (sessionFound) {
            await rClient.connect(data.sessionID);
            ws.send(JSON.stringify({ type: "connect_id", data: data.sessionID }));
          } else {
            ws.send(
              JSON.stringify({
                type: "connect_id_error",
                data: "Session not found",
              })
            );
          }
          break;

        case "message":
          const count = await rClient.getCount();
          ws.send(
            JSON.stringify({
              type: "message",
              data: `Hi from Server - the current clients count is ${count}`,
            })
          );
          break;

        default:
          console.log("unknown message");
      }
    });

    ws.on("close", () => {
      clearInterval(sseInterval);
      getBenchmarksWorker.terminate();
    });
  });
}