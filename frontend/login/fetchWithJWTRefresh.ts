export async function fetchWithJWTRefresh(url: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // Step 2: Server returns 401 token_expired
  if (response.status === 401) {
    // Step 3: Client calls POST /auth/refresh
    const refreshResponse = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    // Step 4: Server validates refresh token
    if (refreshResponse.ok) {
      // Step 5: Client retries original request with new JWT
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    } else {
      // Refresh failed - logout
      localStorage.clear();
      console.log('Session expired. Please log in again hier hier.');
      window.location.href = '/login';
    }
  }

  return response;
}
