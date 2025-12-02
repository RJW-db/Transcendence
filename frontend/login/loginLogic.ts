import { appRoot, showHomePage} from "../main";

export async function showLoginPage() {
    const res = await fetch('/html/loginPage.html');
    appRoot.innerHTML = await res.text();

    const form = appRoot.querySelector('form');
  const errorBox = appRoot.querySelector('#loginError');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'loginUser',
                Payload: {
                    Email: formData.get('email'),
                    Password: formData.get('password')
                }
            }),
        });
    const result = await response.json();

    if (!response.ok) { // Check if the request was successful (status code 2xx)
      console.log('login failed:', result.message);
      errorBox && (errorBox.textContent = result.message ?? 'Login failed.');
      return;
    }
    else
      console.log('login successful:', result.message);
    showHomePage();
    }
    );

}
