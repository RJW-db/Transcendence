const ws = new WebSocket(`ws://${location.host}/ws`);

ws.onopen = () => {
  console.log('Connected');
  // ws.send('Hello from client');
  // Send a message to show connection
  // ws.send('Client connected and ready!');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
//   try{
// 	const data = JSON.parse(event.data);
// 	if(data.type){
// 		const handler = responseHandlers[data.type];
// 		handler(data);
// 	}
//   }catch{
// 	console.log('JSON parse failed');
//   }
  

	
 
  }
//   const response = document.getElementById('serverResponse') as HTMLElement;
//   if (data.type === 'LoginResponse'){
// 	if (data.success === true){
// 		response.style.color = 'green';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'you are successfully logged in';
// 	}else {
// 		response.style.color = 'red';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'Invalid login attempt';
// 	}
//   }


  
// };

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from server');
};



// export type ResponseHandler = (
//   data: any

// ) => Promise<void> | void;

// export const responseHandlers: Record<string, ResponseHandler> = {
//   'RegisterResponse': handleRegisterResponse,
//   'LoginResponse': handleLoginResponse
// };

// function	handleRegisterResponse(data: any){
// 	const response = document.getElementById('serverResponse') as HTMLElement;
// 	if (data.success === true){
// 		response.style.color = 'green';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'you are successfully register';
// 	}else {
// 		response.style.color = 'red';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'can\'t register use other alias or email';
// 	}
// }
// function	handleLoginResponse(data: any){
// 	const response = document.getElementById('serverResponse') as HTMLElement;
// 	if (data.success === true){
// 		response.style.color = 'green';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'you are successfully logged in';
// 	}else {
// 		response.style.color = 'red';
// 		response.style.fontSize = '24px';
// 		response.textContent = 'Invalid login attempt';
// 	}

// }


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
//   const userInfo = {
//     type: 'Register', 
//     Payload: {
//       Alias: 'Hulk Hogan', 
//       Email: 'testemail', 
//       Password: 'testpass' 
//     }
//   };
//   ws.send(JSON.stringify(userInfo));
	registerUser();
});

// Login button event listener
const loginButton = document.getElementById('loginButton') as HTMLButtonElement;
loginButton.addEventListener('click', () => {
  console.log('Login button clicked');
//   const loginInfo = {
//     type: 'Login',
//     Payload: {
//       Alias: 'Hulk Hogan',
//       Password: 'testpass'
//     }
//   };
//   ws.send(JSON.stringify(loginInfo));
	loginUser();
});

async	function registerUser(){
	try {
    	const response = await fetch('/api', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				type: 'Register',
				Payload: {
					Alias: 'Hulk Hogan',
					Email: 'testemail',
					Password: 'testpass'
				} 
			}),
    	});
		if (!response.ok) { // Check if the request was successful (status code 2xx)
			const errorData = await response.json();
			throw new Error(errorData.message || 'register failed');
		}
		const data = await response.json();
		console.log('register successful:', data);
		return data;
	} catch (error) {
		console.error('Error during register:', error.message);
		throw error; // Re-throw to be handled by the caller
	}
}

async function loginUser() {
  try {
    const response = await fetch('/api', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			},
			body: JSON.stringify({ 
				type: 'Login',
				Payload: {
					Alias: 'Hulk Hogan',
					Password: 'testpass'
				} 
			}),
    	});

		if (!response.ok) { // Check if the request was successful (status code 2xx)
		const errorData = await response.json();
		throw new Error(errorData.message || 'Login failed');
		}

		const data = await response.json();
		console.log('Login successful:', data);
		// You'll likely get a JWT token or session ID here
		// Store it (e.g., in localStorage) and redirect the user
		return data;
  	} catch (error) {
		console.error('Error during login:', error.message);
		throw error; // Re-throw to be handled by the caller
	}
}