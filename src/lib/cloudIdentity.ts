export function cloudLoginEmail(usernameOrEmail: string): string {
  const normalized = usernameOrEmail.trim().toLowerCase();
  return normalized.includes('@') ? normalized : `${normalized}@login.rohner-app.ch`;
}
