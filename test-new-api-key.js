// Test all features with new API key: AIzaSyAv7VhZy2WQNiQ3vcns6UmkYk5Z5EFAF1A

import { GoogleGenAI } from '@google/genai';
import { writeFile } from 'fs';
import fetch from 'node-fetch';

const API_KEY = process.env.GOOGLE_AI_API_KEY || 'YOUR_GOOGLE_AI_API_KEY_HERE';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTextGeneration() {
  console.log('\n📝 Testing Text Generation (Gemini 2.5 Flash)...');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Write a short script for a video about AI technology.' }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    console.log('✅ Text Generation: SUCCESS');
    console.log(`Generated text: ${text.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log('❌ Text Generation: FAILED');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function testImageGeneration() {
  console.log('\n🎨 Testing Image Generation (Gemini 2.0 Flash Preview)...');
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    };
    
    const model = 'gemini-2.0-flash-preview-image-generation';
    const contents = [
      {
        role: 'user',
        parts: [{ text: 'A beautiful sunset over mountains' }]
      }
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let imageGenerated = false;
    for await (const chunk of response) {
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        imageGenerated = true;
        console.log('✅ Image Generation: SUCCESS');
        console.log('Real AI image generated!');
        break;
      }
    }

    if (!imageGenerated) {
      throw new Error('No image data received');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Image Generation: FAILED');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function testTTSGeneration() {
  console.log('\n🎤 Testing TTS (Gemini 2.5 Pro Preview TTS)...');
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const config = {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Speaker 1',
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Zephyr'
                }
              }
            }
          ]
        },
      },
    };

    const model = 'gemini-2.5-pro-preview-tts';
    const contents = [
      {
        role: 'user',
        parts: [{ text: 'Hello! This is a test of text-to-speech.' }]
      }
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let audioGenerated = false;
    for await (const chunk of response) {
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        audioGenerated = true;
        console.log('✅ TTS Generation: SUCCESS');
        console.log('Real AI audio generated!');
        break;
      }
    }

    if (!audioGenerated) {
      throw new Error('No audio data received');
    }
    
    return true;
  } catch (error) {
    console.log('❌ TTS Generation: FAILED');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function testVideoGeneration() {
  console.log('\n🎬 Testing Video Generation (Veo 3.0)...');
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const config = {
      model: 'veo-3.0-generate-preview',
      prompt: 'A beautiful sunset over mountains',
      config: {
        aspectRatio: '16:9',
        numberOfVideos: 1,
      },
    };

    console.log('🔄 Starting video generation...');
    let operation = await ai.models.generateVideos(config);

    while (!operation.done) {
      console.log('⏳ Waiting for completion...');
      await delay(2000);
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videos = operation.response?.generatedVideos;
    if (videos && videos.length > 0) {
      console.log('✅ Video Generation: SUCCESS');
      console.log('Real AI video generated!');
      return true;
    } else {
      throw new Error('No videos generated');
    }
  } catch (error) {
    console.log('❌ Video Generation: FAILED');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing all AI features with new API key...');
  console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
  
  const results = {
    text: await testTextGeneration(),
    image: await testImageGeneration(),
    tts: await testTTSGeneration(),
    video: await testVideoGeneration()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`📝 Text Generation: ${results.text ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🎨 Image Generation: ${results.image ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🎤 TTS Generation: ${results.tts ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🎬 Video Generation: ${results.video ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall: ${successCount}/4 features working`);
  
  if (successCount === 4) {
    console.log('🎉 All features working perfectly!');
  } else if (successCount >= 2) {
    console.log('⚠️ Some features working with fallback system active');
  } else {
    console.log('🔴 Most features require quota/billing upgrade');
  }
}

main().catch(console.error);
