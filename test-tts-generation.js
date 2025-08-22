// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFile } from 'fs';

function saveBinaryFile(fileName, content) {
  writeFile(fileName, content, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err);
      return;
    }
    console.log(`File ${fileName} saved to file system.`);
  });
}

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY || 'YOUR_GOOGLE_AI_API_KEY_HERE',
  });

  const testPrompts = [
    {
      name: 'test-1',
      text: 'Speaker 1: Hello! We\'re excited to show you our native speech capabilities. Speaker 2: Where you can direct a voice, create realistic dialog, and so much more.',
      speakers: ['Speaker 1', 'Speaker 2'],
      voices: ['Zephyr', 'Puck']
    },
    {
      name: 'test-2', 
      text: 'Speaker 1: Welcome to our AI video creation platform. Speaker 2: We can generate scripts, images, and now audio narration too!',
      speakers: ['Speaker 1', 'Speaker 2'],
      voices: ['Nova', 'Echo']
    },
    {
      name: 'test-3',
      text: 'Speaker 1: This is a demonstration of multi-speaker text-to-speech. Speaker 2: Each speaker can have a different voice and personality.',
      speakers: ['Speaker 1', 'Speaker 2'],
      voices: ['Luna', 'Phoenix']
    }
  ];

  for (const testPrompt of testPrompts) {
    console.log(`\n🎤 Testing TTS: ${testPrompt.name}`);
    console.log(`Text: ${testPrompt.text}`);
    console.log(`Speakers: ${testPrompt.speakers.join(', ')}`);
    console.log(`Voices: ${testPrompt.voices.join(', ')}`);

    try {
      const config = {
        temperature: 1,
        responseModalities: ['audio'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: testPrompt.speakers.map((speaker, index) => ({
              speaker: speaker,
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: testPrompt.voices[index]
                }
              }
            }))
          },
        },
      };

      const model = 'gemini-2.5-pro-preview-tts';
      const contents = [
        {
          role: 'user',
          parts: [{ text: testPrompt.text }]
        }
      ];

      console.log('🔄 Generating audio...');
      const response = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let fileIndex = 0;
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }

        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          const fileName = `${testPrompt.name}_${fileIndex++}`;
          const inlineData = chunk.candidates[0].content.parts[0].inlineData;
          let fileExtension = mime.getExtension(inlineData.mimeType || '');
          let buffer = Buffer.from(inlineData.data || '', 'base64');
          
          if (!fileExtension) {
            fileExtension = 'wav';
            buffer = convertToWav(inlineData.data || '', inlineData.mimeType || '');
          }
          
          saveBinaryFile(`${fileName}.${fileExtension}`, buffer);
          console.log(`✅ Audio saved: ${fileName}.${fileExtension}`);
        } else {
          console.log(chunk.text);
        }
      }

    } catch (error) {
      console.error(`❌ Error generating audio for ${testPrompt.name}:`, error.message);
      
      if (error.message.includes('billing') || error.message.includes('GCP')) {
        console.log('💡 This feature requires Google Cloud Platform billing to be enabled.');
      } else if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
        console.log('💡 API quota exceeded. Please wait or use a different API key.');
      } else if (error.message.includes('model not found') || error.message.includes('404')) {
        console.log('💡 TTS model may not be available yet. Check Gemini API documentation.');
      }
    }
  }
}

// WavConversionOptions interface

function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');

  return Buffer.concat([wavHeader, buffer]);
}

function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = {
    numChannels: 1,
  };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

function createWavHeader(dataLength, options) {
  const {
    numChannels,
    sampleRate,
    bitsPerSample,
  } = options;

  // http://soundfile.sapp.org/doc/WaveFormat

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

main().catch(console.error);
