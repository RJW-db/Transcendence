const ws = new WebSocket('ws://localhost:5173/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send('Hello from client');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};
