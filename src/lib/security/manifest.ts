import { attr, findChildren, parseAndroidManifest, type AxmlElement } from "./axml";

export type ComponentInfo = {
  name: string;
  exported: boolean | "unspecified";
  hasIntentFilter: boolean;
  permission: string | null;
};

export type DeepLink = { scheme: string | null; host: string | null; pathPrefix: string | null };

export type ManifestInfo = {
  packageName: string | null;
  versionName: string | null;
  versionCode: string | null;
  minSdk: number | null;
  targetSdk: number | null;
  permissions: string[];
  activities: ComponentInfo[];
  services: ComponentInfo[];
  receivers: ComponentInfo[];
  providers: ComponentInfo[];
  exportedComponents: string[];
  deepLinks: DeepLink[];
};

function hasIntentFilterAction(el: AxmlElement, actionName: string): boolean {
  return findChildren(el, "intent-filter").some((f) =>
    findChildren(f, "action").some((a) => attr(a, "name") === actionName)
  );
}

function component(el: AxmlElement): ComponentInfo {
  const exportedAttr = attr(el, "exported");
  const hasFilter = findChildren(el, "intent-filter").length > 0;
  return {
    name: attr(el, "name") ?? "",
    exported: exportedAttr === undefined ? "unspecified" : exportedAttr === "true",
    hasIntentFilter: hasFilter,
    permission: attr(el, "permission") ?? null,
  };
}

function collectDeepLinks(applicationChildren: AxmlElement[]): DeepLink[] {
  const links: DeepLink[] = [];
  for (const comp of applicationChildren) {
    for (const filter of findChildren(comp, "intent-filter")) {
      const isView = hasIntentFilterAction(comp, "android.intent.action.VIEW");
      if (!isView) continue;
      const dataEls = findChildren(filter, "data");
      for (const d of dataEls) {
        const scheme = attr(d, "scheme") ?? null;
        const host = attr(d, "host") ?? null;
        const pathPrefix = attr(d, "pathPrefix") ?? attr(d, "path") ?? null;
        if (scheme || host || pathPrefix) links.push({ scheme, host, pathPrefix });
      }
    }
  }
  return links;
}

export function parseManifest(buf: Buffer): ManifestInfo {
  const manifest = parseAndroidManifest(buf);

  const packageName = attr(manifest, "package") ?? null;
  const versionName = attr(manifest, "versionName") ?? null;
  const versionCode = attr(manifest, "versionCode") ?? null;

  const usesSdk = findChildren(manifest, "uses-sdk")[0];
  const minSdk = usesSdk ? Number(attr(usesSdk, "minSdkVersion") ?? "0") || null : null;
  const targetSdk = usesSdk ? Number(attr(usesSdk, "targetSdkVersion") ?? "0") || null : null;

  const permissions = findChildren(manifest, "uses-permission")
    .concat(findChildren(manifest, "uses-permission-sdk-23"))
    .map((p) => attr(p, "name") ?? "")
    .filter(Boolean);

  const application = findChildren(manifest, "application")[0];
  const activityEls = application ? findChildren(application, "activity") : [];
  const serviceEls = application ? findChildren(application, "service") : [];
  const receiverEls = application ? findChildren(application, "receiver") : [];
  const providerEls = application ? findChildren(application, "provider") : [];

  const activities = activityEls.map(component);
  const services = serviceEls.map(component);
  const receivers = receiverEls.map(component);
  const providers = providerEls.map(component);

  const exportedComponents = [...activities, ...services, ...receivers, ...providers]
    .filter((c) => c.exported === true)
    .map((c) => c.name);

  const deepLinks = application ? collectDeepLinks(activityEls) : [];

  return {
    packageName,
    versionName,
    versionCode,
    minSdk,
    targetSdk,
    permissions,
    activities,
    services,
    receivers,
    providers,
    exportedComponents,
    deepLinks,
  };
}
