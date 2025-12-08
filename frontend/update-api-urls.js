/**
 * Script to update API_BASE URLs for production deployment
 * 
 * Usage:
 * 1. Update the PRODUCTION_API_URL below
 * 2. Run: node update-api-urls.js
 * 
 * This will update all API_BASE constants in JavaScript files
 */

const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE THIS TO YOUR PRODUCTION API URL
const PRODUCTION_API_URL = 'https://yourdomain.com/api';

// Files to update
const filesToUpdate = [
    'assets/js/auth.js',
    'assets/js/admin.js',
    'assets/js/supplier.js',
    'assets/js/customer.js',
    'assets/js/cart.js'
];

// Also check HTML files for inline API_BASE
const htmlFilesToCheck = [
    'views/admin/dashboard.html',
    'views/admin/products.html',
    'views/admin/orders.html',
    'views/customer/dashboard.html',
    'views/customer/product.html',
    'views/customer/checkout.html',
    'views/supplier/dashboard.html',
    'views/supplier/products.html'
];

function updateFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Update const API_BASE = '../../api';
        content = content.replace(
            /const\s+API_BASE\s*=\s*['"]\.\.\/\.\.\/api['"];?/g,
            `const API_BASE = '${PRODUCTION_API_URL}';`
        );
        
        // Update const API_BASE = '../../api' (without quotes)
        content = content.replace(
            /const\s+API_BASE\s*=\s*\.\.\/\.\.\/api;?/g,
            `const API_BASE = '${PRODUCTION_API_URL}';`
        );
        
        // Update inline API_BASE in template literals
        content = content.replace(
            /`\$\{API_BASE\}/g,
            `\`${PRODUCTION_API_URL}`
        );
        
        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

function updateHtmlFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Update const API_BASE = '../../api'; in script tags
        content = content.replace(
            /const\s+API_BASE\s*=\s*['"]\.\.\/\.\.\/api['"];?/g,
            `const API_BASE = '${PRODUCTION_API_URL}';`
        );
        
        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
console.log('🚀 Updating API URLs for Production...\n');
console.log(`📌 Production API URL: ${PRODUCTION_API_URL}\n`);

let updatedCount = 0;

// Update JavaScript files
console.log('📝 Updating JavaScript files...');
filesToUpdate.forEach(file => {
    if (updateFile(file)) updatedCount++;
});

// Update HTML files
console.log('\n📝 Updating HTML files...');
htmlFilesToCheck.forEach(file => {
    if (updateHtmlFile(file)) updatedCount++;
});

console.log(`\n✅ Done! Updated ${updatedCount} file(s).`);
console.log('\n⚠️  IMPORTANT: Review the changes before committing!');
console.log('   Run: git diff to see what changed.');

