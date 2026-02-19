import { error } from "node:console";
import { loginUser } from "../login/loginLogic";

export async function loginPage() {
  const container = document.createElement('div');
  container.className = '';
  const response = await fetch("../html/loginTest.html");
  container.innerHTML = await response.text();
  const guestLogin = container.querySelector('#guestLogin');
  guestLogin?.addEventListener('click', (e: Event) => {
    e.preventDefault();
    console.log('Guest login clicked');
    // loginGuestUser();
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