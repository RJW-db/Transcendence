import { error } from "node:console";
import { loginUser } from "../login/loginLogic";
import { fetchWithJWTRefresh } from "../login/fetchWithJWTRefresh";
import { oauthSignIn } from "../login/auth";

export async function loginPage() {
  const container = document.createElement('div');
  container.className = '';
  const response = await fetch("../html/loginPage.html");
  container.innerHTML = await response.text();

  const guestLogin = container.querySelector('#guestLogin');
  guestLogin?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    console.log('Guest login clicked');
    // loginGuestUser();
    return true;
  });

  const oauthLogin = container.querySelector('#loginWithGoogle');
  oauthLogin?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    console.log('OAuth login clicked');
    oauthSignIn();
    return true;
  });
  
  const form = container.querySelector('form');
  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    const errorBox = container.querySelector('#loginError');
    console.log("logging in user");
    loginUser(form, errorBox);
  });
    return container;
}

async function guestLogin(container: HTMLDivElement) {

  const guestLoginHtml = await fetch("../html/guestLogin.html");
  container.innerHTML = await guestLoginHtml.text();

  
  
  const form : HTMLFormElement = container.querySelector('form');
  const errorBox = container.querySelector('#guestLoginError');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const alias = data.get('alias') as string;
    console.log('Creating guest account with alias:', alias);
    const response = await fetchWithJWTRefresh('/api', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'createGuestAccount',
        Payload: {
          Alias: alias
        }
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.log('login failed:', result.message);
      errorBox!.textContent = `Error: ${result.message}`;
      setTimeout(() => {
        errorBox!.textContent = '';
      }, 2000);
      return;
    }
    else {
      console.log('Guest account created successfully:', result.message);
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("userAlias", result.user.alias);
      localStorage.setItem("userId", result.user.userID);
      localStorage.setItem("guestUser", "true");
      window.location.href = '';
    }
  });
  

}