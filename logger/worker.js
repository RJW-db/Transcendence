import { parentPort } from 'node:worker_threads';
import path from 'node:path';
import chalk from 'chalk';

const levelColors = {
  TRACE: chalk.gray,
  DEBUG: chalk.cyan,
  INFO: chalk.green,
  WARN: chalk.yellow,
  ERROR: chalk.red,
  FATAL: chalk.bgRed.white
};

parentPort.on('message', (log) => {
  const { level, message, file, line, timestamp } = log;
  const lvl = (level || 'INFO').toUpperCase();
  const color = levelColors[lvl] || ((s) => s);

  const filename = file ? path.basename(file) : 'unknown';
  const lineno = line || 'unknown';

  console.log(`${chalk.gray(timestamp)} ${color(lvl.padEnd(5))} ${chalk.blue(filename)}:${chalk.magenta(lineno)} ${message}`);
});
