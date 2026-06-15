import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.git' || file === 'assets') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.match(/\.(html|js|mjs|json|md)$/)) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(process.cwd());
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/karakterler\//g, 'assets/characters/')
        .replace(/simge\//g, 'assets/icons/')
        .replace(/video\//g, 'assets/assets/video/');
        
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Updated: ' + file);
    }
});
