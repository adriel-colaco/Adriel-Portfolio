// Set once the loading screen's curtain has gone up, so it only plays on the
// first load of a visit: coming back home (client-side or via a full page load)
// skips it. The inline script in layout.tsx reads it before the first paint and
// flags <html data-site-loaded>, which hides the server-rendered screen
// (globals.css). Kept out of SiteLoader so the server layout can import it.
export const SITE_LOADED_KEY = "site-loaded";

/** Flags the loading screen as shown for this visit (client only). */
export function markSiteLoaded() {
  document.documentElement.dataset.siteLoaded = "";
  try {
    sessionStorage.setItem(SITE_LOADED_KEY, "1");
  } catch {
    // Storage blocked: the flag on <html> still covers client-side navigation.
  }
}
