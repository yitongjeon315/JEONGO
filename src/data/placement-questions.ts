import type { PlacementDomain } from '@/lib/learning';

export interface PlacementQuestion {
  id: string;
  hskLevel: number;
  domain: PlacementDomain;
  word: string;
  prompt: string;
  options: string[];
  answer: string;
  audioText?: string;
}

// 30 base items: vocabulary 40%, grammar 27%, reading 20%, listening 13%.
export const PLACEMENT_BASE_QUESTIONS: PlacementQuestion[] = [
  { id: '1-v1', hskLevel: 1, domain: 'vocabulary', word: '你好', prompt: '“你好”의 뜻은?', options: ['안녕하세요', '감사합니다', '미안합니다'], answer: '안녕하세요' },
  { id: '1-v2', hskLevel: 1, domain: 'vocabulary', word: '水', prompt: '“水”의 뜻은?', options: ['물', '불', '산'], answer: '물' },
  { id: '1-g1', hskLevel: 1, domain: 'grammar', word: '我是学生', prompt: '“나는 학생입니다”에 맞는 문장은?', options: ['我是学生', '我学生是', '是我学生'], answer: '我是学生' },
  { id: '1-r1', hskLevel: 1, domain: 'reading', word: '他喝茶', prompt: '“他喝茶。”에서 그가 마시는 것은?', options: ['차', '커피', '우유'], answer: '차' },
  { id: '1-l1', hskLevel: 1, domain: 'listening', word: '谢谢', prompt: '음성을 듣고 뜻을 고르세요.', options: ['감사합니다', '안녕히 가세요', '괜찮습니다'], answer: '감사합니다', audioText: '谢谢' },

  { id: '2-v1', hskLevel: 2, domain: 'vocabulary', word: '因为', prompt: '“因为”의 뜻은?', options: ['왜냐하면', '그러나', '이미'], answer: '왜냐하면' },
  { id: '2-v2', hskLevel: 2, domain: 'vocabulary', word: '旁边', prompt: '“旁边”의 뜻은?', options: ['옆', '앞', '안'], answer: '옆' },
  { id: '2-g1', hskLevel: 2, domain: 'grammar', word: '比', prompt: '“오늘은 어제보다 덥다”에 맞는 문장은?', options: ['今天比昨天热', '今天昨天比热', '比今天昨天热'], answer: '今天比昨天热' },
  { id: '2-r1', hskLevel: 2, domain: 'reading', word: '妹妹正在看电影', prompt: '“妹妹正在看电影。” 여동생은 지금 무엇을 하나요?', options: ['영화를 본다', '책을 읽는다', '밥을 먹는다'], answer: '영화를 본다' },
  { id: '2-l1', hskLevel: 2, domain: 'listening', word: '明天见', prompt: '음성을 듣고 알맞은 뜻을 고르세요.', options: ['내일 봐요', '오늘 만나요', '어제 봤어요'], answer: '내일 봐요', audioText: '明天见' },

  { id: '3-v1', hskLevel: 3, domain: 'vocabulary', word: '环境', prompt: '“环境”의 뜻은?', options: ['환경', '경험', '경제'], answer: '환경' },
  { id: '3-v2', hskLevel: 3, domain: 'vocabulary', word: '决定', prompt: '“决定”의 뜻은?', options: ['결정하다', '기억하다', '발견하다'], answer: '결정하다' },
  { id: '3-g1', hskLevel: 3, domain: 'grammar', word: '一边…一边…', prompt: '두 동작이 동시에 일어남을 나타내는 표현은?', options: ['一边…一边…', '虽然…但是…', '除了…以外…'], answer: '一边…一边…' },
  { id: '3-g2', hskLevel: 3, domain: 'grammar', word: '把', prompt: '자연스러운 把자문은?', options: ['请把门关上', '请门把关上', '把请关上门'], answer: '请把门关上' },
  { id: '3-r1', hskLevel: 3, domain: 'reading', word: '会议推迟', prompt: '“因为下雨，会议推迟到下午。” 회의가 미뤄진 이유는?', options: ['비가 와서', '사람이 없어서', '장소가 멀어서'], answer: '비가 와서' },

  { id: '4-v1', hskLevel: 4, domain: 'vocabulary', word: '坚持', prompt: '“坚持”의 뜻은?', options: ['견지하다', '포기하다', '오해하다'], answer: '견지하다' },
  { id: '4-v2', hskLevel: 4, domain: 'vocabulary', word: '适合', prompt: '“适合”의 뜻은?', options: ['적합하다', '실망하다', '발생하다'], answer: '적합하다' },
  { id: '4-g1', hskLevel: 4, domain: 'grammar', word: '不仅…而且…', prompt: '“그는 중국어뿐 아니라 일본어도 한다”에 맞는 연결 표현은?', options: ['不仅…而且…', '只要…就…', '即使…也…'], answer: '不仅…而且…' },
  { id: '4-r1', hskLevel: 4, domain: 'reading', word: '提前出发', prompt: '“为了避免堵车，我们决定提前出发。” 일찍 출발하는 이유는?', options: ['교통 체증을 피하려고', '표를 사려고', '친구를 만나려고'], answer: '교통 체증을 피하려고' },
  { id: '4-l1', hskLevel: 4, domain: 'listening', word: '请尽快回复', prompt: '음성을 듣고 화자가 원하는 것을 고르세요.', options: ['빠른 회신', '예약 취소', '주소 변경'], answer: '빠른 회신', audioText: '收到邮件以后，请尽快回复我。' },

  { id: '5-v1', hskLevel: 5, domain: 'vocabulary', word: '改善', prompt: '“改善”의 뜻은?', options: ['개선하다', '거절하다', '감소하다'], answer: '개선하다' },
  { id: '5-v2', hskLevel: 5, domain: 'vocabulary', word: '忽略', prompt: '“忽略”의 뜻은?', options: ['소홀히 하다', '강조하다', '확인하다'], answer: '소홀히 하다' },
  { id: '5-g1', hskLevel: 5, domain: 'grammar', word: '与其…不如…', prompt: '두 선택을 비교해 후자를 권하는 표현은?', options: ['与其…不如…', '既然…就…', '无论…都…'], answer: '与其…不如…' },
  { id: '5-g2', hskLevel: 5, domain: 'grammar', word: '难免', prompt: '“처음 배우면 실수하기 마련이다”에 알맞은 단어는?', options: ['难免', '从而', '陆续'], answer: '难免' },
  { id: '5-r1', hskLevel: 5, domain: 'reading', word: '效率', prompt: '“减少不必要的会议，有助于提高工作效率。” 핵심 내용은?', options: ['불필요한 회의를 줄이면 효율이 오른다', '회의를 늘리면 소통이 좋아진다', '업무 시간을 줄여야 한다'], answer: '불필요한 회의를 줄이면 효율이 오른다' },

  { id: '6-v1', hskLevel: 6, domain: 'vocabulary', word: '潜移默化', prompt: '“潜移默化”와 가장 가까운 뜻은?', options: ['모르는 사이에 영향을 받다', '즉시 결론을 내리다', '일부러 과장하다'], answer: '모르는 사이에 영향을 받다' },
  { id: '6-v2', hskLevel: 6, domain: 'vocabulary', word: '斟酌', prompt: '“斟酌”의 뜻은?', options: ['신중히 헤아리다', '단호히 거절하다', '반복해 암송하다'], answer: '신중히 헤아리다' },
  { id: '6-g1', hskLevel: 6, domain: 'grammar', word: '固然…但是…', prompt: '어떤 사실을 인정한 뒤 반대 내용을 잇는 표현은?', options: ['固然…但是…', '倘若…便…', '宁可…也不…'], answer: '固然…但是…' },
  { id: '6-r1', hskLevel: 6, domain: 'reading', word: '因噎废食', prompt: '“不能因为技术有风险就拒绝创新，这无异于因噎废食。”의 요지는?', options: ['위험 때문에 혁신 자체를 포기하면 안 된다', '기술에는 위험이 전혀 없다', '혁신보다 안정이 항상 중요하다'], answer: '위험 때문에 혁신 자체를 포기하면 안 된다' },
  { id: '6-l1', hskLevel: 6, domain: 'listening', word: '权衡利弊', prompt: '음성을 듣고 화자의 태도를 고르세요.', options: ['장단점을 따져 결정해야 한다', '계획을 즉시 취소해야 한다', '다른 사람에게 맡겨야 한다'], answer: '장단점을 따져 결정해야 한다', audioText: '这个方案并非毫无风险，我们还得权衡利弊以后再作决定。' },
];

export const PLACEMENT_TIE_BREAKERS: PlacementQuestion[] = [
  { id: '1-t1', hskLevel: 1, domain: 'vocabulary', word: '朋友', prompt: '“朋友”의 뜻은?', options: ['친구', '가족', '선생님'], answer: '친구' },
  { id: '1-t2', hskLevel: 1, domain: 'grammar', word: '不', prompt: '“나는 커피를 마시지 않는다”에 맞는 문장은?', options: ['我不喝咖啡', '我喝不咖啡', '不我喝咖啡'], answer: '我不喝咖啡' },
  { id: '1-t3', hskLevel: 1, domain: 'listening', word: '再见', prompt: '음성을 듣고 뜻을 고르세요.', options: ['안녕히 가세요', '어서 오세요', '잘 먹겠습니다'], answer: '안녕히 가세요', audioText: '再见' },
  { id: '2-t1', hskLevel: 2, domain: 'vocabulary', word: '希望', prompt: '“希望”의 뜻은?', options: ['희망하다', '걱정하다', '약속하다'], answer: '희망하다' },
  { id: '2-t2', hskLevel: 2, domain: 'grammar', word: '正在', prompt: '진행 중인 동작을 나타내는 단어는?', options: ['正在', '已经', '一起'], answer: '正在' },
  { id: '2-t3', hskLevel: 2, domain: 'reading', word: '八点上班', prompt: '“我每天八点上班。” 출근 시각은?', options: ['8시', '9시', '10시'], answer: '8시' },
  { id: '3-t1', hskLevel: 3, domain: 'vocabulary', word: '影响', prompt: '“影响”의 뜻은?', options: ['영향', '인상', '영상'], answer: '영향' },
  { id: '3-t2', hskLevel: 3, domain: 'grammar', word: '越来越', prompt: '정도가 점점 변함을 나타내는 표현은?', options: ['越来越', '一共', '一向'], answer: '越来越' },
  { id: '3-t3', hskLevel: 3, domain: 'listening', word: '来不及', prompt: '음성을 듣고 상황을 고르세요.', options: ['시간이 부족하다', '길을 잃었다', '표를 잃었다'], answer: '시간이 부족하다', audioText: '快一点儿，要不然就来不及了。' },
  { id: '4-t1', hskLevel: 4, domain: 'vocabulary', word: '负责', prompt: '“负责”의 뜻은?', options: ['책임지다', '설명하다', '조사하다'], answer: '책임지다' },
  { id: '4-t2', hskLevel: 4, domain: 'grammar', word: '只要…就…', prompt: '충분조건을 나타내는 표현은?', options: ['只要…就…', '尽管…却…', '不是…而是…'], answer: '只要…就…' },
  { id: '4-t3', hskLevel: 4, domain: 'reading', word: '适应新环境', prompt: '“她很快就适应了新的工作环境。” 알 수 있는 것은?', options: ['새 환경에 빨리 적응했다', '곧 일을 그만두었다', '환경이 전혀 바뀌지 않았다'], answer: '새 환경에 빨리 적응했다' },
  { id: '5-t1', hskLevel: 5, domain: 'vocabulary', word: '缓解', prompt: '“缓解”의 뜻은?', options: ['완화하다', '악화하다', '중단하다'], answer: '완화하다' },
  { id: '5-t2', hskLevel: 5, domain: 'grammar', word: '未必', prompt: '“반드시 그런 것은 아니다”에 해당하는 단어는?', options: ['未必', '何必', '务必'], answer: '未必' },
  { id: '5-t3', hskLevel: 5, domain: 'reading', word: '观点', prompt: '“数据本身不会说话，如何解释取决于研究者的观点。” 핵심은?', options: ['자료 해석에는 관점이 작용한다', '자료는 언제나 객관적이다', '연구자는 자료가 필요 없다'], answer: '자료 해석에는 관점이 작용한다' },
  { id: '6-t1', hskLevel: 6, domain: 'vocabulary', word: '举足轻重', prompt: '“举足轻重”의 뜻은?', options: ['매우 중요한 위치에 있다', '행동이 지나치게 가볍다', '결정을 계속 미룬다'], answer: '매우 중요한 위치에 있다' },
  { id: '6-t2', hskLevel: 6, domain: 'grammar', word: '尚且…何况…', prompt: '점층적인 반문을 나타내는 표현은?', options: ['尚且…何况…', '一旦…就…', '除非…才…'], answer: '尚且…何况…' },
  { id: '6-t3', hskLevel: 6, domain: 'listening', word: '有待商榷', prompt: '음성을 듣고 화자의 판단을 고르세요.', options: ['결론을 더 논의해야 한다', '결론이 완전히 확정됐다', '논의할 가치가 없다'], answer: '결론을 더 논의해야 한다', audioText: '这个结论看似合理，但其前提是否成立仍有待商榷。' },
];
