# 🚀 Deployment Guide - AI Video Creator Pro

## 🌐 GitHub Repository
**Repository:** https://github.com/Tai-DT/ai-video-creator-pro

## 📋 Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Google AI API key from [Google AI Studio](https://aistudio.google.com/)

## 🔧 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Tai-DT/ai-video-creator-pro.git
cd ai-video-creator-pro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup (Optional)
Create a `.env` file in the root directory:
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🌐 Production Deployment Options

### Option 1: Vercel (Recommended)
1. **Fork the repository** on GitHub
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your forked repository
   - Configure build settings (auto-detected)
3. **Deploy**: Vercel will automatically build and deploy

### Option 2: Netlify
1. **Fork the repository** on GitHub
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Import your repository
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Deploy**: Netlify will build and deploy automatically

### Option 3: GitHub Pages
1. **Fork the repository**
2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Enable Pages with GitHub Actions
3. **Build and Deploy**:
   ```bash
   npm run build
   # Upload dist/ folder to gh-pages branch
   ```

### Option 4: Docker Deployment
1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

2. **Build and Run**:
```bash
docker build -t ai-video-creator-pro .
docker run -p 5173:5173 ai-video-creator-pro
```

## 🔑 API Key Configuration

### Method 1: In-App Configuration (Recommended)
1. Open the deployed application
2. Click "🔑 API Key Manager"
3. Add your Google AI API key
4. Start creating videos!

### Method 2: Environment Variables
Set environment variables in your deployment platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Heroku**: Config Vars

```
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## 📊 Build Configuration

### Build Commands
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### Build Output
- **Build Directory**: `dist/`
- **Static Assets**: Optimized and bundled
- **TypeScript**: Compiled to JavaScript
- **CSS**: Minified and optimized

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. API Key Issues
- Ensure API key is valid and has necessary permissions
- Check Google AI Studio for quota limits
- Verify API key is correctly configured

#### 3. CORS Issues
- Most deployment platforms handle CORS automatically
- For custom deployments, ensure proper CORS headers

#### 4. Large Bundle Size
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

## 🔒 Security Considerations

### 1. API Key Security
- **Never commit API keys** to version control
- Use environment variables for production
- Implement API key rotation if needed

### 2. Content Security Policy
Add CSP headers for enhanced security:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com;
```

### 3. Rate Limiting
- Monitor API usage to avoid quota limits
- Implement client-side rate limiting if needed
- Consider implementing user authentication

## 📈 Performance Optimization

### 1. Code Splitting
- Components are already optimized for code splitting
- Lazy loading implemented for heavy components

### 2. Asset Optimization
- Images are optimized during build
- CSS is minified and compressed
- JavaScript is bundled and tree-shaken

### 3. Caching Strategy
- Static assets cached with long TTL
- API responses cached in localStorage
- Service worker can be added for offline support

## 🧪 Testing Deployment

### 1. Functionality Tests
- [ ] API key configuration works
- [ ] Script generation functions
- [ ] Image generation works
- [ ] Video generation (with valid API key)
- [ ] Audio generation functions
- [ ] Workflow automation works
- [ ] All languages supported

### 2. Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Bundle size reasonable (< 5MB)
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 📞 Support

If you encounter deployment issues:
1. Check the [GitHub Issues](https://github.com/Tai-DT/ai-video-creator-pro/issues)
2. Review this deployment guide
3. Create a new issue with deployment details

## 🎯 Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] API key configuration works
- [ ] All features functional
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] Analytics/monitoring setup (optional)

---

**🎬 Your AI Video Creator Pro is now live!** Start creating professional videos with AI! ✨
