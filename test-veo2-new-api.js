// Test Veo 2.0 with new API key: AIzaSyBQ3iUAnw2d1C5CgJnacdbXviPpqK-Ndzo

import { GoogleGenAI, PersonGeneration } from '@google/genai';
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

const API_KEY = process.env.GOOGLE_AI_API_KEY || 'YOUR_GOOGLE_AI_API_KEY_HERE';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testVeo2Generation() {
  console.log('🎬 Testing Veo 2.0 Video Generation...');
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  
  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const testPrompts = [
      'A beautiful sunset over mountains with flowing clouds',
      'A futuristic city with flying cars and neon lights',
      'A peaceful forest with sunlight filtering through trees'
    ];

    for (let i = 0; i < testPrompts.length; i++) {
      const prompt = testPrompts[i];
      console.log(`\n🎬 Test ${i + 1}: ${prompt}`);
      
      try {
        console.log('🔄 Starting video generation...');
        
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

        console.log(`⏳ Operation started: ${operation.name}`);

        while (!operation.done) {
          console.log(`⏳ Video ${operation.name} has not been generated yet. Check again in 10 seconds...`);
          await delay(10000);
          operation = await ai.operations.getVideosOperation({
            operation: operation,
          });
        }

        console.log(`✅ Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

        if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
          for (let j = 0; j < operation.response.generatedVideos.length; j++) {
            const generatedVideo = operation.response.generatedVideos[j];
            console.log(`🎥 Video ${j + 1} has been generated: ${generatedVideo?.video?.uri}`);
            
            try {
              console.log('📥 Downloading video...');
              const response = await fetch(`${generatedVideo?.video?.uri}&key=${API_KEY}`);
              
              if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
              }
              
              const buffer = await response.arrayBuffer();
              const filename = `veo2-video-${Date.now()}-${i}-${j}.mp4`;
              await writeFile(filename, Buffer.from(buffer));
              console.log(`✅ Video downloaded to ${filename}`);
              
            } catch (downloadError) {
              console.error(`❌ Error downloading video:`, downloadError.message);
            }
          }
        } else {
          console.log('❌ No videos generated');
        }

      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error.message);
        
        if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
          console.log('💡 API quota exceeded. Please wait or use a different API key.');
        } else if (error.message.includes('billing') || error.message.includes('GCP')) {
          console.log('💡 Veo 2.0 requires Google Cloud Platform billing to be enabled.');
        } else if (error.message.includes('model not found') || error.message.includes('404')) {
          console.log('💡 Veo 2.0 model may not be available yet.');
        }
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

async function testOtherFeatures() {
  console.log('\n🧪 Testing other features with the same API key...');
  
  try {
    // Test Text Generation
    console.log('\n📝 Testing Text Generation...');
    const textResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Write a short script for a video about AI technology.' }]
        }]
      })
    });

    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('✅ Text Generation: SUCCESS');
      console.log(`Generated: ${textData.candidates[0].content.parts[0].text.substring(0, 100)}...`);
    } else {
      console.log('❌ Text Generation: FAILED');
    }

    // Test Image Generation
    console.log('\n🎨 Testing Image Generation...');
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    try {
      const imageResponse = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash-preview-image-generation',
        config: { responseModalities: ['IMAGE', 'TEXT'] },
        contents: [{ role: 'user', parts: [{ text: 'A beautiful sunset over mountains' }] }]
      });

      let imageGenerated = false;
      for await (const chunk of imageResponse) {
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          imageGenerated = true;
          break;
        }
      }

      if (imageGenerated) {
        console.log('✅ Image Generation: SUCCESS');
      } else {
        console.log('❌ Image Generation: FAILED');
      }
    } catch (imageError) {
      console.log('❌ Image Generation: FAILED');
      console.log(`Error: ${imageError.message}`);
    }

  } catch (error) {
    console.error('❌ Error testing other features:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive test with new API key...');
  
  await testVeo2Generation();
  await testOtherFeatures();
  
  console.log('\n🎯 Test completed!');
}

main().catch(console.error);
