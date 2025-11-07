const ws = new WebSocket('ws://localhost:5173/ws');

import passport from 'passport';



ws.onopen = () => {
  console.log('Connected');
  ws.send('Hello from client');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

// Login button logic
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    console.log('Login button clicked');
    // Add your login logic here
  });
}
else
{
  console.log('no login')
}