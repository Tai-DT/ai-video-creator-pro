# 🎬 AI Video Creator Pro

A comprehensive multilingual web application for creating professional videos using AI, powered by Google's Gemini API and advanced video generation models.

![AI Video Creator Pro](https://img.shields.io/badge/AI-Video%20Creator-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)

## ✨ Features

### 🎬 Complete Video Creation Pipeline
- **📝 Script Generation**: AI-powered script creation with 5 professional templates
- **🔍 Script Analysis**: Detailed scene breakdown and production notes
- **🎨 Image Generation**: Real AI-generated images for video scenes
- **🎥 Video Creation**: Professional video generation with Veo 2.0/3.0
- **🎤 Audio Generation**: Multi-speaker Text-to-Speech narration

### 🚀 Advanced AI Integration
- **Gemini 2.5 Flash**: Script generation and analysis
- **Gemini 2.0 Flash Preview**: Real AI image generation
- **Veo 2.0/3.0**: Professional video generation
- **Gemini 2.5 Pro TTS**: Multi-speaker audio generation

### 🌍 Multilingual Support
- **🇻🇳 Vietnamese**: Full native language support with cultural context
- **🇺🇸 English**: International standard professional content
- **🇯🇵 Japanese**: Complete Japanese support with proper politeness levels
- **🌐 Bilingual Combinations**: Vietnamese-English, Vietnamese-Japanese, English-Japanese

### 🎯 Professional Features
- **5 Templates**: Standard, Storytelling, Tutorial, Review, Educational
- **10+ Image Styles**: Realistic, Cinematic, Artistic, Cartoon, Anime, etc.
- **Customizable Settings**: Aspect ratios, duration, quality, styles
- **Real-time Progress**: Live status updates and comprehensive error handling
- **Auto-navigation**: Seamless workflow progression between steps
- **Complete Workflow**: Automated end-to-end video creation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google AI API key ([Get one here](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-video-creator-pro.git
cd ai-video-creator-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

### 🔑 API Setup

1. Get your Google AI API key from [Google AI Studio](https://aistudio.google.com/)
2. Click on the "🔑 API Key Manager" in the application
3. Add your API key and start creating!

## 📖 Usage Guide

### 🚀 Complete Workflow (Recommended)
1. **Select "🚀 Complete Workflow" tab**
2. **Configure your project**:
   - Enter video topic
   - Choose genre and duration
   - Select languages for different components
   - Set image count and styles
3. **Click "🚀 Start Complete Workflow"**
4. **Watch the magic happen**:
   - ✅ Script generation
   - ✅ Script analysis  
   - ✅ Image generation
   - ✅ Video creation
   - ✅ Results summary

### 🎯 Individual Features
- **📝 Script Creation**: Create professional scripts with templates
- **🔍 Script Analysis**: Analyze scripts for production planning
- **🎨 Image Generation**: Generate custom images for your videos
- **🎥 Video Creation**: Create videos with Veo 2.0 (working with real API)
- **🎤 Audio Generation**: Add professional narration

## 🌍 Multilingual Examples

### Vietnamese Content
```
Topic: "Cách nấu phở Việt Nam"
Language: Vietnamese
Output: Kịch bản hoàn toàn bằng tiếng Việt với văn hóa địa phương
```

### English Content
```
Topic: "How to make Vietnamese Pho"
Language: English
Output: Professional English script for international audience
```

### Japanese Content
```
Topic: "ベトナムのフォーの作り方"
Language: Japanese
Output: 適切な敬語レベルと文化的コンテキストを含む日本語スクリプト
```

### Bilingual Content
```
Topic: "Cách nấu phở Việt Nam"
Language: Vietnamese-English
Output: 
[VIETNAMESE]: Kịch bản tiếng Việt đầy đủ
[ENGLISH]: Complete English translation
```

## 🔧 API Models & Features

| Model | Purpose | Status | Features |
|-------|---------|--------|----------|
| **gemini-2.5-flash** | Text generation | ✅ Working | Script creation, analysis |
| **gemini-2.0-flash-preview-image-generation** | Image generation | ✅ Working | Real AI images |
| **veo-2.0-generate-001** | Video generation | ✅ Working | Professional videos |
| **veo-3.0-generate-preview** | Latest video generation | ⚠️ Requires GCP billing | Advanced features |
| **gemini-2.5-pro-preview-tts** | Text-to-speech | ✅ Working | Multi-speaker audio |

## 💻 Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Modern CSS3 with responsive design
- **AI Integration**: Google GenAI SDK (@google/genai)
- **State Management**: React Context API
- **Storage**: localStorage for persistence
- **Build Tool**: Vite for fast development

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ScriptCreation.tsx    # Script generation
│   ├── ScriptAnalysis.tsx    # Script analysis
│   ├── ImageGeneration.tsx   # Image creation
│   ├── VideoCreation.tsx     # Video generation
│   ├── AudioGeneration.tsx   # Audio creation
│   ├── WorkflowManager.tsx   # Complete workflow
│   └── ...
├── contexts/            # React contexts
│   └── ApiKeyContext.tsx     # API key management
├── App.tsx             # Main application
└── main.tsx           # Entry point
```

## 🎨 Features Showcase

### Script Templates
- **Standard**: Basic professional scripts
- **Storytelling**: Narrative arc with character development
- **Tutorial**: Step-by-step educational content
- **Review**: Product/service evaluation format
- **Educational**: Learning-focused structure

### Image Styles
- **Realistic**: Photorealistic images
- **Cinematic**: Movie-like quality
- **Artistic**: Creative and stylized
- **Cartoon**: Animated style
- **Anime**: Japanese animation style
- **And 5+ more styles**

### Video Settings
- **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3
- **Durations**: 1-15 minutes
- **Quality**: Standard, High, Ultra
- **Styles**: Cinematic, Realistic, Artistic

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** for providing powerful AI models
- **React Team** for the excellent framework
- **Vite Team** for the blazing fast build tool
- **All contributors** and testers who helped improve this project

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ai-video-creator-pro/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/ai-video-creator-pro/discussions)

## 🎯 Roadmap

- [ ] More video models integration
- [ ] Advanced audio editing
- [ ] Batch processing
- [ ] Cloud storage integration
- [ ] Mobile app version
- [ ] More language support

---

**🎬 Start creating professional AI videos in multiple languages today!** ✨

Made with ❤️ by the AI Video Creator Pro team