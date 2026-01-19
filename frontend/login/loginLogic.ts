import { appRoot, showHomePage} from "../main";
import loginPageHtml from '../html/loginPage.html?raw';
import { oauthSignIn } from "./auth";


export async function showLoginPage() :Promise<void> {
    appRoot.innerHTML = loginPageHtml;

    const form = appRoot.querySelector('form');
    const googleBtn = appRoot.querySelector('#loginWithGoogle');


  const errorBox = appRoot.querySelector('#loginError');

  googleBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    oauthSignIn();
  });



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
                    Password: formData.get('password'),
                    Token2fa: formData.get('2faToken')
                }
            }),
        }

      );
      const result = await response.json();
      if (!response.ok) {
        console.log('login failed:', result.message);
        errorBox!.textContent = `Error: ${result.message}`;
        return ;
      }
      
      

    window.location.hash = '';
    }
    );

}


async function userLoggedIn(): Promise<boolean>
{
      const response = await fetch('/api?type=getUserInfo', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok)
    {
      return false;
    }
    return true;
}