const { parentPort } = require('worker_threads');
const get_memory_usage = require("./utils/memory_usage");
const get_cpu_usage = require("./utils/cpu_usage");

const getBenchmarks = () => {
  return {
    cpu: get_cpu_usage(),
    memory: get_memory_usage(),
  };
};

parentPort.on('message', (message) => {
  if (message === 'start') {
    setInterval(() => {
      const benchmarks = getBenchmarks();
      parentPort.postMessage(benchmarks);
    }, 1000);
  }
});