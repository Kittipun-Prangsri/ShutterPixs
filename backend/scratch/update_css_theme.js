const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../../frontend/admin.css');
if (!fs.existsSync(cssPath)) {
    console.error('File not found:', cssPath);
    process.exit(1);
}

let css = fs.readFileSync(cssPath, 'utf8');

// Replace hex colors
css = css.replace(/#060913/gi, '#000000');
css = css.replace(/#06b6d4/gi, '#fbbf24');
css = css.replace(/#22d3ee/gi, '#f59e0b');
css = css.replace(/#0891b2/gi, '#d97706');
css = css.replace(/#0284c7/gi, '#b45309');

// Replace rgba gradients and backgrounds
css = css.replace(/rgba\(22,\s*28,\s*45/gi, 'rgba(15, 15, 15');
css = css.replace(/rgba\(13,\s*19,\s*39/gi, 'rgba(8, 8, 8');
css = css.replace(/rgba\(16,\s*24,\s*48/gi, 'rgba(15, 15, 15');
css = css.replace(/rgba\(6,\s*9,\s*19/gi, 'rgba(0, 0, 0');
css = css.replace(/rgba\(6,\s*182,\s*212/gi, 'rgba(217, 119, 6');

// Replace linear gradients
css = css.replace(/linear-gradient\(135deg,\s*#06b6d4\s*0%,\s*#3b82f6\s*100%\)/gi, 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)');
css = css.replace(/linear-gradient\(135deg,\s*#3b82f6\s*0%,\s*#8b5cf6\s*50%,\s*#d946ef\s*100%\)/gi, 'linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #f59e0b 100%)');

fs.writeFileSync(cssPath, css, 'utf8');
console.log('CSS theme successfully updated to luxury black & gold!');
