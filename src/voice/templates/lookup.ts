import {
  AGENT_TEMPLATES,
  AGENT_TEMPLATE_IDS,
  BLANK_TEMPLATE,
  type AgentTemplate,
  type AgentTemplateId,
} from "./agent-templates.js";

/** Every template, blank included, in the order a picker should show them. */
export const ALL_AGENT_TEMPLATES: AgentTemplate[] = [BLANK_TEMPLATE, ...AGENT_TEMPLATES];

const BY_ID = new Map<string, AgentTemplate>(ALL_AGENT_TEMPLATES.map((tpl) => [tpl.id, tpl]));

/** Narrow an untrusted string — a URL param, a stored value — to a known id. */
export const isAgentTemplateId = (value: unknown): value is AgentTemplateId =>
  typeof value === "string" && (AGENT_TEMPLATE_IDS as readonly string[]).includes(value);

/**
 * Resolve a template by id. Returns undefined for anything unrecognised so
 * callers can fall back rather than render a broken selection.
 */
export const getAgentTemplateById = (id: string | null | undefined): AgentTemplate | undefined =>
  id ? BY_ID.get(id) : undefined;

/** Display name for an id, for surfaces that hold only the id. */
export const getAgentTemplateName = (id: string | null | undefined): string | undefined =>
  getAgentTemplateById(id)?.name;
