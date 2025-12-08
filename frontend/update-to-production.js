/**
 * Script to update all API_BASE URLs from localhost to production
 * 
 * Usage:
 * 1. Update PRODUCTION_API_URL below to your Hostinger API URL
 * 2. Run: node update-to-production.js
 */

const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE THIS TO YOUR PRODUCTION API URL
const PRODUCTION_API_URL = 'https://dogfoodshop.ccs4thyear.com/api';

// Files to update
const filesToUpdate = [
    'assets/js/auth.js',
    'assets/js/customer.js',
    'assets/js/admin.js',
    'assets/js/supplier.js',
    'views/guest/index.html',
    'views/guest/login.html',
    'views/guest/register.html',
    'views/guest/forgot_password.html',
    'views/guest/reset_password.html',
    'views/guest/verify_email.html',
    'views/guest/product.html',
    'views/customer/dashboard.html',
    'views/customer/orders.html',
    'views/customer/cart.html',
    'views/customer/checkout.html',
    'views/customer/product.html',
    'views/customer/profile.html',
    'views/admin/dashboard.html',
    'views/admin/products.html',
    'views/admin/orders.html',
    'views/admin/manage_users.html',
    'views/admin/profile.html',
    'views/supplier/dashboard.html',
    'views/supplier/products.html',
    'views/supplier/orders.html',
    'views/supplier/profile.html'
];

function updateFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        let updated = false;

        // Update const API_BASE = 'http://localhost:8000/api';
        if (content.includes('http://localhost:8000/api')) {
            content = content.replace(/http:\/\/localhost:8000\/api/g, PRODUCTION_API_URL);
            updated = true;
        }

        // Update const API_BASE = '../../backend/api';
        if (content.includes("const API_BASE = '../../backend/api'")) {
            content = content.replace(/const API_BASE = '\.\.\/\.\.\/backend\/api';?/g, `const API_BASE = '${PRODUCTION_API_URL}';`);
            updated = true;
        }

        // Update relative paths like ../../api/
        if (content.includes('../../api/')) {
            content = content.replace(/\.\.\/\.\.\/api\//g, `${PRODUCTION_API_URL}/`);
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        } else {
            console.log(`⏭️  No changes needed: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

console.log('🚀 Updating API URLs to production...\n');
console.log(`Production API URL: ${PRODUCTION_API_URL}\n`);

let updatedCount = 0;
filesToUpdate.forEach(file => {
    if (updateFile(file)) {
        updatedCount++;
    }
});

console.log(`\n✅ Updated ${updatedCount} files`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Commit and push to GitHub');
console.log('3. Update CORS in Laravel backend with your GitHub Pages URL');
console.log('4. Test the production deployment');

