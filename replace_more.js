const fs = require('fs');
const files = [
  'frontend/src/components/product-ui/Chart.tsx',
  'frontend/src/components/product-ui/ReleaseSummary.tsx',
  'frontend/src/components/product-ui/ActivityFeed.tsx',
  'frontend/src/components/saas/WorkspaceDemo.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Colors
  content = content.replace(/bg-\[#0C0D11\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#111216\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#0F1116\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#0E1015\]/g, 'bg-[var(--nova-sidebar)]');
  content = content.replace(/bg-\[#151720\]/g, 'bg-[var(--nova-elevated)]');
  content = content.replace(/bg-\[#161820\]/g, 'bg-[var(--nova-elevated)]');

  // Borders
  content = content.replace(/border-white\/10/g, 'border-[var(--nova-border)]');
  content = content.replace(/border-white\/5/g, 'border-[var(--nova-border-muted)]');
  
  // Text
  content = content.replace(/text-white/g, 'text-[var(--nova-text-primary)]');
  content = content.replace(/text-neutral-300/g, 'text-[var(--nova-text-primary)]');
  
  fs.writeFileSync(file, content, 'utf8');
});
