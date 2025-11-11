const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send('Hello from client');
  // Send a message to show connection
  ws.send('Client connected and ready!');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from server');
};


// Button event listener
const button = document.getElementById('myButton') as HTMLButtonElement;
button.addEventListener('click', () => {
  console.log('Button clicked');
  ws.send('Button was clicked!');
});