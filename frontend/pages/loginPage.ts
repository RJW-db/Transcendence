export function loginPage() {
    const container = document.createElement('div');
    container.className = '';
    container.innerHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Login</title>
  </head>
  <div class="flex items-center justify-center dark:text-white">
    <div class="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto flex flex-col items-center dark:bg-neutral-900">
      <form method="post" class="w-full flex flex-col gap-4">
        <h1 class="italic text-2xl font-bold text-center mb-4 text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 group-hover:from-cyan-300 group-hover:to-indigo-400 transition-all">Login</h1>
        <!-- <label for="email" class="font-semibold ">Username</label> -->
        <input type="text" name="email" class="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-body" placeholder="Email" required autocomplete="username">
        <input type="password" name="password" class="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-body" placeholder="Password" required autocomplete="current-password">
        <input type="token" name="2faToken" class="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-body" placeholder="2faToken" required maxlength="6">
        <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-1 rounded transition">Sign In</button>
        <button type="button" id="loginWithGoogle" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-1 rounded transition">Google Login</button>
        <p id="loginError" class="text-red-500 text-center"></p>
        <div class="bg-center text-center">
          <p> Don't have an account? </p>
          <a class="text-blue-500 hover:text-blue-600 ml-1 whitespace-pre-line" href="#register">Sign up</a><br>
          <a id="guestLogin" class="text-blue-500 hover:text-blue-600 ml-1" href="#register">Login as Guest</a><br>
      </div>
        </form>
    </div>
  </div>
</html>`;

    return container;
}