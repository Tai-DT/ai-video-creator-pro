// Test script for video generation with Google Veo 2.0
// Run with: node test-video-generation.js

import { GoogleGenAI, PersonGeneration } from '@google/genai';
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

async function testVideoGeneration() {
  console.log('🎬 Testing Video Generation with Google Veo 2.0...\n');
  
  const apiKey = 'AIzaSyBtqd6YdMExpAWlkBUyPYlOeGXRBSx6ko0';
  
  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    console.log('✅ Google GenAI initialized successfully');
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
    
    // Test prompts
    const testPrompts = [
      'A beautiful Vietnamese pho bowl being prepared with fresh herbs and noodles, professional cooking video',
      'A modern Vietnamese restaurant kitchen with chefs cooking pho, professional lighting, cinematic',
      'Fresh ingredients for Vietnamese pho: beef, herbs, rice noodles, and spices being prepared',
      'A cozy Vietnamese street food stall serving pho, warm lighting, authentic atmosphere'
    ];
    
    console.log(`📝 Using model: veo-2.0-generate-001`);
    console.log(`🎯 Testing ${testPrompts.length} prompts\n`);
    
    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n🔄 Generating video ${i + 1}/${testPrompts.length}:`);
      console.log(`📝 Prompt: "${prompt}"`);
      
      try {
        let operation = await ai.models.generateVideos({
          model: 'veo-2.0-generate-001',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            aspectRatio: '16:9',
            durationSeconds: 8,
            personGeneration: PersonGeneration.ALLOW_ALL,
          },
        });

        console.log(`🔄 Video generation started: ${operation.name}`);

        // Poll for completion
        while (!operation.done) {
          console.log(`⏳ Video ${operation.name} is being generated... Check again in 10 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 10000));
          
          operation = await ai.operations.getVideosOperation({
            operation: operation,
          });
        }

        console.log(`✅ Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

        if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
          const generatedVideo = operation.response.generatedVideos[0];
          console.log(`🎥 Video generated: ${generatedVideo?.video?.uri}`);
          
          // Download the video
          const response = await fetch(`${generatedVideo?.video?.uri}&key=${apiKey}`);
          const buffer = await response.arrayBuffer();
          const fileName = `test-video-${i + 1}-${Date.now()}.mp4`;
          
          await writeFile(fileName, Buffer.from(buffer));
          console.log(`✅ Video ${i + 1} downloaded to ${fileName}`);
          console.log(`📊 Size: ${buffer.byteLength} bytes`);
        } else {
          console.log(`❌ No video data received for prompt ${i + 1}`);
        }
        
      } catch (error) {
        console.log(`❌ Error generating video ${i + 1}:`, error.message);
        
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
          console.log('💡 This is a rate limit error. The API key has reached its quota limit.');
          break;
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          console.log('💡 Veo 2.0 model may not be available yet. This feature might not be released.');
          break;
        }
      }
      
      // Wait a bit between requests
      if (i < testPrompts.length - 1) {
        console.log('⏳ Waiting 5 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n🎉 Video generation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('429')) {
      console.log('\n💡 This is a rate limit error. The API key has reached its quota limit.');
      console.log('🔧 Solutions:');
      console.log('   1. Wait a few minutes and try again');
      console.log('   2. Use a different API key');
      console.log('   3. Request higher quota limits');
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('\n💡 Veo 2.0 model may not be available yet.');
      console.log('🔧 This feature might not be released to the public yet.');
    }
  }
}

// Run the test
testVideoGeneration();
