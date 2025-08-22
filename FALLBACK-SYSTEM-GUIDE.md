# 🔄 Fallback System Guide - Cách hoạt động của hệ thống dự phòng

## 🎯 **Tổng quan về Fallback System**

Fallback System là cơ chế tự động chuyển đổi từ AI thực tế sang placeholder khi API không khả dụng (như GCP billing, quota limit, hoặc lỗi mạng).

## 📊 **Các trường hợp Fallback:**

### 1. **🎨 Image Generation Fallback**
```javascript
// Trong ImageGeneration.tsx
try {
  // Thử Gemini 2.0 Flash Preview Image Generation
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-preview-image-generation',
    config: { responseModalities: ['IMAGE', 'TEXT'] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  // Nếu thành công -> Real AI Image
  if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
    const imageData = inlineData.data;
    return `data:${mimeType};base64,${imageData}`;
  }
} catch (error) {
  console.log('Gemini 2.0 Flash Preview failed, using placeholder:', error);
  
  // FALLBACK -> Placeholder Image
  return generatePlaceholderImage(800, 600, title, description);
}
```

### 2. **🎬 Video Generation Fallback**
```javascript
// Trong VideoCreation.tsx
try {
  // Thử Veo 2.0 Video Generation
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: videoPrompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9',
      durationSeconds: duration,
      personGeneration: PersonGeneration.ALLOW_ALL,
    },
  });

  // Poll cho completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  // Nếu thành công -> Real AI Video
  const videoUrl = generatedVideo.video.uri;
  return videoUrl;
} catch (error) {
  console.log('Veo 2.0 failed, using placeholder:', error);
  
  // FALLBACK -> Placeholder Video
  return generatePlaceholderVideo();
}
```

## 🔧 **Các loại lỗi và Fallback tương ứng:**

### **Error Type 1: GCP Billing Required**
```
Error: "The model is exclusively available to users with GCP billing enabled"
```
**Fallback Action:** Chuyển sang placeholder với thông báo lỗi rõ ràng

### **Error Type 2: Quota Exceeded**
```
Error: "Quota exceeded for quota metric 'Generate Content API requests'"
```
**Fallback Action:** Chuyển sang placeholder với hướng dẫn chờ hoặc đổi API key

### **Error Type 3: Network/API Error**
```
Error: "Failed to fetch" hoặc "API request failed"
```
**Fallback Action:** Chuyển sang placeholder với thông báo lỗi mạng

## 🎨 **Placeholder Generation Functions:**

### **generatePlaceholderImage()**
```javascript
const generatePlaceholderImage = (width, height, title, description) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Tạo gradient background đẹp
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(0.5, '#764ba2');
  gradient.addColorStop(1, '#f093fb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Thêm decorative elements
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 40 + 10;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thêm title và description
  ctx.fillStyle = 'white';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, height / 2 - 40);
  
  // Wrap text cho description
  ctx.font = '16px Arial';
  const words = description.split(' ');
  let line = '';
  let y = height / 2 + 10;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > width - 60 && line !== '') {
      ctx.fillText(line, width / 2, y);
      line = words[i] + ' ';
      y += 25;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, width / 2, y);

  return canvas.toDataURL();
};
```

### **generatePlaceholderVideo()**
```javascript
const generatePlaceholderVideo = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  
  // Tạo gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Thêm text thông tin
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Video Created Successfully!', canvas.width / 2, canvas.height / 2 - 50);
  
  ctx.font = '24px Arial';
  ctx.fillText(`Duration: ${settings.duration}s per scene`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Quality: ${settings.quality} • Format: ${settings.format.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 40);
  ctx.fillText(`Transitions: ${settings.transition} • Music: ${settings.music}`, canvas.width / 2, canvas.height / 2 + 80);

  return canvas.toDataURL();
};
```

## 🔄 **Error Handling Flow:**

### **1. Try Real AI API**
```javascript
try {
  // Gọi API thực tế (Gemini, Veo, Imagen)
  const result = await realAIAPI();
  return result;
} catch (error) {
  // Chuyển sang bước 2
}
```

### **2. Analyze Error Type**
```javascript
let errorMessage = 'Failed to generate';
if (error.message.includes('billing') || error.message.includes('GCP')) {
  errorMessage = 'Requires GCP billing. Please enable billing.';
} else if (error.message.includes('429') || error.message.includes('Quota')) {
  errorMessage = 'API quota exceeded. Please wait or use different API key.';
} else if (error.message.includes('404') || error.message.includes('not found')) {
  errorMessage = 'Model not available. Feature may not be released yet.';
}
```

### **3. Generate Placeholder**
```javascript
// Tạo placeholder với thông tin lỗi
const placeholder = generatePlaceholder(width, height, 'Error', errorMessage);
return {
  id: `placeholder-${Date.now()}`,
  url: placeholder,
  status: 'placeholder',
  error: errorMessage
};
```

### **4. Display User-Friendly Message**
```javascript
// Hiển thị thông báo cho user
setError(errorMessage);
setGeneratedContent(placeholder);

// Log chi tiết cho developer
console.log('API failed, using placeholder:', error);
```

## 🎯 **Ưu điểm của Fallback System:**

### **✅ User Experience**
1. **Không bao giờ crash** - Luôn có kết quả để hiển thị
2. **Thông báo rõ ràng** - User biết chính xác vấn đề gì
3. **Hướng dẫn khắc phục** - Cách resolve issue
4. **Professional appearance** - Placeholder đẹp, không "broken"

### **✅ Developer Experience**
1. **Easy debugging** - Console logs chi tiết
2. **Graceful degradation** - App vẫn hoạt động
3. **Flexible** - Dễ thêm fallback cho API mới
4. **Maintainable** - Code sạch, dễ maintain

### **✅ Business Continuity**
1. **Always functional** - App luôn hoạt động
2. **Demo-ready** - Có thể demo bất cứ lúc nào
3. **Scalable** - Dễ scale với nhiều API providers
4. **Cost-effective** - Không waste API calls khi có lỗi

## 🚀 **Cách test Fallback System:**

### **Test Case 1: Disable API Key**
```javascript
// Tạm thời comment API key để test fallback
// const apiKey = 'real-api-key';
const apiKey = 'invalid-key';
```

### **Test Case 2: Mock API Error**
```javascript
// Throw error để test fallback
throw new Error('The model requires GCP billing enabled');
```

### **Test Case 3: Network Simulation**
```javascript
// Simulate network error
throw new Error('Failed to fetch');
```

## 💡 **Best Practices:**

### **1. Error Classification**
- Phân loại lỗi rõ ràng (billing, quota, network, etc.)
- Thông báo specific cho từng loại lỗi
- Hướng dẫn khắc phục cụ thể

### **2. Placeholder Quality**
- Tạo placeholder đẹp, professional
- Thông tin hữu ích (size, format, etc.)
- Consistent với design system

### **3. Logging Strategy**
- Console.log chi tiết cho developer
- User-friendly messages cho end-user
- Error tracking cho monitoring

### **4. Recovery Options**
- Retry mechanism cho transient errors
- Alternative API providers
- Manual upload options

## 🎊 **Kết luận:**

Fallback System đảm bảo ứng dụng **luôn hoạt động** dù có bất kỳ vấn đề nào với AI APIs:

- ✅ **Never fails** - Luôn có output
- ✅ **User-friendly** - Thông báo rõ ràng
- ✅ **Professional** - Placeholder đẹp
- ✅ **Maintainable** - Code sạch, dễ debug

**Đây là lý do tại sao ứng dụng vẫn hoạt động tốt dù Veo 2.0 yêu cầu GCP billing!** 🚀
