import { ThemeDefinition } from "@platform/theme-engine";

export const nova_workspaceTheme: ThemeDefinition = {
  id: "nova-workspace",
  name: "nova-workspace",
  category: "Custom Theme",
  description: "nova-workspace theme package.",
  version: "1.0.0",
  capabilities: { cms: true, commerce: true },
  sections: [],
  templates: [{ id: "index", name: "Homepage", type: "index", defaultSections: [] }],
  globalSettings: [],
  defaultGlobalSettings: {}
};
