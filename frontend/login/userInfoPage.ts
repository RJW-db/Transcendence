import { appRoot, showHomePage} from "../main";

export async function showUserInfoPage() {
    const res = await fetch('/html/showUserInfo.html');
    appRoot.innerHTML = await res.text();
    const userInfoDiv = appRoot.querySelector('#user-details');

    // Fetch user info from the server
    const response = await fetch('/api?type=getUserInfo', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    const result = await response.json();
    if (!response.ok) {
        console.log('Failed to fetch user info:', result.message);
        userInfoDiv && (userInfoDiv.textContent = result.message ?? 'Failed to fetch user info.');
        await new Promise(resolve => setTimeout(resolve, 2000));
        showHomePage();
        
    }    
    const user = result.user;
    const fields: Record<string, string> = {
        username: user.Alias,
        email: user.Email,
        joinedDate: user.CreationDate,
        status: user.Online
    };

    userInfoDiv?.querySelectorAll('[data-field]').forEach((el) => {
        const key = (el as HTMLElement).dataset.field ?? '';
        if (key in fields) el.textContent = fields[key];
    }); 

    console.log('Fetched user info:', result);
    // userInfoDiv && (userInfoDiv.textContent = `Alias: ${user.Alias}, Email: ${user.Email}, Created At: ${new Date(user.CreationDate).toLocaleString()}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    showHomePage();
    }
