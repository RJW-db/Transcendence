// // import logger from "./logger/logger.ts";

// // logger.trace('Trace log');
// // logger.debug('Debug log');
// // logger.info('Info log');
// // logger.warn('Warning log');
// // logger.error('Error log');
// // logger.fatal('Fatal error occurred');

// 'use strict'

// import {basename} from 'path'

// function getLineAndFile() {
//   const err = new Error()
//   const stack = err.stack?.split('\n') ?? []

//   // Find first stack line that refers to your source code
//   const frame = stack.find(l =>
//     l.includes('.ts:') || l.includes('.js:')
//   )
//   if (!frame) return null

//   const match = frame.match(/\((.*):(\d+):(\d+)\)/)
//   if (!match) return null

//   let [, file, line, column] = match
//   file = basename(file);
//   return { file, line: Number(line), column: Number(column) }
// }

// import pino from 'pino'

// const logger = pino({ level: 'debug' })

// export function log(msg: string) {
//   const pos = getLineAndFile()
//   if (pos) {
//     logger.info({ file: pos.file, line: pos.line }, msg)
//   } else {
//     logger.info(msg)
//   }
// }


// // import { dirname } from 'path'
// // import { fileURLToPath } from 'url'

// // const __filename = fileURLToPath(import.meta.url)
// // export const __dirname = dirname(__filename)

// // import pino from "pino";
// // import pinoCaller from "pino-caller";

// // const logger = pinoCaller(pino(), {
// //   relativeTo: __dirname,
// //   stackAdjustment: 1
// // });

// // declare module "pino-caller" {
// //   import { Logger } from "pino";
// //   function pinoCaller(
// //     logger: Logger,
// //     options?: {
// //       relativeTo?: string;
// //       stackAdjustment?: number;
// //     }
// //   ): Logger;

// //   export default pinoCaller;
// // }

// logger.info('info1');
// logger.error('error1');
// logger.debug('debug1');

// log("hello");


import pino from 'pino'
import pinoCaller from 'pino-caller'

const logger = pinoCaller(pino())
logger.error('This will log the file and line number')

