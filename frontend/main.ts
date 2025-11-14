const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected');
  // ws.send('Hello from client');
  // Send a message to show connection
  // ws.send('Client connected and ready!');
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


// // Button event listener
// const button = document.getElementById('myButton') as HTMLButtonElement;
// button.addEventListener('click', () => {
//   console.log('Button clicked');
//   const userInfo = {type: 'Register', Payload: {Alias: 'barbie', Email: 'testemail', Password: 'testpass' }};
//   ws.send(JSON.stringify(userInfo));
//   const oauthToken = {Token: "043542542343"};
//   ws.send(JSON.stringify(oauthToken));

// });

// Register button event listener
const registerButton = document.getElementById('registerButton') as HTMLButtonElement;
registerButton.addEventListener('click', () => {
  console.log('Register button clicked');
  const userInfo = {
    type: 'Register', 
    Payload: {
      Alias: 'Hulk Hogan', 
      Email: 'testemail', 
      Password: 'testpass' 
    }
  };
  ws.send(JSON.stringify(userInfo));
});

// Login button event listener
const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
loginButton.addEventListener('click', () => {
  console.log('Login button clicked');
  const loginInfo = {
    type: 'Login',
    Payload: {
      Alias: 'Hulk Hogan',
      Password: 'testpass'
    }
  };
  ws.send(JSON.stringify(loginInfo));
});