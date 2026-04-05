const fs = require('fs');

try {
  // 1. Fix globals.css modal padding
  let css = fs.readFileSync('src/app/globals.css', 'utf8');
  let newCss = css.replace('.modal {\n  background: #fff;\n  border-radius: var(--radius-xl);\n  box-shadow: var(--shadow-2xl);\n  max-width: 560px;\n  width: 90%;\n  max-height: 85vh;\n  overflow-y: auto;\n  animation: slideUp var(--transition-base);\n  z-index: var(--z-modal);\n}', '.modal {\n  background: #fff;\n  border-radius: var(--radius-xl);\n  box-shadow: var(--shadow-2xl);\n  max-width: 560px;\n  width: 90%;\n  max-height: 85vh;\n  overflow-y: auto;\n  animation: slideUp var(--transition-base);\n  z-index: var(--z-modal);\n  padding: 1.75rem;\n}');
  
  // Try CRLF just in case
  if (css === newCss) {
    newCss = css.replace('.modal {\r\n  background: #fff;\r\n  border-radius: var(--radius-xl);\r\n  box-shadow: var(--shadow-2xl);\r\n  max-width: 560px;\r\n  width: 90%;\r\n  max-height: 85vh;\r\n  overflow-y: auto;\r\n  animation: slideUp var(--transition-base);\r\n  z-index: var(--z-modal);\r\n}', '.modal {\r\n  background: #fff;\r\n  border-radius: var(--radius-xl);\r\n  box-shadow: var(--shadow-2xl);\r\n  max-width: 560px;\r\n  width: 90%;\r\n  max-height: 85vh;\r\n  overflow-y: auto;\r\n  animation: slideUp var(--transition-base);\r\n  z-index: var(--z-modal);\r\n  padding: 1.75rem;\r\n}');
  }
  fs.writeFileSync('src/app/globals.css', newCss);

  // 2. Remove Call and Video buttons in RestChat.tsx
  let tsx = fs.readFileSync('src/components/RestChat.tsx', 'utf8');
  // Use robust regex to remove the flex icons div
  tsx = tsx.replace(/<div className="flex items-center gap-1 text-gray"[^>]*>[\s\S]*?<\/div>/g, '');
  fs.writeFileSync('src/components/RestChat.tsx', tsx);
  
  console.log('Fixed padding and removed icons');
} catch (e) {
  console.error("Error", e);
}
