const os = require('os');
const get_memory_usage = () => {
    const total_memory = os.totalmem();
    const free_memory = os.freemem();
    const used_memory = total_memory - free_memory;
    const memory_usage = (used_memory / total_memory) * 100;
    return memory_usage;
};

module.exports = get_memory_usage;