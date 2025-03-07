/**
 * Script to update email service imports in the application
 * 
 * This script will look for files importing the original emailService and replace them
 * with imports to the mockEmailService, allowing the application to work without SMTP.
 */
const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Server directory
const serverDir = path.join(__dirname, 'server');

// Function to find all JavaScript files in a directory (recursive)
async function findJsFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subDirFiles = await findJsFiles(fullPath);
      results.push(...subDirFiles);
    } else if (entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Function to update email service imports in a file
async function updateImportsInFile(filePath) {
  const content = await readFile(filePath, 'utf8');
  
  // Check if file imports emailService
  if (content.includes("require('../utils/emailService')") || 
      content.includes("require('./utils/emailService')") ||
      content.includes("require('../../utils/emailService')")) {
    
    console.log(`Updating imports in: ${filePath}`);
    
    // Replace standard imports with mock imports
    let updatedContent = content
      .replace(/require\(['"]\.\.\/utils\/emailService['"]\)/g, "require('../utils/mockEmailService')")
      .replace(/require\(['"]\.\/utils\/emailService['"]\)/g, "require('./utils/mockEmailService')")
      .replace(/require\(['"]\.\.\/\.\.\/utils\/emailService['"]\)/g, "require('../../utils/mockEmailService')");
    
    // Add comment to indicate the modification
    updatedContent = `// MODIFIED: Using mock email service instead of SMTP\n${updatedContent}`;
    
    // Write the changes back to the file
    await writeFile(filePath, updatedContent);
    return true;
  }
  
  return false;
}

// Main function to update all files
async function updateAllFiles() {
  try {
    console.log('Searching for JavaScript files in the server directory...');
    const jsFiles = await findJsFiles(serverDir);
    console.log(`Found ${jsFiles.length} JavaScript files.`);
    
    let updatedCount = 0;
    
    for (const file of jsFiles) {
      const updated = await updateImportsInFile(file);
      if (updated) {
        updatedCount++;
      }
    }
    
    console.log(`\nUpdate completed! Modified ${updatedCount} files.`);
    
    if (updatedCount > 0) {
      console.log('\nEmail functionality is now handled by the mock service.');
      console.log('All emails will be saved to the "emails" directory instead of being sent via SMTP.');
      console.log('\nTo revert these changes:');
      console.log('1. Run a search for "mockEmailService" in your codebase');
      console.log('2. Replace them back with "emailService"');
      console.log('3. Remove the comment "// MODIFIED: Using mock email service instead of SMTP"');
    } else {
      console.log('\nNo files were modified. This could mean:');
      console.log('1. Your application is already using the mock email service');
      console.log('2. Your email service is imported differently than expected');
    }
    
  } catch (error) {
    console.error('Error updating files:', error);
  }
}

// Run the update
updateAllFiles(); 