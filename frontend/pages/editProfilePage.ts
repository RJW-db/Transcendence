import { fetchWithJWTRefresh } from "../login/fetchWithJWTRefresh";



export async function editProfilePage() {
    const container = document.createElement('div');

    container.className = '';
    const htmlResponse = await fetch('../html/editProfile.html');
    
    container.innerHTML = await htmlResponse.text();
    editUserProfile(container);
    return container;
}


async function editUserProfile(container: HTMLDivElement) {
    const form = container.querySelector('#profileForm') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const alias = formData.get('alias') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const fileUploadInput = container.querySelector('#profilePictureUpload') as HTMLInputElement | null;
        if (!fileUploadInput) {
            console.error('Failed to find profile picture input element');
        }
        else
        {
            console.log('Profile picture input element found:', fileUploadInput);
            console.log('Selected file:', fileUploadInput.files ? fileUploadInput.files[0] : 'No file selected');
        }
        let profilePictureData: Blob | null = null;

        if (fileUploadInput && fileUploadInput.files && fileUploadInput.files.length === 1) {
            const image = fileUploadInput.files[0];
            const formData = new FormData();
            formData.append('type', 'updateUserProfilePicture');
            formData.append('profilePicture', image, image.name);
            const profilePictureResponse = await fetchWithJWTRefresh('/api', {
                method: 'POST',
                body: formData,
            });
            const result = await profilePictureResponse.json();
            if (profilePictureResponse.ok) {
                console.log('Profile picture updated successfully');
            }
            else {
                console.error('Failed to update profile picture:', result.message);
            }
            if (!profilePictureResponse.ok) {
                const errorBox = container.querySelector('#errorBox') as HTMLDivElement;
                errorBox.textContent = 'Failed to update profile picture.';
                errorBox.classList.remove('hidden');
            }
            if (!alias && !email && !password) {
                console.log('Profile updated successfully');
                history.pushState(null, '', '/dashboard');
                const popStateEvent = new PopStateEvent('popstate');
                window.dispatchEvent(popStateEvent);
                return;
            }
        }
        else if (!alias && !email && !password) {
            const errorBox = container.querySelector('#errorBox') as HTMLDivElement;
            errorBox.textContent = 'Please provide at least one field to update.';
            console.log('No fields to update');
            errorBox.classList.remove('hidden');
            return false;
        }
        if (alias || email || password) {
            const response = await submitProfileUpdate(alias, email, password);
            if (response.ok) {
                console.log('Profile updated successfully');
                history.pushState(null, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                const errorBox = container.querySelector('#errorBox') as HTMLDivElement;
                errorBox.textContent = 'Failed to update profile.';
                errorBox.classList.remove('hidden');
            }
        }
    });

    const cancelBtn = container.querySelector('#cancelEditBtn') as HTMLButtonElement;
    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState(null, '', '/dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

}



async function submitProfileUpdate(alias: string, email: string, password: string) {

    const response = await fetchWithJWTRefresh('/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'updateUserProfile',
            Payload: {
                Alias: alias,
                Email: email,
                Password: password,
            }
        }),
    });
    return response;
}