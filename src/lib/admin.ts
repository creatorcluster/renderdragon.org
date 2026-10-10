export const ADMIN_EMAILS = [
  'yamura@duck.com',
  'theckie@protonmail.com',
  'vovoplaygame3@gmail.com',
];

export const isAdminEmail = (email?: string | null): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(email as string);
