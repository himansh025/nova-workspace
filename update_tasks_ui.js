const fs = require('fs');
const file = 'frontend/src/app/app/tasks/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFilterRow = `<div className="px-5 py-2.5 bg-[var(--nova-bg)] border-b border-[var(--nova-border-muted)] flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[var(--nova-text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="bg-transparent border-none text-[12px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] outline-none w-52 max-w-xs"
          />
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-[var(--nova-border)] shrink-0" />

        {/* Priority filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Assignee filter */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
        >
          <option value="all">All Engineers</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <div className="ml-auto text-[10px] text-[var(--nova-text-muted)] font-mono">
          {filteredTasks.length} Issues
        </div>
      </div>`;

const newFilterRow = `<div className="px-5 py-3 bg-[var(--nova-bg)] border-b border-[var(--nova-border-muted)] flex items-center justify-between shrink-0">
        {/* Left: Search */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-3 py-1.5 text-[12px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] outline-none w-full focus:border-[var(--nova-accent)] transition-colors h-8"
          />
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3">
          {/* Project filter */}
          <select
            value={selectedProject}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Engineers</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <div className="text-[10px] text-[var(--nova-text-muted)] font-mono pl-2 border-l border-[var(--nova-border)]">
            {filteredTasks.length} Issues
          </div>
        </div>
      </div>`;

content = content.replace(oldFilterRow, newFilterRow);
fs.writeFileSync(file, content);
