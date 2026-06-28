const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = 5001;

// 업로드 폴더 경로 설정
const uploadDir = path.join(__dirname, 'public', 'uploads');

// public/uploads 폴더가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정 (업로드된 파일 저장 위치 및 파일명 설정)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|jfif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드할 수 있습니다!'));
    }
  }
});

// 규칙 기반 텍스트 분석 함수
function analyzeText(text) {
  let docType = "일반 문서";
  let summary = "특정 서식이 감지되지 않은 일반적인 문서 내용입니다.";

  const lowerText = text.toLowerCase();

  // 1. 영수증 체크 ('원', '합계', '카드', '현금')
  if (['원', '합계', '카드', '현금'].some(word => lowerText.includes(word))) {
    docType = "영수증";
    summary = "금액 정보가 포함된 결제 내역입니다.";
  }
  // 2. 명함 또는 연락처 체크 ('@', '010', 'tel', '전화')
  else if (['@', '010', 'tel', '전화'].some(word => lowerText.includes(word))) {
    docType = "명함 또는 연락처";
    summary = "연락처 및 개인/회사 정보가 포함된 문서입니다.";
  }
  // 3. 안내문 체크 ('공지', '안내', '기간', '장소')
  else if (['공지', '안내', '기간', '장소'].some(word => lowerText.includes(word))) {
    docType = "안내문";
    summary = "행사, 일정 또는 공지사항 정보를 담고 있는 문서입니다.";
  }

  return { docType, summary };
}

// 정적 파일 제공 (public 폴더 안의 파일들을 웹 브라우저에서 접근 가능하게 함)
app.use(express.static(path.join(__dirname, 'public')));

// 이미지 업로드 및 OCR API
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  const filePath = req.file.path;

  try {
    // OCR 수행 (한국어 + 영어)
    const { data: { text } } = await Tesseract.recognize(filePath, 'kor+eng');
    
    // 규칙 기반 텍스트 분석
    const analysis = analyzeText(text);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl, 
      text: text,
      analysis: analysis
    });
  } catch (ocrError) {
    console.error('OCR 에러 발생:', ocrError);
    res.json({ 
      success: true, 
      imageUrl: imageUrl, 
      text: `[OCR 실패] 글자를 추출하는 중 오류가 발생했습니다: ${ocrError.message}`,
      analysis: { docType: "분석 불가", summary: "글자 추출 실패로 인해 문서를 분석할 수 없습니다." }
    });
  }
}, (error, req, res, next) => {
  res.status(400).json({ success: false, message: error.message });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 작동 중입니다: http://localhost:${PORT}`);
});
