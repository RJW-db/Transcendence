import { registerNewUser } from "../login/registerLogic";

export async function registerPage() {
  const container : HTMLDivElement = document.createElement('div');
  container.className = '';
  const response = await fetch("../html/registerPage.html");
  container.innerHTML = await response.text();

  const form = container.querySelector('form');

  form?.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    registerNewUser(container);
    return ;
    
  });
    return container;
}