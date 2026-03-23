export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  username = username.trim();
  if (!usernameRegex.test(username)) {
    throw new Error('Username can only contain letters, numbers, dot, underscore, and hyphen');
  }
  return username;
}