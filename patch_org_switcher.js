const fs = require('fs');
const file = 'frontend/src/components/workspace/OrgSwitcher.tsx';
let content = fs.readFileSync(file, 'utf8');

const cacheLogic = `
let cachedOrgs: Organization[] | null = null;
let cachedActiveOrg: Organization | null = null;

export const OrgSwitcher: React.FC<{ asMenuItem?: boolean }> = ({ asMenuItem }) => {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>(cachedOrgs || []);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(cachedActiveOrg);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
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
          setOrganizations(formattedOrgs);
          cachedOrgs = formattedOrgs;

          let savedOrgId = null;
          if (typeof window !== "undefined") {
            savedOrgId = localStorage.getItem("nova_active_org_id");
          }

          const targetOrg =
            formattedOrgs.find((o: any) => o.id === savedOrgId) ||
            formattedOrgs[0];
          setActiveOrg(targetOrg);
          cachedActiveOrg = targetOrg;
          if (typeof window !== "undefined") {
            localStorage.setItem("nova_active_org_id", targetOrg.id);
          }
        }
      });
  }, []);
`;

content = content.replace(
  /export const OrgSwitcher: React\.FC<\{ asMenuItem\?: boolean \}> = \(\{ asMenuItem \}\) => \{[\s\S]*?\}, \[\]\);/m,
  cacheLogic.trim()
);

fs.writeFileSync(file, content);
