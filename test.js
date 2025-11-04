'use strict'
const pino = require('pino')()
const pinoCaller = require('pino-caller')(pino, { relativeTo: __dirname, stackAdjustment: 1 })

// People who have wrapped pino like in the contrived example below 
// will want to use stackAdjustment.
// Most people will NOT need this.  See issue #90 for details.
const log = {
  info: function(message) { pinoCaller.info(message) }
}

log.info("hello")