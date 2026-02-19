export async function loginPage() {
  const container = document.createElement('div');
  container.className = '';
  const response = await fetch("../html/loginTest.html");
  container.innerHTML = await response.text();
    return container;
}