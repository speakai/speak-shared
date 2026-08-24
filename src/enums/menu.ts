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
  AiAssistant = 'ai-assistant',
  Fields = 'fields',
  KnowledgeBase = 'knowledge-base',
  AgentsList = 'agents-list',
  AgentsConversations = 'agents-conversations',
  AgentsPhoneNumbers = 'agents-phone-numbers',
}

/** Sidebar sections that can be reordered or hidden as blocks (primary/ungrouped and Folders stay fixed). */
export enum SectionId {
  Content = 'content',
  Workspace = 'workspace',
  Agents = 'agents',
}

/** Sections the user is allowed to reorder or hide. */
export const MANAGEABLE_SECTION_IDS: SectionId[] = [SectionId.Content, SectionId.Workspace];

/** Profile-menu items the user is allowed to manage. */
export const PROFILE_MANAGEABLE_IDS: MenuItemId[] = [MenuItemId.AiAssistant, MenuItemId.Fields];

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
  MenuItemId.KnowledgeBase,
  MenuItemId.Team,
  MenuItemId.Developers,
];

/** Never user-hideable, guarantees a non-empty sidebar. */
export const SIDEMENU_CORE_ANCHORS: MenuItemId[] = [MenuItemId.Home];
