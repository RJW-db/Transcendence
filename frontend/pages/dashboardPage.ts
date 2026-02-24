import { fetchWithJWTRefresh } from "../login/fetchWithJWTRefresh";

export async function dashboardPage() {
    const container = document.createElement('div');

    container.className = '';
    console.log("Loading dashboard page");
    const htmlResponse = await fetch('../html/dashboard.html');
    container.innerHTML = await htmlResponse.text();
    loadDashboard(container);
    const editProfileBtn = container.querySelector('#editProfileBtn');
    editProfileBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Edit profile clicked');
        // reveal edit profile form and hide dashboard info
        const dashboardInfo = container.querySelector('#profileCard');
        const editProfileForm = container.querySelector('#editForm');
        if (dashboardInfo && editProfileForm) {
            dashboardInfo.classList.add('hidden');
            editProfileForm.classList.remove('hidden');
        }
        else
        {
            if (!dashboardInfo) console.error('Failed to find dashboard info element');
            if (!editProfileForm) console.error('Failed to find edit profile form element');
        }
    });
    
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

    const profilePictureElement = container.querySelector('#profilePicture');
    if (profilePictureElement && result.user.ProfilePicture) {
        const blob = new Blob([new Uint8Array(result.user.ProfilePicture.data)], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        profilePictureElement.innerHTML = `<img src="${url}" alt="Profile Picture" class="w-24 h-24 rounded-full object-cover">`;
    }
}