const fs = require('fs');
const files = [
  'frontend/src/components/saas/ProductPreview.tsx',
  'frontend/src/components/product-ui/Sidebar.tsx',
  'frontend/src/components/product-ui/TaskBoard.tsx',
  'frontend/src/components/product-ui/AIPanel.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Colors
  content = content.replace(/bg-\[#0B0C0E\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#111216\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#0E1015\]/g, 'bg-[var(--nova-sidebar)]');
  content = content.replace(/bg-\[#0E1014\]/g, 'bg-[var(--nova-sidebar)]');
  content = content.replace(/bg-\[#12141A\]/g, 'bg-[var(--nova-sidebar)]');
  content = content.replace(/bg-\[#16181E\]/g, 'bg-[var(--nova-elevated)]');
  content = content.replace(/bg-\[#161820\]/g, 'bg-[var(--nova-elevated)]');
  content = content.replace(/bg-\[#1B1E26\]/g, 'bg-[var(--nova-surface)]');

  // Borders
  content = content.replace(/border-white\/10/g, 'border-[var(--nova-border)]');
  content = content.replace(/border-white\/5/g, 'border-[var(--nova-border-muted)]');
  content = content.replace(/border-\[#0E1014\]/g, 'border-[var(--nova-sidebar)]');

  // Text
  content = content.replace(/text-neutral-200/g, 'text-[var(--nova-text-primary)]');
  content = content.replace(/text-neutral-300/g, 'text-[var(--nova-text-primary)]');
  content = content.replace(/text-white/g, 'text-[var(--nova-text-primary)]');
  content = content.replace(/text-neutral-400/g, 'text-[var(--nova-text-secondary)]');
  content = content.replace(/text-neutral-500/g, 'text-[var(--nova-text-muted)]');
  content = content.replace(/text-neutral-600/g, 'text-[var(--nova-text-muted)]');

  // Background utilities (white/5 etc)
  content = content.replace(/bg-white\/5/g, 'bg-[var(--nova-elevated)]');
  content = content.replace(/bg-white\/10/g, 'bg-[var(--nova-surface)]');
  content = content.replace(/bg-black\/40/g, 'bg-[var(--nova-surface)]');
  content = content.replace(/bg-black\/20/g, 'bg-[var(--nova-elevated)]');
  content = content.replace(/bg-neutral-700/g, 'bg-[var(--nova-elevated)]');

  // Hover states
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-[var(--nova-elevated)]');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-[var(--nova-elevated)]');
  content = content.replace(/hover:border-white\/20/g, 'hover:border-[var(--nova-border-strong)]');
  content = content.replace(/hover:text-white/g, 'hover:text-[var(--nova-text-primary)]');
  content = content.replace(/hover:text-neutral-400/g, 'hover:text-[var(--nova-text-secondary)]');
  content = content.replace(/hover:text-neutral-200/g, 'hover:text-[var(--nova-text-primary)]');
  
  fs.writeFileSync(file, content, 'utf8');
});
