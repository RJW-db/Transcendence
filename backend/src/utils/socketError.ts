import { MySocket } from '../types';

export function socketError(socket: MySocket) {
  // 1. Capture the original 'on' method with its complex types
  const originalOn = socket.on;

  // 2. Use 'any' for the function signature here to satisfy the override
  socket.on = function (event: any, handler: (...args: any[]) => void) {
    
    // 3. We return the original call but wrap the listener
    return originalOn.call(socket, event, async (...args: any[]) => {
      
      // Check if the last argument is a callback
      const hasCallback = typeof args[args.length - 1] === 'function';
      const callback = hasCallback ? args[args.length - 1] : null;
      
      // Arguments minus the callback if it exists
      const params = hasCallback ? args.slice(0, -1) : args;

      try {
        // Run the actual handler
        // If it's async, it will be awaited. If sync, await still works.
        await handler(...params, callback);
      } catch (err: any) {
        console.error(`🔴 [Error in ${event}]:`, err.stack);

        const errorResponse = {
          success: false,
          message: err.message || "Internal Server Error",
          code: err.code || "INTERNAL_ERROR"
        };

        if (callback) {
          callback(errorResponse);
        } else {
          // You might need to cast socket to any here if 'error' 
          // isn't in your ServerToClientEvents interface
          (socket as any).emit('error', errorResponse);
        }
      }
    });
  } as any; // Cast the whole override to any to satisfy MySocket interface
}