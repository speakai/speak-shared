# Side-menu preferences — @speakai/shared (v1)

Part of the "user-level side-menu preferences" feature: each user reorders and hides
their own left sidebar. The full visual PRD (with live screenshots) lives with Vatsal
(`speak-server/plans/user-menu-personalization-prd.html`). This doc is the shared-package slice.

Scope: v1 is user-level reorder + hide of the main sidebar only. Company-level feature
flags (`company.flags`) are v2 and not part of this work.

## S1 — Add a small menu registry (non-sensitive)

The client and server both need to agree on the set of valid menu ids and the default
order, so they can't drift. Add this to the shared package (it contains only ids that
already ship inside the client bundle, nothing sensitive).

```ts
export enum MenuItemId {
  Home = 'home',
  Dashboards = 'dashboards',
  Explore = 'explore',
  MeetingAssistant = 'meeting-assistant',
  Chat = 'chat',
  Favorites = 'favorites',
  Folders = 'folders-root',
  Recorder = 'recorder',
  Media = 'embed-media',
  Clips = 'clips',
  Automations = 'automations',
  Integrations = 'integrations',
  Team = 'team-manage',
  Developers = 'developers-manage',
}

// System default order the user starts from and can reset to.
export const SIDEMENU_DEFAULT_ORDER: MenuItemId[] = [ /* current sidebar order */ ];

// Never user-hideable, guarantees a non-empty sidebar.
export const SIDEMENU_CORE_ANCHORS: MenuItemId[] = [MenuItemId.Home];
```

Ids are the exact stable ids used today in `speak-client/src/config/menu.ts`.

## Consumers
- **speak-server** validates `PUT /v1/user/menu-preferences` ids against `MenuItemId`.
- **speak-client** resolves the user order and guards the core anchor.

## Deploy + acceptance
- Publish the new shared version, then bump the dependency in speak-server and speak-client.
- Acceptance: types exported, `build` green, no runtime behavior on its own.
