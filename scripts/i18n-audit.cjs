const fs = require('fs');
const path = require('path');
const reportDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
const targetDir = path.join(__dirname, '..', 'src');
const fileExtensions = ['.tsx', '.ts'];
const report = [];
const textPatterns = [
  { label: 'label', regex: /label\s*=\s*"([^\"]+)"/g },
  { label: 'placeholder', regex: /placeholder\s*=\s*"([^\"]+)"/g },
  { label: 'titleAttr', regex: /title\s*=\s*"([^\"]+)"/g },
  { label: 'text-node', regex: />([^<>\n{}]+)</g },
];
function scan(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  textPatterns.forEach(({ label, regex }) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim();
      if (!text || text.length > 120) continue;
      report.push({ file: path.relative(targetDir, filePath), type: label, value: text });
    }
  });
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'node_modules') continue;
      walk(fullPath);
      continue;
    }
    if (fileExtensions.includes(path.extname(entry.name))) {
      scan(fullPath);
    }
  }
}
walk(targetDir);
fs.writeFileSync(path.join(reportDir, 'i18n-audit.json'), JSON.stringify(report, null, 2));
console.log(`Wrote ${report.length} entries to reports/i18n-audit.json`);
