const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ACER\\.gemini\\antigravity-ide\\brain\\509339cb-b614-4d5d-b26f-0080ff262d27';
const destDir = 'c:\\Users\\ACER\\Documents\\Next JS + WP\\public\\images';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(path.join(srcDir, 'media__1786634529092.jpg'), path.join(destDir, 'motor.jpg'));
fs.copyFileSync(path.join(srcDir, 'media__1786634557624.jpg'), path.join(destDir, 'mobil.jpg'));
fs.copyFileSync(path.join(srcDir, 'media__1786634829672.png'), path.join(destDir, 'solution.png'));
fs.copyFileSync(path.join(srcDir, 'media__1786634893163.png'), path.join(destDir, 'hero.png'));
fs.copyFileSync(path.join(srcDir, 'media__1786634899038.jpg'), path.join(destDir, 'chemical.jpg'));

console.log('Copy complete!');
