import tempHomePageHtml from "../html/tempHomePage.html?raw";
import { appRoot } from "../main";

export async function showTempHomePage(): Promise<void> {
    appRoot.innerHTML = tempHomePageHtml;
    const emailSpan = appRoot.querySelector('#userEmail');
    const aliasSpan = appRoot.querySelector('#userAlias');
    const userIdSpan = appRoot.querySelector('#userId');

    const userEmail = localStorage.getItem("userEmail") || 'Unknown';
    const userAlias = localStorage.getItem("userAlias") || 'Unknown';
    const userId = localStorage.getItem("userId") || 'Unknown';

    if (emailSpan) emailSpan.textContent = userEmail;
    if (aliasSpan) aliasSpan.textContent = userAlias;
    if (userIdSpan) userIdSpan.textContent = userId;

    const logoutButton = appRoot.querySelector('#LogoutButton');
    logoutButton?.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("Logging out user...");
        
        const logoutText = appRoot.querySelector('#tempHomePageError');
        localStorage.clear();
        const response = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'logoutUser',
                Payload: {}
            }),
        });
        const result : any = await response.json();
        if (!response.ok) { // Check if the request was successful (status code 2xx)
            console.log('logout failed:', result.message);
            logoutText && (logoutText.textContent = result.message ?? 'Logout failed.');
            return;
        }
        console.log('logout successful:', result.message);
        window.location.hash = '#login';
    })
};