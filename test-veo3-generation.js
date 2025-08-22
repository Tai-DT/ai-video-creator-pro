// To run this code you need to install the following dependencies:
// npm install @google/genai
// npm install -D @types/node

import { GoogleGenAI } from '@google/genai';
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || 'YOUR_GOOGLE_AI_API_KEY_HERE';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blobToBase64(blob) {
  return new Promise(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function generateContent(prompt, imageBytes = null) {
  const ai = new GoogleGenAI({ vertexai: false, apiKey: GEMINI_API_KEY });

  const config = {
    model: 'veo-3.0-generate-preview', // Updated to Veo 3.0
    prompt,
    config: {
      aspectRatio: '16:9',
      numberOfVideos: 1,
    },
  };

  if (imageBytes) {
    config.image = {
      imageBytes,
      mimeType: 'image/png',
    };
  }

  console.log('🎬 Starting Veo 3.0 video generation...');
  console.log(`📝 Prompt: ${prompt}`);
  if (imageBytes) {
    console.log('🖼️ Image input: Provided');
  }

  let operation = await ai.models.generateVideos(config);

  while (!operation.done) {
    console.log('⏳ Waiting for video generation completion...');
    await delay(2000); // Poll every 2 seconds
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videos = operation.response?.generatedVideos;
  if (videos === undefined || videos.length === 0) {
    throw new Error('No videos generated');
  }

  console.log(`✅ Generated ${videos.length} video(s)`);

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const url = decodeURIComponent(video.video.uri);
    
    try {
      console.log(`📥 Downloading video ${i + 1}...`);
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const filename = `veo3-video-${Date.now()}-${i}.mp4`;
      
      await writeFile(filename, Buffer.from(buffer));
      console.log(`✅ Video saved: ${filename}`);
    } catch (downloadError) {
      console.error(`❌ Error downloading video ${i + 1}:`, downloadError);
    }
  }
}

async function main() {
  const testCases = [
    {
      name: 'test-1',
      prompt: 'A beautiful sunset over mountains with flowing clouds',
      imageBytes: null
    },
    {
      name: 'test-2',
      prompt: 'A futuristic city with flying cars and neon lights',
      imageBytes: null
    },
    {
      name: 'test-3',
      prompt: 'A peaceful forest with sunlight filtering through trees',
      imageBytes: null
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🎬 Testing Veo 3.0: ${testCase.name}`);
    console.log(`Prompt: ${testCase.prompt}`);
    
    try {
      await generateContent(testCase.prompt, testCase.imageBytes);
      console.log(`✅ Test ${testCase.name} completed successfully!`);
    } catch (error) {
      console.error(`❌ Test ${testCase.name} failed:`, error.message);
      
      if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
        console.log('💡 API quota exceeded. Please wait or use a different API key.');
      } else if (error.message.includes('billing') || error.message.includes('GCP')) {
        console.log('💡 Veo 3.0 requires Google Cloud Platform billing to be enabled.');
      } else if (error.message.includes('model not found') || error.message.includes('404')) {
        console.log('💡 Veo 3.0 model may not be available yet. Check Gemini API documentation.');
      }
    }
  }
}

main().catch(console.error);
