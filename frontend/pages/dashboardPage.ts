import { fetchWithJWTRefresh } from "../login/fetchWithJWTRefresh";

export async function dashboardPage() {
    const container = document.createElement('div');
    
    container.className = '';
    console.log("Loading dashboard page");
    const htmlResponse = await fetch('../html/dashboard.html');
    // const htmlResponse = await fetch('../html/editProfile.html');
    
    container.innerHTML = await htmlResponse.text();
    
    loadDashboard(container);

    const dashboardInfo = container.querySelector('#profileCard');
    const editProfileForm = container.querySelector('#editForm');
    const editProfileBtn = container.querySelector('#editProfileBtn');
    editProfileBtn?.addEventListener('click', (e => {
        e.preventDefault();
        history.pushState(null, '', '/editProfile');
        const popStateEvent = new PopStateEvent('popstate');
        window.dispatchEvent(popStateEvent);
        return false;
    }));

    return container;
}

async function loadDashboard(container: HTMLDivElement) {
    const response = await fetchWithJWTRefresh('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'getLoginInfo',
        }),
    });
    if (!response.ok) {
        console.error('Failed to fetch user info:', response.statusText);
        window.location.href = '/login';
        return container;
    }
    const result = await response.json();
    if (!result.user) {
        console.error('Failed to fetch user info:', response.statusText);
        window.location.href = '/login';
        return container;
    }
    console.log('User info:', result.user);
    const aliasElement = container.querySelector('#alias');
    const emailElement = container.querySelector('#email');
    if (aliasElement) aliasElement.textContent = result.user.Alias;
    if (emailElement) emailElement.textContent = result.user.Email;

    const accountCreationDate = new Date(result.user.CreationDate);
    const formattedDate = accountCreationDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const creationDateElement = container.querySelector('#creationDate');
    const onlineStatusElement = container.querySelector('#online');
    const accountTypeElement = container.querySelector('#accountType');
    const gamesWonElement = container.querySelector('#gamesWon');
    if (creationDateElement) creationDateElement.textContent = formattedDate;
    if (onlineStatusElement) onlineStatusElement.textContent = result.user.Online === 'true' ? 'Online' : 'Offline';
    if (accountTypeElement) accountTypeElement.textContent = result.user.AccountType;
    if (gamesWonElement) gamesWonElement.textContent = result.user.GamesWon.toString();
    console.log('User info displayed on dashboard');
    const profilePictureResponse = await fetchWithJWTRefresh('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'getProfilePicture',
            Payload: {
                userID: result.user.ID,
            }
        }),
    });
    console.log('Profile picture response:', profilePictureResponse);
    if (!profilePictureResponse.ok) {
        console.error('Failed to fetch profile picture:', profilePictureResponse.statusText);
        return container;
    }
    const profilePictureElement = container.querySelector('#profilePicture') as HTMLDivElement | null;
    if (!profilePictureElement) {
        console.error('Failed to find profile picture element');
        return container;
    }
    const imageBlob = await profilePictureResponse.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    profilePictureElement.innerHTML = '';
    const img = document.createElement('img');
    console.log('Profile picture URL:', imageUrl);
    console.log("profile picture size:", imageBlob.size, "bytes");
    img.src = imageUrl;
    img.alt = 'Profile Picture';
    img.className = 'w-32 h-32 rounded-full object-cover';
    profilePictureElement.appendChild(img);
    console.log('Profile picture displayed on dashboard');
}
