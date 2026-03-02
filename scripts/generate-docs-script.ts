import { generateAllDocumentation } from '../server/generate-docs';

async function main() {
  console.log('Starting documentation generation...');
  console.log('This will create 3 Google Docs in your Drive:\n');
  
  try {
    const urls = await generateAllDocumentation();
    
    console.log('\n=== Documentation Generated Successfully ===\n');
    console.log('Player Guide:');
    console.log(`  ${urls.playerGuide}\n`);
    console.log('API Reference:');
    console.log(`  ${urls.apiReference}\n`);
    console.log('Game Design Document:');
    console.log(`  ${urls.gdd}\n`);
    console.log('=============================================');
    
  } catch (error) {
    console.error('Failed to generate documentation:', error);
    process.exit(1);
  }
}

main();
