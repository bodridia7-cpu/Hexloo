// The only place the offline service worker is registered.
// It never registers in development, inside the Lovable editor preview, or in an iframe.

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_DOMAINS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
const PROJECT_DEV = /^project--[a-z0-9-]+-dev$/;
const OFFLINE_ROUTES = ["/", "/play", "/shop", "/ranks"];

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  if (inIframe) return true;
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  if (PREVIEW_DOMAINS.some((d) => host.endsWith(d))) {
    if (PREVIEW_LABEL.test(label) || PROJECT_DEV.test(label)) return true;
  }
  const exactOrSub = (d: string) => host === d || host.endsWith(`.${d}`);
  if (exactOrSub("lovableproject.com") || exactOrSub("lovableproject-dev.com") || exactOrSub("beta.lovable.dev"))
    return true;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off")
    return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
        return url.endsWith("/sw.js");
      })
      .map((r) => r.unregister()),
  );
}

export async function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppWorkers();
    return;
  }
  const { Workbox } = await import("workbox-window");
  const wb = new Workbox("/sw.js", { scope: "/" });
  wb.addEventListener("activated", () => {
    // Warm the page cache so every screen opens offline, even on a cold start.
    OFFLINE_ROUTES.forEach((path) => {
      fetch(path, { headers: { accept: "text/html" }, credentials: "same-origin" }).catch(() => {});
    });
  });
  await wb.register();
}
