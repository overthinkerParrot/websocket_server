const os = require('os');
const get_cpu_times = () => {
    const cpus = os.cpus();
    let totalIdleTime = 0;
    let totalActiveTime = 0;

    cpus.forEach((cpu) => {
        totalIdleTime += cpu.times.idle;
        totalActiveTime += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
    });

    const totalTime = totalIdleTime + totalActiveTime;

    return { totalIdleTime, totalActiveTime, totalTime };
};

let lastCpuUsage = get_cpu_times();

const get_cpu_usage = () => {
    const currentCpuUsage = get_cpu_times();

    const idleDiff = currentCpuUsage.totalIdleTime - lastCpuUsage.totalIdleTime;
    const totalDiff = currentCpuUsage.totalTime - lastCpuUsage.totalTime;

    const cpuUsagePercentage = 100 * (1 - idleDiff / totalDiff);

    lastCpuUsage = currentCpuUsage;

    return cpuUsagePercentage;
};

module.exports = get_cpu_usage;