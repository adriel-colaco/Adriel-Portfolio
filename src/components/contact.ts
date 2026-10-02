/** The contact links shared by the menu and the footer. */
export const WHATSAPP_URL = "https://wa.me/5541999523617";
export const EMAIL = "adriel.colaco2@gmail.com";
export const EMAIL_URL = `mailto:${EMAIL}`;

/** Opens external links (WhatsApp) in a new tab; mailto stays in place. */
export const externalProps = (href: string) =>
  href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};
