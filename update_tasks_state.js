const fs = require('fs');
const file = 'frontend/src/app/app/tasks/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add states
content = content.replace(
  'const [selectedAssignee, setSelectedAssignee] = useState<string>("all");',
  `const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");`
);

// Add Project to imports
if (!content.includes('import { Project, Task,')) {
    content = content.replace('import { Task, TaskPriority', 'import { Project, Task, TaskPriority');
}

// Update fetchTasks
const oldFetchTasks = `  const fetchTasks = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get("projectId");
      let url = "/api/tasks";
      if (projectId) {
        url += \`?projectId=\${encodeURIComponent(projectId)}\`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setIsLoading(false);
    }
  };`;

const newFetchTasks = `  const fetchTasks = async (overrideProjectId?: string) => {
    try {
      let activeProjectId = overrideProjectId;
      if (activeProjectId === undefined) {
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const urlProject = urlParams.get("projectId");
          if (urlProject) {
            activeProjectId = urlProject;
            localStorage.setItem("nova_tasks_project", urlProject);
            setSelectedProject(urlProject);
            // Optionally clear it from URL so refresh doesn't force it? 
            // We'll just leave it for now.
          } else {
            const saved = localStorage.getItem("nova_tasks_project");
            if (saved) {
              activeProjectId = saved;
              setSelectedProject(saved);
            } else {
              activeProjectId = "all";
            }
          }
        }
      }

      let url = "/api/tasks";
      if (activeProjectId && activeProjectId !== "all") {
        url += \`?projectId=\${encodeURIComponent(activeProjectId)}\`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch(e) {}
  };

  const handleProjectFilterChange = (val: string) => {
    setSelectedProject(val);
    if (val === "all") {
      localStorage.removeItem("nova_tasks_project");
    } else {
      localStorage.setItem("nova_tasks_project", val);
    }
    
    // Also remove from URL to avoid confusion if we change dropdown
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("projectId")) {
         url.searchParams.delete("projectId");
         window.history.replaceState({}, "", url.toString());
      }
    }

    fetchTasks(val);
  };`;

content = content.replace(oldFetchTasks, newFetchTasks);

// Update useEffect
content = content.replace(
  'fetchTeam();',
  'fetchTeam();\n    fetchProjectsList();'
);

fs.writeFileSync(file, content);
