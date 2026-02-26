import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('c:/contable-pwa/src');

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const fileMap = new Map(); // lowercase path -> actual path

allFiles.forEach(f => {
    fileMap.set(f.toLowerCase().replace(/\\/g, '/'), f.replace(/\\/g, '/'));
});

allFiles.forEach(f => {
    if (!f.endsWith('.tsx') && !f.endsWith('.ts')) return;
    const content = fs.readFileSync(f, 'utf-8');
    const importRegex = /from\s+["'](@\/|..\/|.\/)([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content))) {
        let importPath = match[2];
        let absoluteImportPath;

        if (match[1] === '@/') {
            absoluteImportPath = path.join(srcDir, importPath);
        } else {
            absoluteImportPath = path.resolve(path.dirname(f), match[1] + importPath);
        }

        // Try with extensions
        let found = false;
        const extensions = ['', '.tsx', '.ts', '/index.tsx', '/index.ts'];
        for (const ext of extensions) {
            const testPath = (absoluteImportPath + ext).toLowerCase().replace(/\\/g, '/');
            if (fileMap.has(testPath)) {
                const actual = fileMap.get(testPath);
                const expected = (absoluteImportPath + ext).replace(/\\/g, '/');
                if (actual !== expected && !actual.endsWith(expected)) {
                    // Check if only the casing is different
                    if (actual.toLowerCase() === expected.toLowerCase()) {
                        console.log(`CASE MISMATCH in ${f}:`);
                        console.log(`  Imported: ${expected}`);
                        console.log(`  Actual:   ${actual}`);
                    }
                }
                found = true;
                break;
            }
        }
    }
});
