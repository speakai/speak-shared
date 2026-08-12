/** Stable ids for the main left sidebar items, shared by client and server. */
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

/** System default order the user starts from and can reset to (Home first). */
export const SIDEMENU_DEFAULT_ORDER: MenuItemId[] = [
  MenuItemId.Home,
  MenuItemId.Dashboards,
  MenuItemId.Explore,
  MenuItemId.MeetingAssistant,
  MenuItemId.Chat,
  MenuItemId.Favorites,
  MenuItemId.Folders,
  MenuItemId.Recorder,
  MenuItemId.Media,
  MenuItemId.Clips,
  MenuItemId.Automations,
  MenuItemId.Integrations,
  MenuItemId.Team,
  MenuItemId.Developers,
];

/** Never user-hideable, guarantees a non-empty sidebar. */
export const SIDEMENU_CORE_ANCHORS: MenuItemId[] = [MenuItemId.Home];
