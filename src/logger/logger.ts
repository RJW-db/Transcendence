import pino, { Logger } from "pino";

const transport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      level: "trace",
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: "SYS:yyyy-mm-dd, HH:MM:ss",
        messageFormat: "{msg}"
      }
    },
    {
      target: "pino/file",
      level: "trace",
      options: {
        destination: "./logs/entire.log",
        mkdir: true,
        append: true
      }
    },
    {
      target: "pino/file",
      level: "warn",
      options: {
        destination: "./logs/errors-warnings.log",
        mkdir: true,
        append: true
      }
    }
  ]
});

const logger: Logger = pino({ level: "trace" }, transport);

export default logger;
