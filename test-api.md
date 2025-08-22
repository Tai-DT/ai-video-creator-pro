# 🧪 Test API Features

## API Key đã được cấu hình
- **Default API Key**: `AIzaSyC0MdgM40z_WUtT75DXtsQLCiAuo1TfOwk`
- **Models được sử dụng**:
  - Gemini 2.5 Flash (text generation)
  - Imagen 4 (image generation)
  - Veo 3 (video generation)

## Test Cases

### 1. Script Creation Test
**Input**:
- Topic: "Cách làm phở Việt Nam"
- Genre: Cooking
- Duration: 5 minutes
- Language: Vietnamese

**Expected**: Script được tạo bằng Gemini 2.5 Flash

### 2. Image Generation Test
**Input**:
- Script: "Hướng dẫn nấu phở với các nguyên liệu tươi ngon"
- Count: 4 images
- Style: Realistic

**Expected**: 
- Thử Imagen 4 API trước
- Fallback về placeholder nếu API không khả dụng

### 3. Video Creation Test
**Input**:
- Script + Images từ các bước trước
- Duration: 5 seconds per scene
- Quality: 1080p

**Expected**:
- Thử Veo 3 API trước
- Fallback về placeholder nếu API không khả dụng

## Cách Test

1. Mở http://localhost:5173/
2. API key sẽ được tự động thêm
3. Test từng tab theo thứ tự:
   - Script Creation
   - Script Analysis  
   - Image Generation
   - Video Creation

## Lưu ý
- Các API mới (Imagen 4, Veo 3) có thể chưa được phát hành rộng rãi
- Ứng dụng sẽ fallback về placeholder nếu API không khả dụng
- Gemini 2.5 Flash đã được cập nhật và sẽ hoạt động tốt hơn
