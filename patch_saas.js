const fs = require('fs');
const files = [
  'frontend/src/components/saas/AIFeature.tsx',
  'frontend/src/components/saas/SecuritySection.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Colors
  content = content.replace(/bg-\[#0C0D11\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#101217\]/g, 'bg-[var(--nova-bg)]');
  content = content.replace(/bg-\[#0E1015\]/g, 'bg-[var(--nova-sidebar)]');
  
  // Borders
  content = content.replace(/border-white\/10/g, 'border-[var(--nova-border)]');
  
  // Text
  content = content.replace(/text-neutral-200/g, 'text-[var(--nova-text-primary)]');
  
  fs.writeFileSync(file, content, 'utf8');
});
