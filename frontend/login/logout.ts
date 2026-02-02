import { appRoot, showHomePage} from "../main";
import logoutPageHtml from '../html/logoutPage.html?raw';

export async function showLogoutPage() {
    appRoot.innerHTML = logoutPageHtml;
    const logoutText = appRoot.querySelector('#logout-message');

    const response = await fetch('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'logoutUser',
            Payload: { }
        }),
    });
    const result = await response.json();
    if (!response.ok) { // Check if the request was successful (status code 2xx)
        console.log('logout failed:', result.message);
        logoutText && (logoutText.textContent = result.message ?? 'Logout failed.');
    }
    else {
        console.log('logout successful:', result.message);
        logoutText && (logoutText.textContent = 'Logout successful. Redirecting to home page...');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    window.location.hash = '';
}