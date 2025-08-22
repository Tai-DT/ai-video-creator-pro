// Simple test for Google GenAI API
// Run with: node test-simple.js

import { GoogleGenAI } from '@google/genai';

async function testSimple() {
  console.log('🧪 Simple API Test...\n');
  
  const apiKey = 'AIzaSyBtqd6YdMExpAWlkBUyPYlOeGXRBSx6ko0';
  
  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    console.log('✅ Google GenAI initialized successfully');
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
    
    // Test with a simple text generation first
    console.log('\n📝 Testing text generation...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello, can you say "Hello from Gemini" in Vietnamese?',
    });
    
    console.log('✅ Text generation successful!');
    console.log('📄 Response structure:', JSON.stringify(response, null, 2));
    console.log('📄 Response text:', response.candidates?.[0]?.content?.parts?.[0]?.text || 'No text found');
    
    // Now test image generation
    console.log('\n🎨 Testing image generation...');
    
    const config = {
      responseModalities: [
        'IMAGE',
        'TEXT',
      ],
    };
    
    const model = 'gemini-2.0-flash-preview-image-generation';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: 'A simple red circle on white background',
          },
        ],
      },
    ];

    console.log(`📝 Using model: ${model}`);
    
    const imageResponse = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let imageGenerated = false;
    for await (const chunk of imageResponse) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const mimeType = inlineData.mimeType || 'image/png';
        const imageData = inlineData.data || '';
        
        console.log('✅ Image generated successfully!');
        console.log(`🎨 Format: ${mimeType}`);
        console.log(`📊 Data size: ${imageData.length} characters`);
        
        imageGenerated = true;
        break;
      }
    }
    
    if (!imageGenerated) {
      console.log('❌ No image data received');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('429')) {
      console.log('\n💡 This is a rate limit error. The API key has reached its quota limit.');
      console.log('🔧 Solutions:');
      console.log('   1. Wait a few minutes and try again');
      console.log('   2. Use a different API key');
      console.log('   3. Request higher quota limits');
    }
  }
}

// Run the test
testSimple();
