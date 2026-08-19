import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const buildDir = "C:\\JEONGO\\.tmp\\ppt-stage12";
const starterPptx = path.join(buildDir, "template-starter.pptx");
const finalPptx = "C:\\JEONGO\\services\\topic1\\public\\TOPIK-I-3-session-lesson.pptx";
const renderDir = path.join(buildDir, "final-render");
const layoutDir = path.join(buildDir, "final-layout");

const insertedSlides = [
  {
    slide: 3,
    number: "1단계",
    category: "핵심 어휘",
    title: "그림 문제에 자주 나오는 인물·장소·동작",
    passage: "그림을 보고 인물, 장소, 동작을 먼저 말한 뒤 단어와 짧은 문장을 함께 익힙니다.",
    options: [
      "인물: 학생 · 선생님 · 의사 · 요리사",
      "장소: 학교 · 병원 · 식당 · 은행",
      "동작: 가다 · 오다 · 하다 · 먹다",
      "확인: 누가 어디에서 무엇을 합니까?",
    ],
    footer: "1회차 · 1단계",
  },
  {
    slide: 4,
    number: "2단계",
    category: "읽기 준비",
    title: "인물·장소 명사와 기본 조사",
    passage: "누가·어디에서·무엇을 하는지 찾은 뒤, 동사를 보고 문장에 필요한 조사를 결정합니다.",
    options: [
      "핵심 명사: 시장 · 사과/배 · 도서관",
      "주체·대상: 이/가 · 을/를",
      "장소: 에(이동) · 에서(행동)",
      "연결: 과/와 — 사과와 배를 삽니다.",
    ],
    footer: "1회차 · 2단계",
  },
  {
    slide: 20,
    number: "1단계",
    category: "핵심 어휘",
    title: "쇼핑 문제에 자주 나오는 물건·단위·동작",
    passage: "가격표와 안내문을 읽기 전에 물건 이름, 세는 단위, 구매 동작을 짧은 문장으로 익힙니다.",
    options: [
      "물건: 옷 · 신발 · 과일 · 우산",
      "단위: 원 · 개 · 잔 · 켤레",
      "동작: 사다 · 팔다 · 빌리다 · 주다",
      "확인: 무엇을 몇 개 사고 싶습니까?",
    ],
    footer: "2회차 · 1단계",
  },
  {
    slide: 21,
    number: "2단계",
    category: "읽기 준비",
    title: "쇼핑 명사·단위 명사와 조사",
    passage: "안내문의 숫자·요일·가격을 표시하고, 수량과 단위 명사를 한 묶음으로 확인합니다.",
    options: [
      "핵심 명사: 입장 요금 · 이용 시간 · 사이즈",
      "단위: 개 · 잔 · 켤레",
      "조사: 을/를 · 에서 · 하고/과/와",
      "과거형: -았/었어요 — 신발을 샀어요.",
    ],
    footer: "2회차 · 2단계",
  },
  {
    slide: 36,
    number: "1단계",
    category: "핵심 어휘",
    title: "시간·상태·미래 계획을 나타내는 핵심 어휘",
    passage: "시간 순서와 몸 상태, 앞으로 할 일을 나타내는 단어를 익힌 뒤 일정과 계획을 말해 봅니다.",
    options: [
      "시간: 오늘 · 내일 · 주말 · 오전/오후",
      "상태: 아프다 · 피곤하다 · 바쁘다 · 맑다",
      "계획: 쉬다 · 약속하다 · 생각하다 · 사오다",
      "확인: 언제 어디에서 무엇을 할 거예요?",
    ],
    footer: "3회차 · 1단계",
  },
  {
    slide: 37,
    number: "2단계",
    category: "읽기 준비",
    title: "시간·일정 명사와 계획 표현",
    passage: "어제·오늘·내일의 시간축을 만들고, 일정의 시간과 장소를 한 쌍으로 확인합니다.",
    options: [
      "핵심 명사: 주말/평일 · 약속/일정 · 공원",
      "시간·장소: 에 · 에서 · 부터/까지",
      "계획: -(으)ㄹ 거예요",
      "희망: -고 싶어요 — 자전거를 타고 싶어요.",
    ],
    footer: "3회차 · 2단계",
  },
];

function findShape(slide, name) {
  const shape = slide.shapes.items.find((item) => item.name === name);
  if (!shape) throw new Error(`Missing inherited shape '${name}' on slide ${slide.id}`);
  return shape;
}

function setText(slide, name, value) {
  findShape(slide, name).text = value;
}

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(renderDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  const presentation = await PresentationFile.importPptx(await FileBlob.load(starterPptx));
  if (presentation.slides.items.length !== 50) {
    throw new Error(`Expected 50 slides, found ${presentation.slides.items.length}`);
  }

  for (const content of insertedSlides) {
    const slide = presentation.slides.getItem(content.slide - 1);
    setText(slide, "q-q1_r2-number", content.number);
    setText(slide, "q-q1_r2-category", content.category);
    setText(slide, "q-q1_r2-text", content.title);
    setText(slide, "q-q1_r2-passage", content.passage);
    content.options.forEach((option, index) => {
      setText(slide, `q-q1_r2-option-${index + 1}`, option);
    });
    setText(slide, "footer-page", content.footer);
  }

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(renderDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(path.join(layoutDir, `${stem}.layout.json`), await (await slide.export({ format: "layout" })).text());
  }

  await writeBlob(path.join(buildDir, "final-montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(finalPptx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
