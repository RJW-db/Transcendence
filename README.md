## Installation
- npm install

## Run Transcendence
- npx ts-node --esm src/main.ts

---

## Using the Logger

You can import and use the shared logger anywhere in your project.
it prints to console and create logs in logs/

**Example:**
```ts
import logger from "./logger/logger.ts";

logger.trace('Trace log');
logger.debug('Debug log');
logger.info('Info log');
logger.warn('Warning log');
logger.error('Error log');
logger.fatal('Fatal error occurred');
```