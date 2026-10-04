const fs = require('fs');
const file = 'frontend/src/components/workspace/OrgSwitcher.tsx';
let content = fs.readFileSync(file, 'utf8');

const prefetchLogic = `
export const prefetchOrgs = () => {
  if (typeof window === "undefined") return;
  fetch("/api/org/list")
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.organizations && data.organizations.length > 0) {
        const formattedOrgs = data.organizations.map((o: any) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          plan: o.plan || "Pro Team",
          projectsCount: o.projectsCount || 0,
          membersCount: o.membersCount || 1,
          avatarColor: "bg-indigo-600",
        }));
        cachedOrgs = formattedOrgs;
        
        let savedOrgId = localStorage.getItem("nova_active_org_id");
        cachedActiveOrg = formattedOrgs.find((o: any) => o.id === savedOrgId) || formattedOrgs[0];
        localStorage.setItem("nova_active_org_id", cachedActiveOrg.id);
      }
    });
};
`;

content = content.replace('let cachedOrgs: Organization[] | null = null;', 'let cachedOrgs: Organization[] | null = null;\n' + prefetchLogic);
fs.writeFileSync(file, content);
