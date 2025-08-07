#!/usr/bin/env node

// SEO Testing Script for BFI Organic Platform
import https from 'https';
import http from 'http';

function testURL(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract structured data
        const jsonLdMatches = data.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        const structured = jsonLdMatches ? jsonLdMatches.map(match => {
          const jsonString = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
          try {
            return JSON.parse(jsonString);
          } catch (e) {
            return { error: 'Invalid JSON', content: jsonString.substring(0, 100) };
          }
        }) : [];
        
        // Extract meta tags
        const titleMatch = data.match(/<title[^>]*>([^<]*)<\/title>/i);
        const descMatch = data.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
        const ogTitleMatch = data.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
        const ogImageMatch = data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
        
        resolve({
          url,
          status: res.statusCode,
          title: titleMatch ? titleMatch[1] : 'No title',
          description: descMatch ? descMatch[1] : 'No description',
          ogTitle: ogTitleMatch ? ogTitleMatch[1] : 'No OG title',
          ogImage: ogImageMatch ? ogImageMatch[1] : 'No OG image',
          structuredDataCount: structured.length,
          structuredData: structured.map(s => ({
            type: s['@type'] || 'Unknown',
            context: s['@context'] || 'Unknown',
            name: s.name || 'No name'
          }))
        });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  const baseUrl = 'http://localhost:5000';
  const testUrls = [
    `${baseUrl}/`,
    `${baseUrl}/products`,
    `${baseUrl}/product/organic-baheda-powder`
  ];
  
  console.log('🔍 SEO & Structured Data Test Results\n');
  console.log('='.repeat(80));
  
  for (const url of testUrls) {
    try {
      const result = await testURL(url);
      
      console.log(`\n📄 URL: ${result.url}`);
      console.log(`✅ Status: ${result.status}`);
      console.log(`📝 Title: ${result.title}`);
      console.log(`📋 Description: ${result.description.substring(0, 100)}...`);
      console.log(`🖼️  OG Title: ${result.ogTitle.substring(0, 50)}...`);
      console.log(`🌐 OG Image: ${result.ogImage.substring(0, 50)}...`);
      console.log(`📊 Structured Data: ${result.structuredDataCount} schemas found`);
      
      result.structuredData.forEach((schema, index) => {
        console.log(`   ${index + 1}. ${schema.type} (${schema.context}) - ${schema.name}`);
      });
      
      // Generate validation URLs
      const googleTestUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`;
      console.log(`🔗 Google Test: ${googleTestUrl}`);
      
    } catch (error) {
      console.log(`\n❌ Error testing ${url}: ${error.message}`);
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log('\n✨ Test completed! Use the Google Rich Results Test URLs above to validate live.');
  console.log('\n💡 Tip: For deployment testing, replace localhost URLs with your live domain.');
}

runTests().catch(console.error);