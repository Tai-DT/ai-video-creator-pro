// Test script for image generation with Google GenAI
// Run with: node test-image-generation.js

import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

function saveBinaryFile(fileName, content) {
  writeFile(fileName, content, (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`✅ File ${fileName} saved successfully!`);
  });
}

async function testImageGeneration() {
  console.log('🚀 Testing Image Generation with Google GenAI...\n');
  
  const apiKey = 'AIzaSyBtqd6YdMExpAWlkBUyPYlOeGXRBSx6ko0';
  
  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    const config = {
      responseModalities: [
        'IMAGE',
        'TEXT',
      ],
    };
    
    const model = 'gemini-2.0-flash-preview-image-generation';
    
    // Test prompts
    const testPrompts = [
      'A beautiful Vietnamese pho bowl with fresh herbs and noodles, high quality, photorealistic',
      'A modern Vietnamese restaurant kitchen with chefs cooking pho, professional lighting',
      'Fresh ingredients for Vietnamese pho: beef, herbs, rice noodles, and spices',
      'A cozy Vietnamese street food stall serving pho, warm lighting, authentic atmosphere'
    ];
    
    console.log(`📝 Using model: ${model}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`🎯 Testing ${testPrompts.length} prompts\n`);
    
    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n🔄 Generating image ${i + 1}/${testPrompts.length}:`);
      console.log(`📝 Prompt: "${prompt}"`);
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      try {
        const response = await ai.models.generateContentStream({
          model,
          config,
          contents,
        });

        let imageGenerated = false;
        for await (const chunk of response) {
          if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
          }
          
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            const mimeType = inlineData.mimeType || 'image/png';
            const fileExtension = mime.getExtension(mimeType) || 'png';
            const imageData = inlineData.data || '';
            const buffer = Buffer.from(imageData, 'base64');
            
            const fileName = `test-image-${i + 1}-${Date.now()}.${fileExtension}`;
            saveBinaryFile(fileName, buffer);
            
            console.log(`✅ Image ${i + 1} generated successfully!`);
            console.log(`📁 Saved as: ${fileName}`);
            console.log(`📊 Size: ${buffer.length} bytes`);
            console.log(`🎨 Format: ${mimeType}`);
            
            imageGenerated = true;
            break;
          }
        }
        
        if (!imageGenerated) {
          console.log(`❌ No image data received for prompt ${i + 1}`);
        }
        
      } catch (error) {
        console.log(`❌ Error generating image ${i + 1}:`, error.message);
      }
      
      // Wait a bit between requests
      if (i < testPrompts.length - 1) {
        console.log('⏳ Waiting 2 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Image generation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImageGeneration();
