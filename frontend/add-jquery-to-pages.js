/**
 * Script to add jQuery CDN to all HTML pages
 * Run: node add-jquery-to-pages.js
 */

const fs = require('fs');
const path = require('path');

const jqueryCDN = '    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>\n';

function addJQueryToFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if jQuery is already added
        if (content.includes('jquery.com/jquery') || content.includes('jQuery')) {
            console.log(`ℹ️  jQuery already exists: ${filePath}`);
            return false;
        }
        
        // Find SweetAlert script tag or last script tag in head
        const sweetAlertPattern = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/sweetalert2@11"><\/script>/;
        const headPattern = /(<\/head>)/;
        
        if (sweetAlertPattern.test(content)) {
            // Add jQuery before SweetAlert
            content = content.replace(
                sweetAlertPattern,
                jqueryCDN + '    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>'
            );
        } else if (headPattern.test(content)) {
            // Add jQuery before closing head tag
            content = content.replace(
                headPattern,
                jqueryCDN + '$1'
            );
        } else {
            console.log(`⚠️  Could not find insertion point: ${filePath}`);
            return false;
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Added jQuery to: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function findHTMLFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !filePath.includes('node_modules')) {
            findHTMLFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
const viewsDir = path.join(__dirname, 'views');
const htmlFiles = findHTMLFiles(viewsDir);

console.log('🚀 Adding jQuery to HTML pages...\n');

let updatedCount = 0;
htmlFiles.forEach(file => {
    if (addJQueryToFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✅ Done! Updated ${updatedCount} file(s).`);

