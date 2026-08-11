export const curriculumData = [
  {
    id: 1,
    title: "1회차: 기본 인물, 장소, 동작 마스터",
    subTitle: "TOPIK I 합격의 첫걸음! 일상생활의 주체(인물)와 공간(장소) 및 기본 동사를 배웁니다.",
    duration: "2시간",

    // 국립국제교육원 TOPIK 공식 소개 규정
    topikIntro: {
      title: "🔎 국립국제교육원 TOPIK I PBT 시험 안내",
      purpose: "한국어를 모국어로 하지 않는 재외동포 및 외국인의 한국어 학습 방향 제시 및 한국어 사용 능력을 측정하여 유학, 취업 등에 활용하는 것을 목적으로 합니다.",
      target: "재외동포 및 외국인 (한국 내 대학 입학, 비자 취득, 해외 기업 취업 등 희망자)",
      levels: [
        { grade: "1급 (TOPIK I)", standard: "80점 이상 취득", criteria: "자기소개, 물건 사기, 음식 주문 등 일상생활에 필요한 기초적인 대화가 가능하며, 약 800개의 기본 어휘를 이해할 수 있는 수준." },
        { grade: "2급 (TOPIK I)", standard: "140점 이상 취득", criteria: "전화하기, 부탁하기 등 일상적인 공공시설 이용과 간단한 회사 생활이 가능하며, 약 1,500~2,000개의 어휘를 사용할 수 있는 수준." }
      ],
      sections: [
        { area: "듣기 (Listening)", questions: "30문항", score: "100점", time: "40분", format: "4지선다형 객관식" },
        { area: "읽기 (Reading)", questions: "40문항", score: "100점", time: "60분", format: "4지선다형 객관식" }
      ],
      tips: [
        "이 표는 TOPIK I PBT 기준입니다. PBT는 1교시 단일 교시로 구성되며, 중간에 쉬는 시간 없이 총 100분 동안 진행됩니다.",
        "TOPIK I IBT는 문항 수·시험 시간·점수 체계가 다르므로 응시 방식에 맞는 최신 공식 공고를 반드시 확인하십시오.",
        "오답에 대한 감점 제도가 없으므로, 모든 문항의 답안을 반드시 채우는 것이 고득점에 유리합니다."
      ]
    },

    // 상세 시간표 (Timeline)
    timeline: [
      { time: "10분", activity: "도입 & TOPIK 소개", detail: "출석 체크, TOPIK I 시험 구조 안내 및 오늘의 학습 목표 확인" },
      { time: "20분", activity: "1단계: 핵심 어휘 학습", detail: "인물·장소·동작 명사를 그림 카드와 예문으로 학습" },
      { time: "15분", activity: "2단계: 읽기 전 지식 학습", detail: "시장·도서관 등 문제 명사와 은/는, 이/가, 을/를, 에/에서, 과/와 학습" },
      { time: "25분", activity: "3단계: 읽기 문제 풀이", detail: "배운 명사와 조사를 문제에 표시하며 읽기 문제집 풀이 및 해설 확인" },
      { time: "10분", activity: "쉬는 시간", detail: "중간 휴식 시간" },
      { time: "15분", activity: "4단계: 듣기 전 지식 학습", detail: "장소 단서 명사와 주세요, 어디에 가요, 무엇을 해요 표현 학습" },
      { time: "15분", activity: "5단계: 듣기 문제 풀이", detail: "보기 핵심어를 먼저 확인한 뒤 듣기 문제집 풀이" },
      { time: "10분", activity: "6단계: 마무리 복습", detail: "오답의 명사·조사·표현을 다시 확인하고 플래시카드로 최종 점검" }
    ],

    // 1단계: 단위 공부 (Vocab Warm-up)
    vocabWarmUp: {
      title: "1단계: 핵심 어휘 학습 (오늘의 기초 어휘)",
      description: "그림 카드를 보고 어떤 인물, 장소, 동작인지 유추한 뒤 카드를 클릭하여 한글 단어를 확인해보세요.",
      instructorGuide: "<strong>[핵심 어휘 학습 교수 가이드]</strong><br>- 학생들에게 카드의 그림이나 기호만 보여주고 한글 단어(학생, 의사, 병원 등)를 큰 소리로 말하게 유도하십시오.<br>- 단어 발음 듣기 🔊 버튼을 눌러 한국어 발음을 들려주고 함께 따라 말하게 하세요.<br>- 카드를 클릭하여 뒤집어 뒷면의 뜻과 예문을 소리 내 낭독하게 하십시오.",
      categories: [
        {
          name: "👤 인물 명사 (People)",
          words: [
            { word: "학생", definition: "Student", example: "학생이 학교에서 공부를 합니다.", image: "topik_student_scene.jpg" },
            { word: "선생님", definition: "Teacher", example: "선생님이 교실에서 한국어를 가르칩니다.", image: "topik_teacher_scene.jpg" },
            { word: "의사", definition: "Doctor", example: "의사가 병원에서 아픈 사람을 치료합니다.", image: "topik_doctor_scene.jpg" },
            { word: "요리사", definition: "Chef / Cook", example: "요리사가 식당에서 맛있는 음식을 만듭니다.", image: "topik_chef_scene.jpg" }
          ]
        },
        {
          name: "📍 장소 명사 (Places)",
          words: [
            { word: "학교", definition: "School", example: "우리는 학교에서 친구를 만납니다.", image: "topik_school_scene.jpg" },
            { word: "병원", definition: "Hospital", example: "머리가 아파서 병원에 갔습니다.", image: "topik_hospital_scene.jpg" },
            { word: "식당", definition: "Restaurant", example: "식당에서 김치찌개를 먹었습니다.", image: "topik_restaurant_scene.jpg" },
            { word: "은행", definition: "Bank", example: "돈을 찾으러 은행에 갑니다.", image: "topik_bank_scene.jpg" }
          ]
        },
        {
          name: "🏃 동작 동사 (Basic Verbs)",
          words: [
            { word: "가다", definition: "To go", example: "저는 오늘 시장에 갑니다.", image: "topik_go_scene.jpg" },
            { word: "오다", definition: "To come", example: "비가 오면 우산을 씁니다.", image: "topik_come_scene.jpg" },
            { word: "하다", definition: "To do", example: "동생은 매일 운동을 합니다.", image: "topik_student_scene.jpg" },
            { word: "먹다", definition: "To eat", example: "아침에 사과를 먹었습니다.", image: "topik_restaurant_scene.jpg" }
          ]
        }
      ]
    },

    // 🕹️ 1회차 어휘-그림 매칭 게임 (영어가 완전 배제된 6쌍)
    vocabGamePairs: [
      { type: "text-image", text: "서점", matchVal: "topik_bookstore_scene.jpg", key: "bookstore" },
      { type: "text-image", text: "카페", matchVal: "topik_cafe_scene.jpg", key: "cafe" },
      { type: "text-image", text: "비 (날씨)", matchVal: "topik_rainy_scene.jpg", key: "rainy" },
      { type: "text-image", text: "의사", matchVal: "topik_doctor_scene.jpg", key: "doctor" },
      { type: "text-image", text: "요리사", matchVal: "topik_chef_scene.jpg", key: "chef" },
      { type: "text-image", text: "학생", matchVal: "topik_student_scene.jpg", key: "student" }
    ],

    // 2단계: 실전 훈련 (Actual Practice - 총 10문항)
    practiceQuestions: [
      {
        id: "q1_r1",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 그림을 보고 무엇을 하는 상황인지 가장 알맞은 것을 고르십시오. (TOPIK I 기출)",
        image: "topik_bookstore_scene.jpg",
        options: ["밥을 먹습니다.", "노래를 부릅니다.", "책을 고릅니다.", "옷을 삽니다."],
        correct: 2,
        explanation: "그림을 보면 많은 책이 꽂혀 있는 책장 앞에서 책을 한 권 손에 들고 보고 있습니다. 책을 고르고 파는 장소인 서점의 맥락과 일치하는 동작입니다.",
        instructorGuide: "<strong>[읽기 1번 교수 시나리오]</strong><br>- <strong>발문 팁:</strong> '그림에 무엇이 보여요? 그래요, 책이 보여요. 그럼 책을 가지고 할 수 있는 행동은 무엇일까요?'",
        optionExplanations: [
          "① 밥을 먹습니다 (X) - 음식을 식탁에서 먹고 있는 상황이 아닙니다.",
          "② 노래를 부릅니다 (X) - 마이크를 쥐고 노래하는 방이 아닌 책들이 있는 공간입니다.",
          "③ 책을 고릅니다 (O) - 책장 앞에서 서서 마음에 드는 책을 손에 들고 확인하는 행동이므로 그림과 완벽히 일치합니다.",
          "④ 옷을 삽니다 (X) - 옷가게에서 옷을 거울에 비춰보거나 계산하고 있지 않습니다."
        ]
      },
      {
        id: "q1_r2",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 빈칸에 들어갈 가장 알맞은 조사를 고르십시오. (TOPIK I 기출)<br><br><div class='quiz-box'>저는 오늘 시장에 갑니다. 시장에서 사과( &nbsp; &nbsp; &nbsp; &nbsp; ) 배를 삽니다.</div>",
        options: ["가", "와", "를", "로"],
        correct: 1,
        explanation: "명사와 명사를 대등하게 연결하며 'and'의 의미를 지니는 접속 조사는 **와/과**입니다. 앞 명사 '사과'에 받침이 없으므로 **와**가 어울립니다.",
        instructorGuide: "<strong>[읽기 2번 교수 시나리오]</strong><br>- <strong>문법 판서:</strong> Noun + 와/과 (받침 O -> 과 / 받침 X -> 와). 예: '수박과 참외', '사과와 배'",
        optionExplanations: [
          "① 가 (X) - 주격을 나타내는 조사로, 사과를 문장의 주어로 만들기 때문에 어울리지 않습니다.",
          "② 와 (O) - 사과와 배라는 두 대상을 대등하게 나열하는 접속 조사로, 문장의 목적어 자리에 잘 들어맞습니다.",
          "③ 를 (X) - 목적격 조사로, 이미 뒤에 '배를' 목적격 조사가 결합해 있으므로 명사와 명사를 대등하게 이어줄 수 없습니다.",
          "④ 로 (X) - 도구나 수단, 방향을 나타내는 부사격 조사로 '사과로 배를 산다'는 의미가 되어 어색합니다."
        ]
      },
      {
        id: "q1_r3",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 그림 상황에 들어맞는 문장으로 가장 알맞은 것을 고르십시오.",
        image: "topik_doctor_scene.jpg",
        options: ["진료를 받습니다.", "장난감을 가지고 놉니다.", "공부를 가르칩니다.", "요리를 시킵니다."],
        correct: 0,
        explanation: "의사 가운을 입은 의사가 병실에서 환자를 성심껏 돌보며 대화하는 모습이므로, 병원에서 치료를 받거나 **진료를 받습니다**가 가장 정확합니다.",
        instructorGuide: "<strong>[읽기 3번 교수 시나리오]</strong><br>- 청진기를 맨 '의사'와 병실의 '환자'가 대화하고 있으므로 '치료/진료'의 맥락과 쉽게 연결되도록 발문 지도하십시오.",
        optionExplanations: [
          "① 진료를 받습니다 (O) - 의사에게 아픈 상태를 말하고 검사를 받는 과정과 정확히 일치합니다.",
          "② 장난감을 가지고 놉니다 (X) - 어린아이가 놀이터나 방에서 노는 상황이 아닙니다.",
          "③ 공부를 가르칩니다 (X) - 학교나 교실에서 선생님이 하는 행위입니다.",
          "④ 요리를 시킵니다 (X) - 주방이나 식당에서 셰프가 지시하는 행위입니다."
        ]
      },
      {
        id: "q1_r4",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 빈칸에 들어갈 알맞은 조사를 고르십시오.<br><br><div class='quiz-box'>저는 주말에 도서관에 갑니다. 도서관( &nbsp; &nbsp; &nbsp; &nbsp; ) 책을 많이 읽습니다.</div>",
        options: ["이", "을", "에서", "의"],
        correct: 2,
        explanation: "동작이 일어나는 공간적 활동 지점을 나타내는 부사격 조사는 **에서**입니다.",
        instructorGuide: "<strong>[읽기 4번 교수 시나리오]</strong><br>- <strong>격조사 대조:</strong> 공간에 단순히 '존재'할 때는 '에(있다/없다)', 공간에서 '활동'을 할 때는 '에서(먹다/공부하다/일하다)'의 차이점을 도표로 정리 판서하세요.",
        optionExplanations: [
          "① 이 (X) - 주격 조사이므로 어울리지 않습니다.",
          "② 을 (X) - 목적격 조사이므로 장소 명사 뒤에 붙을 수 없습니다.",
          "③ 에서 (O) - '읽다'라는 능동적 서술어가 있으므로 활동 지점 조사 '에서'가 정확합니다.",
          "④ 의 (X) - 소유를 나타내는 관형격 조사입니다."
        ]
      },
      {
        id: "q1_r5",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 글의 중심 생각을 고르십시오.<br><br><div class='quiz-box'>저는 한국 노래를 자주 듣습니다. 특히 BTS 노래를 정말 좋아합니다. 나중에 한국 콘서트에 직접 가서 한국 가수들을 만나고 싶습니다.</div>",
        options: ["저는 한국 가수를 좋아합니다.", "저는 노래방에 자주 갑니다.", "저는 방학 때 여행을 갈 것입니다.", "저는 춤을 열심히 배웁니다."],
        correct: 0,
        explanation: "한국 노래를 좋아하고, 특히 BTS의 팬이며, 나중에 한국에 직접 가서 가수를 만나고 싶다는 소망이 중심 생각인 ①번이 유일합니다.",
        instructorGuide: "<strong>[읽기 5번 교수 시나리오]</strong><br>- 글의 마지막 부분에 나타난 '만나고 싶습니다'라는 소망이 보기의 '좋아합니다'와 유기적으로 결합되는 힌트를 학생들이 캐치하도록 유도하세요.",
        optionExplanations: [
          "① 한국 가수를 좋아합니다 (O) - 글 전체가 좋아하는 노래와 가수를 언급하고 있으므로 정합합니다.",
          "② 노래방에 자주 갑니다 (X) - 노래방(장소)에 관한 구체적 발언이 없습니다.",
          "③ 여행을 갈 것입니다 (X) - 단지 콘서트 참관을 위한 소망이 있을 뿐 일반 여행 목적이 중심 생각이 아닙니다.",
          "④ 춤을 열심히 배웁니다 (X) - 무용이나 댄스 학원에 대한 내용이 없습니다."
        ]
      },
      {
        id: "q1_l1",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 그림과 어울리는 올바른 대화 상황을 고르십시오. (TOPIK I 기출)",
        image: "topik_cafe_scene.jpg",
        audioScript: [
          { speaker: "여", text: "여기 커피 두 잔하고 케이크 하나 주세요." },
          { speaker: "남", text: "네, 알겠습니다. 저기 테이블에서 잠시만 기다려 주세요." }
        ],
        options: [
          "병원에서 의사와 간호사가 환자를 만납니다.",
          "카페에서 여자가 음료와 디저트를 주문합니다.",
          "은행에서 남자가 카드를 넣어 돈을 찾습니다.",
          "서점에서 남자가 직원에게 책 위치를 묻습니다."
        ],
        correct: 1,
        explanation: "여자가 주문을 하고 점원(남자)이 대답을 하는 장소는 카페입니다. 카페에서 두 사람이 커피를 나누고 주문하는 장면이므로 ②번이 그림 상황과 완벽히 부합합니다.",
        instructorGuide: "<strong>[듣기 1번 교수 시나리오]</strong><br>- <strong>오디오 청취 전 지도:</strong> 그림 속에 테이블, 찻잔, 웃으며 대화하는 모습이 보임을 공유하고 카페 관련 단어(커피, 차, 주문, 잔)가 나올 것임을 예측하게 하세요.",
        optionExplanations: [
          "① 병원에서 환자를 만납니다 (X) - 대화가 진료나 주사 등 병원과 무관합니다.",
          "② 카페에서 음료와 디저트를 주문합니다 (O) - 여자가 커피 두 잔과 케이크를 달라고 주문하며 남자가 서빙을 대기하라고 하는 내용이므로 카페 그림에 정확히 일치합니다.",
          "③ 은행에서 돈을 찾습니다 (X) - 금융 기기나 카드, 통장에 관한 언급이 전혀 없습니다.",
          "④ 서점에서 책 위치를 묻습니다 (X) - 책장이나 도서 검색 등에 대한 얘기가 아닙니다."
        ]
      },
      {
        id: "q1_l2",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 두 사람이 대화하는 장소로 가장 알맞은 곳을 고르십시오. (TOPIK I 기출)",
        audioScript: [
          { speaker: "여", text: "머리가 많이 아파요. 약 좀 주세요." },
          { speaker: "남", text: "네, 이 약을 드세요. 그리고 오늘은 따뜻한 물을 많이 마시고 푹 쉬세요." }
        ],
        options: ["은행", "약국", "우체국", "세탁소"],
        correct: 1,
        explanation: "여자가 아픈 부위를 말하며 '약'을 요구하였고, 약사가 '이 약을 드세요'라고 건네며 복약 지도를 하고 있으므로 대화 장소는 **약국**이 확실합니다.",
        instructorGuide: "<strong>[듣기 2번 교수 시나리오]</strong><br>- <strong>키워드 낚아채기 훈련:</strong> '머리가 아파요', '약 좀 주세요'가 나오는 순간 대화 상대방이 '약사'이고 장소는 '약국'임을 바로 추론하게 지도하세요.",
        optionExplanations: [
          "① 은행 (X) - 예금, 출금 등 금융 업무와 관련이 없습니다.",
          "② 약국 (O) - '아파요', '약 좀 주세요', '이 약을 드세요' 등의 단어를 통해 조제약을 판매하는 약국임이 확실하게 도출됩니다.",
          "③ 우체국 (X) - 편지, 소포 배달 용어가 언급되지 않았습니다.",
          "④ 세탁소 (X) - 옷 수선, 세탁물 수거 등의 단어와 매칭되지 않습니다."
        ]
      },
      {
        id: "q1_l3",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 이어질 대화로 가장 알맞은 것을 고르십시오.",
        audioScript: [
          { speaker: "남", text: "오늘 날씨가 참 맑네요. 구름도 없어요." }
        ],
        options: [
          "네, 하늘에 구름이 없고 파래요.",
          "네, 우산을 꼭 가져가세요.",
          "네, 비가 많이 쏟아져요.",
          "네, 바람이 불고 추워요."
        ],
        correct: 0,
        explanation: "남자가 날씨가 아주 맑고 구름도 없다고 관찰했으므로 이에 호응하며 '네, 하늘이 파랗다'고 대답하는 ①번이 적절합니다.",
        instructorGuide: "<strong>[듣기 3번 교수 시나리오]</strong><br>- 날씨 감상 표현에 호응하는 맞장구 구조를 가르치세요. ①의 '하늘이 파랗다'가 맑은 상태의 직접적 재서술입니다.",
        optionExplanations: [
          "① 하늘에 구름이 없고 파래요 (O) - 맑은 하늘에 어울리는 최적의 대화 호응입니다.",
          "② 우산을 꼭 가져가세요 (X) - 비 소식이 없으므로 오답입니다.",
          "③ 비가 많이 쏟아져요 (X) - 맑은 상황과 반대되므로 어긋납니다.",
          "④ 바람이 불고 추워요 (X) - 맑은 한낮의 긍정적인 평가와 모순됩니다."
        ]
      },
      {
        id: "q1_l4",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 두 사람이 대화하는 장소로 알맞은 곳을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "이 파란색 옷을 한 번 입어봐도 돼요?" },
          { speaker: "남", text: "네, 손님. 저기 거울이 있는 피팅룸에서 입어보세요. 아주 예쁠 거예요." }
        ],
        options: ["우체국", "옷가게", "미술관", "세탁소"],
        correct: 1,
        explanation: "옷을 입어보겠다고 물어보았고, 탈의 장소(피팅룸)와 거울을 안내하며 점원이 '손님'이라고 칭하므로 **옷가게**가 정답입니다.",
        instructorGuide: "<strong>[듣기 4번 교수 시나리오]</strong><br>- '피팅룸', '입어보다', '옷' 단어를 통해 쇼핑이 벌어지는 매장임을 추론하도록 가르치세요.",
        optionExplanations: [
          "① 우체국 (X) - 편지나 택배를 접수하는 곳이 아닙니다.",
          "② 옷가게 (O) - '옷', '입어보다', '거울', '피팅룸' 등을 통해 옷 매장임을 정확히 파악할 수 있습니다.",
          "③ 미술관 (X) - 미술 작품을 감상하는 전시실이 아닙니다.",
          "④ 세탁소 (X) - 옷을 세탁하거나 수선 의뢰하는 상황이 아닙니다."
        ]
      },
      {
        id: "q1_l5",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 대화 내용과 일치하는 것(같은 내용)을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "민수 씨, 오늘 오후에 특별한 일정이 있어요?" },
          { speaker: "남", text: "아니요, 오늘은 아무 계획이 없어요. 그냥 집에서 밀린 잠을 자고 푹 쉴 거예요." }
        ],
        options: [
          "남자는 오늘 오후에 아주 바쁩니다.",
          "남자는 오늘 집에서 휴식을 취할 것입니다.",
          "여자는 오늘 시장에 가서 옷을 살 것입니다.",
          "두 사람은 오늘 오후에 만나서 놀기로 했습니다."
        ],
        correct: 1,
        explanation: "남자가 오늘 오후에 아무 계획 없이 집에서 잠을 자며 쉴 것이라 했으므로, ②번 '남자는 오늘 집에서 휴식을 취할 것이다'가 가장 일치합니다.",
        instructorGuide: "<strong>[듣기 5번 교수 시나리오]</strong><br>- 남자의 '아무 계획 없다', '푹 쉴 것이다'라는 진술이 보기 ②번의 '휴식을 취할 것이다'로 고급화되어 재서술된 맥락을 매칭시키십시오.",
        optionExplanations: [
          "① 오늘 오후에 아주 바쁩니다 (X) - 아무 계획이 없다고 밝혔으므로 바쁘지 않습니다.",
          "② 집에서 휴식을 취할 것입니다 (O) - '집에서 잠을 자고 푹 쉴 것이다'라는 핵심 대사와 완벽하게 일치합니다.",
          "③ 시장에 가서 옷을 살 것입니다 (X) - 여자의 동선 및 쇼핑 계획은 언급되지 않았습니다.",
          "④ 만나서 놀기로 했습니다 (X) - 남자가 집에서 쉴 것이라 했으므로 오늘 약속은 없습니다."
        ]
      },
      {
        id: "q1_r6",
        type: "reading",
        category: "읽기 (Reading) 추가 실전",
        question: "다음 안내문을 볼 수 있는 장소로 가장 알맞은 곳을 고르십시오.<br><br><div class='quiz-box'><strong>책을 읽는 분들을 위해 조용히 해 주세요.<br>빌린 책은 14일 안에 돌려주세요.</strong></div>",
        options: ["도서관", "식당", "은행", "병원"],
        correct: 0,
        explanation: "'책을 읽다', '빌린 책', '돌려주다'는 도서관에서 사용하는 핵심 표현이므로 정답은 ①번입니다.",
        instructorGuide: "<strong>[추가 읽기 1 교수 팁]</strong><br>- 장소를 직접 말하지 않아도 핵심 명사와 행동을 연결해 장소를 추론하게 하세요.",
        optionExplanations: [
          "① 도서관 (O) - 책을 읽고 빌리고 반납하는 장소입니다.",
          "② 식당 (X) - 음식 주문이나 식사 관련 표현이 없습니다.",
          "③ 은행 (X) - 예금, 출금, 통장 관련 표현이 없습니다.",
          "④ 병원 (X) - 진료나 약과 관련된 안내가 아닙니다."
        ]
      },
      {
        id: "q1_r7",
        type: "reading",
        category: "읽기 (Reading) 추가 실전",
        question: "다음 빈칸에 들어갈 가장 알맞은 조사를 고르십시오.<br><br><div class='quiz-box'>선생님( &nbsp; &nbsp; ) 교실에서 한국어를 가르칩니다.</div>",
        options: ["이", "을", "에", "와"],
        correct: 0,
        explanation: "'선생님'이 행동의 주체이므로 받침 있는 명사 뒤에 붙는 주격 조사 '이'가 알맞습니다.",
        instructorGuide: "<strong>[추가 읽기 2 교수 팁]</strong><br>- 누가 행동하는지 먼저 찾은 뒤 이/가를 선택하게 하세요.",
        optionExplanations: [
          "① 이 (O) - 받침 있는 주어 '선생님' 뒤에 붙는 주격 조사입니다.",
          "② 을 (X) - 목적어를 표시하는 조사입니다.",
          "③ 에 (X) - 시간이나 도착점, 존재 장소 등에 쓰는 조사입니다.",
          "④ 와 (X) - 두 명사를 연결하거나 함께하는 대상을 나타냅니다."
        ]
      },
      {
        id: "q1_l6",
        type: "listening",
        category: "듣기 (Listening) 추가 실전",
        question: "다음을 듣고 여자가 누구인지 고르십시오.",
        audioScript: [
          { speaker: "여", text: "여러분, 책 25쪽을 펴세요. 오늘은 장소를 나타내는 말을 공부하겠습니다." }
        ],
        options: ["학생", "선생님", "의사", "요리사"],
        correct: 1,
        explanation: "여자는 여러 사람에게 책을 펴라고 안내하고 공부할 내용을 설명하므로 선생님입니다.",
        instructorGuide: "<strong>[추가 듣기 1 교수 팁]</strong><br>- '여러분', '책을 펴세요', '공부하겠습니다'를 직업 추론의 단서로 잡게 하세요.",
        optionExplanations: [
          "① 학생 (X) - 수업 내용을 안내하는 역할이 아닙니다.",
          "② 선생님 (O) - 학생들에게 교재와 학습 내용을 안내하고 있습니다.",
          "③ 의사 (X) - 환자나 진료에 관한 말이 없습니다.",
          "④ 요리사 (X) - 음식이나 조리에 관한 말이 없습니다."
        ]
      },
      {
        id: "q1_l7",
        type: "listening",
        category: "듣기 (Listening) 추가 실전",
        question: "다음을 듣고 이어질 말로 가장 알맞은 것을 고르십시오.",
        audioScript: [
          { speaker: "남", text: "수진 씨, 지금 어디에 가요?" }
        ],
        options: ["학교에 가요.", "학교에서 공부했어요.", "학생이 많아요.", "책이 재미있어요."],
        correct: 0,
        explanation: "'어디에 가요?'는 목적지를 묻는 질문이므로 장소와 '에 가요'로 대답하는 ①번이 자연스럽습니다.",
        instructorGuide: "<strong>[추가 듣기 2 교수 팁]</strong><br>- 의문사 '어디'와 이동 표현 '에 가다'의 짝을 빠르게 찾게 하세요.",
        optionExplanations: [
          "① 학교에 가요 (O) - 이동 목적지를 직접 대답합니다.",
          "② 학교에서 공부했어요 (X) - 과거 행동을 말해 질문과 시제가 맞지 않습니다.",
          "③ 학생이 많아요 (X) - 사람 수에 관한 설명입니다.",
          "④ 책이 재미있어요 (X) - 책에 대한 감상으로 질문과 관련이 없습니다."
        ]
      }
    ],

    // 3단계: 마무리 장악 (Vocabulary Mastery)
    vocabularyMastery: {
      title: "6단계: 마무리 정리 (오늘 꼭 복습할 명사 & 동사)",
      description: "오늘 배운 어휘 중 핵심 단어 20개입니다. 카드를 클릭하여 뜻을 확인하고 확실히 암기했는지 체크하세요.",
      nouns: [
        { word: "학생", meaning: "Student" },
        { word: "선생님", meaning: "Teacher" },
        { word: "의사", meaning: "Doctor" },
        { word: "요리사", meaning: "Chef / Cook" },
        { word: "학교", meaning: "School" },
        { word: "병원", meaning: "Hospital" },
        { word: "식당", meaning: "Restaurant" },
        { word: "은행", meaning: "Bank" },
        { word: "커피", meaning: "Coffee" },
        { word: "책", meaning: "Book" }
      ],
      verbs: [
        { word: "가다", meaning: "To go" },
        { word: "오다", meaning: "To come" },
        { word: "하다", meaning: "To do" },
        { word: "먹다", meaning: "To eat" },
        { word: "마시다", meaning: "To drink" },
        { word: "공부하다", meaning: "To study" },
        { word: "가르치다", meaning: "To teach" },
        { word: "치료하다", meaning: "To treat / cure" },
        { word: "만들다", meaning: "To make" },
        { word: "기다리다", meaning: "To wait" }
      ]
    }
  },
  {
    id: 2,
    title: "2회차: 일상생활과 물건 쇼핑",
    subTitle: "가장 실용적인 한국어 표현! 물건 구매, 식사, 그리고 조사 결합 형태를 훈련합니다.",
    duration: "2시간",

    // 상세 시간표 (Timeline)
    timeline: [
      { time: "10분", activity: "도입 & 1회차 복습", detail: "지난 시간 핵심 어휘·조사 확인 및 쇼핑 주제 학습 준비" },
      { time: "20분", activity: "1단계: 핵심 어휘 학습", detail: "물건·단위·화폐·쇼핑 동사를 그림과 예문으로 학습" },
      { time: "15분", activity: "2단계: 읽기 전 지식 학습", detail: "입장 요금·이용 시간·단위 명사와 조사·과거형 학습" },
      { time: "25분", activity: "3단계: 읽기 문제 풀이", detail: "안내문의 숫자·요일·가격을 표시하며 읽기 문제집 풀이" },
      { time: "10분", activity: "쉬는 시간", detail: "중간 휴식 시간" },
      { time: "15분", activity: "4단계: 듣기 전 지식 학습", detail: "가격·영수증·사이즈·교환 명사와 쇼핑 요청 표현 학습" },
      { time: "15분", activity: "5단계: 듣기 문제 풀이", detail: "요청과 응답, 변경된 정보를 구분하며 듣기 문제집 풀이" },
      { time: "10분", activity: "6단계: 마무리 복습", detail: "오답 어휘와 표현을 플래시카드로 다시 확인" }
    ],

    // 1단계: 단위 공부 (Vocab Warm-up)
    vocabWarmUp: {
      title: "1단계: 핵심 어휘 학습 (물건 및 쇼핑 관련 어휘)",
      description: "그림 카드를 보고 어떤 물건이나 동작인지 유추한 뒤 카드를 클릭하여 한국어 단어를 확인해 보세요.",
      instructorGuide: "<strong>[핵심 어휘 학습 교수 가이드]</strong><br>- 물건별 세는 단위 명사(개, 잔, 켤레 등)는 한국어 초급자에게 암기 부담이 높습니다. 칠판에 그림 카드를 그리거나 학생 주변 물건을 가리키며 훈련하십시오.<br>- 예문 '커피 한 잔에 오천 원입니다'를 통해 가격 질문 구조('얼마입니까?')와 단위를 유기적으로 연계 설명하세요.",
      categories: [
        {
          name: "🛍️ 물건 및 상점 명사 (Items & Shops)",
          words: [
            { word: "옷", definition: "Clothes", example: "백화점에서 예쁜 옷을 샀습니다.", image: "topik_bookstore_scene.jpg" },
            { word: "신발", definition: "Shoes", example: "이 구두는 신발 가게에서 팝니다.", image: "topik_student_scene.jpg" },
            { word: "과일", definition: "Fruit", example: "시장에서 신선한 과일을 샀어요.", image: "topik_restaurant_scene.jpg" },
            { word: "우산", definition: "Umbrella", example: "비가 와서 우산을 준비했습니다.", image: "topik_rainy_scene.jpg" }
          ]
        },
        {
          name: "🪙 가격 및 단위 명사 (Units & Prices)",
          words: [
            { word: "돈", definition: "Money", example: "지갑에 돈이 별로 없습니다.", image: "topik_bank_scene.jpg" },
            { word: "원", definition: "Won (Korean Currency)", example: "커피 한 잔에 오천 원입니다.", image: "topik_bank_scene.jpg" },
            { word: "잔", definition: "Glass / Cup", example: "물 한 잔만 가져다 주세요.", image: "topik_cafe_scene.jpg" },
            { word: "개", definition: "Item counter (general)", example: "사과 세 개를 바구니에 담았습니다.", image: "topik_restaurant_scene.jpg" }
          ]
        },
        {
          name: "🛒 쇼핑 관련 동사 (Shopping Verbs)",
          words: [
            { word: "사다", definition: "To buy", example: "가게에서 빵을 샀습니다.", image: "topik_bookstore_scene.jpg" },
            { word: "팔다", definition: "To sell", example: "이 마트에서는 과일을 싸게 팝니다.", image: "topik_restaurant_scene.jpg" },
            { word: "빌리다", definition: "To borrow", example: "도서관에서 책 세 권을 빌렸습니다.", image: "topik_bookstore_scene.jpg" },
            { word: "주다", definition: "To give", example: "동생에게 생일 선물을 주었습니다.", image: "topik_teacher_scene.jpg" }
          ]
        }
      ]
    },

    // 🕹️ 2회차 어휘-그림 매칭 게임 (영어가 완전 배제된 6쌍)
    vocabGamePairs: [
      { type: "text-text", text: "옷", matchVal: "👕", key: "clothes" },
      { type: "text-text", text: "신발", matchVal: "👟", key: "shoes" },
      { type: "text-text", text: "과일", matchVal: "🍎", key: "fruit" },
      { type: "text-text", text: "우산", matchVal: "☂️", key: "umbrella" },
      { type: "text-text", text: "돈", matchVal: "💵", key: "money" },
      { type: "text-text", text: "잔", matchVal: "☕", key: "cup" }
    ],

    // 2단계: 실전 훈련 (Actual Practice - 총 10문항)
    practiceQuestions: [
      {
        id: "q2_r1",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 안내문의 내용과 <strong>같은 것</strong>을 고르십시오. (TOPIK I 기출)<br><br><div class='quiz-box'><strong>[미술관 안내]</strong><br>- 이용 시간: 오전 10시 ~ 오후 6시<br>- 입장 요금: 5,000원<br>- (※ 매주 월요일은 쉽니다.)</div>",
        options: [
          "미술관은 월요일에 문을 엽니다.",
          "미술관은 저녁 8시에 문을 닫습니다.",
          "미술관 입장 요금은 오천 원입니다.",
          "오전 9시부터 입장하여 볼 수 있습니다."
        ],
        correct: 2,
        explanation: "안내문을 보면 입장 요금은 '5,000원'이라 명시되어 있습니다. 월요일은 휴관하고, 오전 10시에 열어 오후 6시에 닫으므로 다른 보기들은 오답이며 ③번이 정답입니다.",
        instructorGuide: "<strong>[읽기 1번 교수 시나리오]</strong><br>- <strong>대조 분석 훈련:</strong> 안내판 읽기는 사실 일치 유형으로, 보기를 하나씩 지문의 텍스트와 대조하는 것이 기본입니다.",
        optionExplanations: [
          "① 월요일에 문을 엽니다 (X) - 안내문에 '매주 월요일은 쉽니다(휴무)'라고 나와 있습니다.",
          "② 저녁 8시에 문을 닫습니다 (X) - 이용 시간이 '오후 6시'까지입니다.",
          "③ 입장 요금은 오천 원입니다 (O) - 요금란에 '5,000원'으로 적혀 있는 사실과 정확히 부합합니다.",
          "④ 오전 9시부터 입장할 수 있습니다 (X) - 이용 시작 시간은 오전 10시부터입니다."
        ]
      },
      {
        id: "q2_r2",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 빈칸에 들어갈 가장 알맞은 단어를 고르십시오. (TOPIK I 기출 유형)<br><br><div class='quiz-box'>저는 지난 주말에 친구를 ( &nbsp; &nbsp; &nbsp; &nbsp; ). 그리고 같이 재미있는 영화를 봤습니다.</div>",
        options: ["만났습니다", "만납니다", "만날 것입니다", "만나서"],
        correct: 0,
        explanation: "문장에 '어제'라는 시간 단어가 있고, 뒷문장 역시 과거형 시제 '봤습니다'가 쓰였으므로 시제를 과거형으로 일치시켜야 합니다.",
        instructorGuide: "<strong>[읽기 2번 교수 시나리오]</strong><br>- <strong>시제 일치(Tense Agreement):</strong> 앞문장의 행동 시점이 '어제'이므로 과거 시제를 선택하게 이끄세요.",
        optionExplanations: [
          "① 만났습니다 (O) - '어제' 일어난 과거 사실을 종결짓는 올바른 어미입니다.",
          "② 만납니다 (X) - 현재 시제이므로 시간 어휘와 맞지 않습니다.",
          "③ 만날 것입니다 (X) - 미래 시제이므로 어색합니다.",
          "④ 만나서 (X) - 문장 종결 어미가 필요하므로 틀립니다."
        ]
      },
      {
        id: "q2_r3",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 그림 상황에 맞는 문장으로 가장 알맞은 것을 고르십시오.",
        image: "topik_chef_scene.jpg",
        options: ["음식을 주문합니다.", "요리를 만듭니다.", "청소를 열심히 합니다.", "그릇을 닦습니다."],
        correct: 1,
        explanation: "주방 모자를 쓰고 프라이팬에 요리를 올리고 있는 주방장 셰프의 그림이므로 **요리를 만듭니다**가 정확합니다.",
        instructorGuide: "<strong>[읽기 3번 교수 시나리오]</strong><br>- 요리사, 주방 기구, 끓는 냄비 등을 확인하여 '요리' 키워드를 고르게 하세요.",
        optionExplanations: [
          "① 음식을 주문합니다 (X) - 손님이 카운터나 테이블에서 시키는 대화입니다.",
          "② 요리를 만듭니다 (O) - 조리실에서 직접 음식을 만드는 동작입니다.",
          "③ 청소를 열심히 합니다 (X) - 빗자루나 걸레로 청소하는 묘사가 아닙니다.",
          "④ 그릇을 닦습니다 (X) - 개수대에서 설거지하는 상황이 아닙니다."
        ]
      },
      {
        id: "q2_r4",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 빈칸에 들어갈 알맞은 표현을 고르십시오.<br><br><div class='quiz-box'>저는 지난 주말에 부모님과 함께 제주도로 여행을 ( &nbsp; &nbsp; &nbsp; &nbsp; ).</div>",
        options: ["갔습니다", "갑니다", "갈 것입니다", "가고 싶습니다"],
        correct: 0,
        explanation: "'지난 주말'이라는 과거 시간 지시어가 있으므로 시제는 과거형인 **갔습니다**가 정합합니다.",
        instructorGuide: "<strong>[읽기 4번 교수 시나리오]</strong><br>- '지난~' 어휘를 과거 시제의 문법 단서로 파악하도록 알려주세요.",
        optionExplanations: [
          "① 갔습니다 (O) - 과거완료 사실을 서술하는 표현입니다.",
          "② 갑니다 (X) - 현재형 시제입니다.",
          "③ 갈 것입니다 (X) - 미래 계획이나 약속형 표현입니다.",
          "④ 가고 싶습니다 (X) - 희망/소망을 나타내는 현재적 선호입니다."
        ]
      },
      {
        id: "q2_r5",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 글의 중심 생각을 고르십시오.<br><br><div class='quiz-box'>이 신발은 제 발에 잘 맞고 걸을 때 아주 편합니다. 파란색 색상과 모양도 정말 마음에 듭니다. 그래서 저는 매일 이 신발을 신고 밖으로 나갑니다.</div>",
        options: ["저는 매일 운동을 합니다.", "이 신발은 아주 마음에 듭니다.", "저는 새 신발을 사고 싶습니다.", "이 신발은 가격이 비쌉니다."],
        correct: 1,
        explanation: "신발이 아주 편하고, 색깔과 모양이 내 취향에 맞아 마음에 든다는 글쓴이의 주관적 만족도를 설명하고 있으므로 ②번이 최적의 중심 생각입니다.",
        instructorGuide: "<strong>[읽기 5번 교수 시나리오]</strong><br>- 글 전반의 긍정적인 서술 흐름('편하다', '마음에 든다', '신고 나간다')을 대표하는 단어 '마음에 듭니다'를 연결해 보게 유도하십시오.",
        optionExplanations: [
          "① 매일 운동을 합니다 (X) - 운동 목적이 아닌 일반 보행 및 신발에 대한 만족도 서술입니다.",
          "② 이 신발은 아주 마음에 듭니다 (O) - 글의 핵심 주제를 정확하게 서술하고 있습니다.",
          "③ 새 신발을 사고 싶습니다 (X) - 이미 신발을 가지고 있으므로 모순됩니다.",
          "④ 가격이 비쌉니다 (X) - 가격 정보는 적혀 있지 않습니다."
        ]
      },
      {
        id: "q2_l1",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 이어질 대화로 가장 알맞은 것을 고르십시오. (TOPIK I 기출)",
        audioScript: [
          { speaker: "남", text: "처음 뵙겠습니다. 김민수입니다." }
        ],
        options: [
          "반갑습니다. 저는 이수진입니다.",
          "네, 안녕히 계세요.",
          "미안합니다. 괜찮습니다.",
          "축하합니다. 고맙습니다."
        ],
        correct: 0,
        explanation: "남자가 처음 만났을 때 나누는 자기소개 인사를 건넸으므로 이에 이어질 가장 적절한 대답은 맞인사인 '반갑습니다. 저는 이수진입니다.'(①)가 가장 명확합니다.",
        instructorGuide: "<strong>[듣기 1번 교수 시나리오]</strong><br>- <strong>첫 만남 발화 상황 재현:</strong> 강사가 학생 한 명을 지목하여 '처음 뵙겠습니다' 인사를 유도하십시오.",
        optionExplanations: [
          "① 반갑습니다. 저는 이수진입니다 (O) - 인사에 상호적으로 대답하는 올바른 격식입니다.",
          "② 네, 안녕히 계세요 (X) - 작별 인사입니다.",
          "③ 미안합니다. 괜찮습니다 (X) - 사과에 대한 응답입니다.",
          "④ 축하합니다. 고맙습니다 (X) - 감사에 관한 맥락입니다."
        ]
      },
      {
        id: "q2_l2",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 대화 내용과 일치하는 것(같은 내용)을 고르십시오. (TOPIK I 기출)",
        audioScript: [
          { speaker: "여", text: "민수 씨, 컴퓨터 다 고쳤어요?" },
          { speaker: "남", text: "아니요, 아직 고치고 있어요. 조금만 기다려 주세요." },
          { speaker: "여", text: "그럼 컴퓨터를 다 고친 후에 저한테 꼭 연락해 주세요." }
        ],
        options: [
          "남자는 컴퓨터 수리를 완전히 끝냈습니다.",
          "여자가 직접 도구를 들고 컴퓨터를 고치고 있습니다.",
          "남자는 지금 현재 컴퓨터를 고치고 있습니다.",
          "두 사람은 오늘 매장에 가서 컴퓨터를 새로 살 것입니다."
        ],
        correct: 2,
        explanation: "남자가 '아니요, 아직 고치고 있어요'라고 말했으므로 남자가 지금 컴퓨터를 수리 중인 상태입니다. 따라서 정답은 ③번입니다.",
        instructorGuide: "<strong>[듣기 2번 교수 시나리오]</strong><br>- <strong>진행 상태 파악:</strong> 대화 속 '아직 ~고 있어요'가 현재 진행 중이며 끝나지 않은 상태임을 강조하십시오.",
        optionExplanations: [
          "① 수리를 완전히 끝냈습니다 (X) - 아직 진행형이므로 틀립니다.",
          "② 여자가 고칩니다 (X) - 실제 수리 주체는 남자입니다.",
          "③ 지금 컴퓨터를 고치고 있습니다 (O) - 대화 속 남자의 행동 상태와 완벽히 맞아떨어집니다.",
          "④ 새로 살 것입니다 (X) - 수리 중이므로 어울리지 않습니다."
        ]
      },
      {
        id: "q2_l3",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 이어질 대화로 가장 알맞은 것을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "민수 씨, 생일 축하해요! 여기 제 생일 선물이에요." }
        ],
        options: [
          "정말 고마워요. 마음에 들어요.",
          "네, 안녕히 계세요.",
          "죄송합니다. 늦었습니다.",
          "아니요, 저는 선물이 없어요."
        ],
        correct: 0,
        explanation: "상대방이 생일 축하와 함께 선물을 건넸으므로 감사를 표하는 '정말 고마워요' 대화인 ①번이 정답입니다.",
        instructorGuide: "<strong>[듣기 3번 교수 시나리오]</strong><br>- 축하 및 선물 건네기 상황에 건네는 감사 피드백 대화 유형을 가르쳐주세요.",
        optionExplanations: [
          "① 정말 고마워요. 마음에 들어요 (O) - 선물을 받고 나누는 자연스럽고 훈훈한 화답입니다.",
          "② 안녕히 계세요 (X) - 헤어지는 작별 구도이므로 어색합니다.",
          "③ 죄송합니다 (X) - 실수를 고백하거나 사과할 때 쓰는 표현입니다.",
          "④ 저는 선물이 없어요 (X) - 선물을 수령하는 입장에서의 답으로 무례합니다."
        ]
      },
      {
        id: "q2_l4",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 두 사람이 대화하는 장소로 가장 알맞은 곳을 고르십시오.",
        audioScript: [
          { speaker: "남", text: "사장님, 맛있는 사과 세 개랑 노란 바나나 한 송이 주세요." },
          { speaker: "여", text: "네, 손님. 여기 담아 드립니다. 모두 합해서 구천 원입니다." }
        ],
        options: ["우체국", "과일 가게", "병원", "세탁소"],
        correct: 1,
        explanation: "사과와 바나나를 지정하여 주문하고 금액을 결제하는 대화이므로 청과 상점인 **과일 가게**가 맞습니다.",
        instructorGuide: "<strong>[듣기 4번 교수 시나리오]</strong><br>- '사과', '바나나', '구천 원' 같은 단어를 칠판에 적으며 상거래 상황의 상점 분류를 연상하게 지도하세요.",
        optionExplanations: [
          "① 우체국 (X) - 우편 관련 대화가 아닙니다.",
          "② 과일 가게 (O) - 사과와 바나나를 현금 계산하여 포장하는 상거래 장소이므로 정확합니다.",
          "③ 병원 (X) - 건강에 관한 의학적 조언 대사가 아닙니다.",
          "④ 세탁소 (X) - 세탁 의류를 취급하는 정황이 아닙니다."
        ]
      },
      {
        id: "q2_l5",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 대화 내용과 일치하는 것(같은 내용)을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "민수 씨, 지갑에 지금 현금이 좀 있어요?" },
          { speaker: "남", text: "아니요, 지갑을 오늘 집에 두고 나와서 현금은 없어요. 대신 주머니에 신용카드는 있어요." }
        ],
        options: [
          "남자는 지갑에 현금이 많습니다.",
          "남자는 지금 신용카드를 가지고 있습니다.",
          "남자는 지갑을 찾으러 집에 갈 예정입니다.",
          "여자가 남자에게 지갑을 선물해 줄 것입니다."
        ],
        correct: 1,
        explanation: "남자가 지갑은 집에 두었으나 주머니에 신용카드가 있다고 진술했으므로, ②번 '남자는 지금 신용카드를 가지고 있다'가 확실한 일치 사실입니다.",
        instructorGuide: "<strong>[듣기 5번 교수 시나리오]</strong><br>- 소지 품목의 유무 판정 훈련입니다. '지갑 O/X, 현금 O/X, 카드 O/X'를 칠판에 O/X 표로 그리며 확인하게 지도해 주세요.",
        optionExplanations: [
          "① 현금이 많습니다 (X) - 지갑이 집에 있고 현금이 전혀 없다고 밝혔습니다.",
          "② 신용카드를 가지고 있습니다 (O) - 주머니에 카드가 들어있는 상태이므로 사실과 부합합니다.",
          "③ 지갑을 찾으러 집에 갑니다 (X) - 집에 가겠다는 동작 의도는 직접 언급되지 않았습니다.",
          "④ 지갑을 선물해 줍니다 (X) - 선물에 대한 제안이나 거래 정황은 들리지 않습니다."
        ]
      },
      {
        id: "q2_r6",
        type: "reading",
        category: "읽기 (Reading) 추가 실전",
        question: "다음 광고의 내용과 같은 것을 고르십시오.<br><br><div class='quiz-box'><strong>[여름 신발 할인]</strong><br>운동화 30,000원 → 20,000원<br>이번 주 일요일까지</div>",
        options: ["운동화는 삼만 원입니다.", "할인은 다음 달까지입니다.", "운동화를 이만 원에 살 수 있습니다.", "일요일에는 가게가 쉽니다."],
        correct: 2,
        explanation: "광고에 할인 가격이 20,000원으로 표시되어 있으므로 ③번이 내용과 같습니다.",
        instructorGuide: "<strong>[추가 읽기 1 교수 팁]</strong><br>- 원래 가격, 할인 가격, 행사 기간을 각각 표시한 뒤 선택지와 대조하게 하세요.",
        optionExplanations: [
          "① 삼만 원입니다 (X) - 삼만 원은 할인 전 가격입니다.",
          "② 다음 달까지입니다 (X) - 이번 주 일요일까지라고 했습니다.",
          "③ 이만 원에 살 수 있습니다 (O) - 표시된 할인 가격과 같습니다.",
          "④ 일요일에 쉽니다 (X) - 일요일까지 할인한다는 뜻이지 휴무라는 뜻이 아닙니다."
        ]
      },
      {
        id: "q2_r7",
        type: "reading",
        category: "읽기 (Reading) 추가 실전",
        question: "다음 빈칸에 들어갈 가장 알맞은 말을 고르십시오.<br><br><div class='quiz-box'>카페에서 커피 두 ( &nbsp; &nbsp; )을 주문했습니다.</div>",
        options: ["명", "잔", "켤레", "장"],
        correct: 1,
        explanation: "커피나 차처럼 컵에 담긴 음료를 셀 때는 단위 명사 '잔'을 사용합니다.",
        instructorGuide: "<strong>[추가 읽기 2 교수 팁]</strong><br>- 명·잔·켤레·장의 대표 명사를 함께 연결해 단위 명사를 비교하세요.",
        optionExplanations: [
          "① 명 (X) - 사람을 세는 단위입니다.",
          "② 잔 (O) - 컵에 담긴 음료를 세는 단위입니다.",
          "③ 켤레 (X) - 신발이나 양말을 세는 단위입니다.",
          "④ 장 (X) - 종이, 표, 얇은 물건을 세는 단위입니다."
        ]
      },
      {
        id: "q2_l6",
        type: "listening",
        category: "듣기 (Listening) 추가 실전",
        question: "다음을 듣고 여자가 할 행동으로 가장 알맞은 것을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "이 신발은 조금 작아요. 한 사이즈 큰 것으로 바꿔 주세요." },
          { speaker: "남", text: "네, 손님. 잠시만 기다려 주세요." }
        ],
        options: ["신발값을 깎습니다.", "신발을 더 작은 것으로 바꿉니다.", "큰 사이즈 신발을 받습니다.", "신발을 빌립니다."],
        correct: 2,
        explanation: "여자는 현재 신발이 작아서 더 큰 사이즈로 교환해 달라고 요청했습니다.",
        instructorGuide: "<strong>[추가 듣기 교수 팁]</strong><br>- '작다'와 '한 사이즈 큰 것'의 대조를 듣고 교환 행동을 예측하게 하세요.",
        optionExplanations: [
          "① 값을 깎습니다 (X) - 가격 할인을 요청하지 않았습니다.",
          "② 더 작은 것으로 바꿉니다 (X) - 현재 신발이 이미 작습니다.",
          "③ 큰 사이즈 신발을 받습니다 (O) - 여자의 교환 요청과 일치합니다.",
          "④ 신발을 빌립니다 (X) - 구매한 상품을 교환하는 상황입니다."
        ]
      }
    ],

    // 3단계: 마무리 장악 (Vocabulary Mastery)
    vocabularyMastery: {
      title: "6단계: 마무리 정리 (오늘 꼭 복습할 명사 & 동사)",
      description: "오늘 배운 어휘 중 핵심 단어 20개입니다. 카드를 클릭하여 뜻을 확인하고 확실히 암기했는지 체크하세요.",
      nouns: [
        { word: "옷", meaning: "Clothes" },
        { word: "신발", meaning: "Shoes" },
        { word: "과일", meaning: "Fruit" },
        { word: "우산", meaning: "Umbrella" },
        { word: "돈", meaning: "Money" },
        { word: "원", meaning: "Won (Currency)" },
        { word: "잔", meaning: "Glass / Cup" },
        { word: "개", meaning: "Counter for items" },
        { word: "구두", meaning: "Dress shoes" },
        { word: "선물", meaning: "Gift / Present" }
      ],
      verbs: [
        { word: "사다", meaning: "To buy" },
        { word: "팔다", meaning: "To sell" },
        { word: "빌리다", meaning: "To borrow" },
        { word: "주다", meaning: "To give" },
        { word: "읽다", meaning: "To read" },
        { word: "깎아주다", meaning: "To give a discount" },
        { word: "이야기하다", meaning: "To talk / converse" },
        { word: "좋아하다", meaning: "To like" },
        { word: "운동하다", meaning: "To exercise" },
        { word: "만나다", meaning: "To meet" }
      ]
    }
  },
  {
    id: 3,
    title: "3회차: 시간, 상태, 그리고 미래 계획",
    subTitle: "일정 및 약속 잡기! 날씨, 시간 관련 어휘와 미래 시제 문법을 연습합니다.",
    duration: "2시간",

    // 상세 시간표 (Timeline)
    timeline: [
      { time: "10분", activity: "도입 & 2회차 복습", detail: "지난 시간 쇼핑 어휘·표현 확인 및 일정·날씨 주제 준비" },
      { time: "20분", activity: "1단계: 핵심 어휘 학습", detail: "시간·날씨 명사, 상태 형용사, 계획 동사를 예문으로 학습" },
      { time: "15분", activity: "2단계: 읽기 전 지식 학습", detail: "주말·약속·일정 명사와 시간 조사, 미래 계획 표현 학습" },
      { time: "25분", activity: "3단계: 읽기 문제 풀이", detail: "시간축과 장소를 표시하며 중심 생각·일정표 문제 풀이" },
      { time: "10분", activity: "쉬는 시간", detail: "중간 휴식 시간" },
      { time: "15분", activity: "4단계: 듣기 전 지식 학습", detail: "날씨·약속 변경 명사와 이유·조건 표현 학습" },
      { time: "15분", activity: "5단계: 듣기 문제 풀이", detail: "원래 시간·변경 시간·이유를 메모하며 듣기 문제집 풀이" },
      { time: "10분", activity: "6단계: 마무리 복습", detail: "틀린 문제의 시간·조사·계획 표현을 최종 복습" }
    ],

    // 1단계: 단위 공부 (Vocab Warm-up)
    vocabWarmUp: {
      title: "1단계: 핵심 어휘 학습 (시간 및 상태 표현)",
      description: "그림 카드를 보고 어떤 날씨나 상태 혹은 동사인지 유추한 뒤 카드를 클릭하여 한국어 단어를 확인해 보세요.",
      instructorGuide: "<strong>[핵심 어휘 학습 교수 가이드]</strong><br>- 감정/상태 형용사 '아프다', '바쁘다'의 활용형('아파요', '바빠요')을 칠판에 나란히 적어 'ㅡ' 탈락을 설명하십시오.<br>- 미래 계획 표현 '-(으)ㄹ 거예요'를 활용해 주말에 무엇을 할지 한 명씩 이어서 대답하게 하십시오.",
      categories: [
        {
          name: "📅 시간 및 날씨 명사 (Time & Weather)",
          words: [
            { word: "오늘", definition: "Today", example: "오늘 오후에 친구를 만나기로 했습니다.", image: "topik_cafe_scene.jpg" },
            { word: "내일", definition: "Tomorrow", example: "내일은 주말이라 회사에 안 갑니다.", image: "topik_student_scene.jpg" },
            { word: "주말", definition: "Weekend", example: "주말에 산에 등산을 하러 갑니다.", image: "topik_bookstore_scene.jpg" },
            { word: "비", definition: "Rain", example: "비가 오니까 외출하지 마세요.", image: "topik_rainy_scene.jpg" }
          ]
        },
        {
          name: "🌡️ 상태 형용사 (Adjectives)",
          words: [
            { word: "아프다", definition: "Sick / Painful", example: "어제부터 머리가 아픕니다.", image: "topik_doctor_scene.jpg" },
            { word: "피곤하다", definition: "Tired", example: "밤에 늦게 자서 오늘 아주 피곤해요.", image: "topik_student_scene.jpg" },
            { word: "바쁘다", definition: "Busy", example: "시험 공부 때문에 요즘 무척 바쁩니다.", image: "topik_bookstore_scene.jpg" },
            { word: "맑다", definition: "Clear / Sunny", example: "하늘이 아주 맑고 시원합니다.", image: "topik_rainy_scene.jpg" }
          ]
        },
        {
          name: "🗺️ 상태 및 계획 동사 (State & Plan)",
          words: [
            { word: "쉬다", definition: "To rest", example: "피곤할 때는 집에서 푹 쉽니다.", image: "topik_student_scene.jpg" },
            { word: "약속하다", definition: "To promise / make appointment", example: "친구와 6시에 만나기로 약속했습니다.", image: "topik_cafe_scene.jpg" },
            { word: "생각하다", definition: "To think", example: "내년에는 한국에 갈까 생각합니다.", image: "topik_bookstore_scene.jpg" },
            { word: "사오다", definition: "To buy and bring", example: "돌아오는 길에 약을 사왔습니다.", image: "topik_doctor_scene.jpg" }
          ]
        }
      ]
    },

    // 🕹️ 3회차 어휘-그림 매칭 게임 (영어가 완전 배제된 6쌍)
    vocabGamePairs: [
      { type: "text-text", text: "오늘", matchVal: "📅", key: "today" },
      { type: "text-text", text: "내일", matchVal: "⏭️", key: "tomorrow" },
      { type: "text-text", text: "비", matchVal: "🌧️", key: "rain" },
      { type: "text-text", text: "아프다", matchVal: "🤒", key: "sick" },
      { type: "text-text", text: "쉬다", matchVal: "🛋️", key: "rest" },
      { type: "text-text", text: "약속하다", matchVal: "🤝", key: "promise" }
    ],

    // 2단계: 실전 훈련 (Actual Practice - 총 10문항)
    practiceQuestions: [
      {
        id: "q3_r1",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 글을 읽고 중심 생각(주제)으로 가장 알맞은 것을 고르십시오. (TOPIK I 기출)<br><br><div class='quiz-box'>저는 어제 자전거를 새로 샀습니다. 자전거를 타는 것이 아주 재미있습니다. 빨리 주말이 와서 근처 공원에서 자전거를 타고 싶습니다.</div>",
        options: [
          "저는 자전거를 타고 출근합니다.",
          "저는 자전거를 사고 싶습니다.",
          "저는 자전거 타는 것이 즐겁습니다.",
          "저는 주말마다 너무 바쁩니다."
        ],
        correct: 2,
        explanation: "자전거를 사서 그것을 타는 행위가 '아주 재미있다'고 했고, 주말이 와서 빨리 타고 싶다는 기대감을 표현하고 있으므로, 글쓴이의 중심 생각은 **자전거 타는 것이 즐겁다**는 내용인 ③번이 확실합니다.",
        instructorGuide: "<strong>[읽기 1번 교수 시나리오]</strong><br>- <strong>중심 생각 찾기 요령:</strong> 본문 속에 나오는 화자의 '감정 어휘(재미있다)'나 '의도/소망(타고 싶다)'이 들어가 있는 보기가 정답이 될 확률이 매우 높음을 짚으십시오.",
        optionExplanations: [
          "① 자전거를 타고 출근합니다 (X) - 목적지가 공원이므로 틀립니다.",
          "② 자전거를 사고 싶습니다 (X) - 어제 새로 샀으므로 희망사항과 반대됩니다.",
          "③ 자전거 타는 것이 즐겁습니다 (O) - 자전거를 타는 일이 재미있다는 서술과 완벽히 호환됩니다.",
          "④ 주말마다 너무 바쁩니다 (X) - 주말을 대기하며 타고 싶어 할 뿐 바쁘다는 얘기가 아닙니다."
        ]
      },
      {
        id: "q3_r2",
        type: "reading",
        category: "읽기 (Reading) 기출",
        question: "다음 글을 읽고 내용과 같은 것(일치하는 것)을 고르십시오. (TOPIK I 기출)<br><br><div class='quiz-box'>우리 동네는 공기가 맑고 아주 조용합니다. 근처에 큰 산이 있어서 등산을 하기에 매우 좋습니다. 그래서 주말에는 다른 동네 사람들도 우리 동네 산에 많이 찾아옵니다.</div>",
        options: [
          "우리 동네는 사람들이 많아 시끄럽습니다.",
          "우리 동네 주변에는 산이 전혀 없습니다.",
          "주말에 사람들이 우리 동네 산에 옵니다.",
          "저는 주말마다 등산을 하러 다른 동네로 갑니다."
        ],
        correct: 2,
        explanation: "글의 마지막 문장인 '주말에는 다른 동네 사람들도 우리 동네 산에 많이 찾아옵니다'를 통해 주말에 외부 사람들이 동네 산을 찾는다는 것을 유추할 수 있습니다. 따라서 정답은 ③번입니다.",
        instructorGuide: "<strong>[읽기 2번 교수 시나리오]</strong><br>- <strong>지문 팩트 매칭:</strong> '동네의 특징'을 조율하며 오답 선택지를 지워가는 훈련을 유도하세요.",
        optionExplanations: [
          "① 시끄럽습니다 (X) - 동네가 아주 조용하다고 진술했습니다.",
          "② 산이 전혀 없습니다 (X) - 근처에 큰 산이 있다고 말했습니다.",
          "③ 주말에 사람들이 우리 동네 산에 옵니다 (O) - 타지 사람들이 산에 찾아온다는 마지막 대목과 일치합니다.",
          "④ 다른 동네로 갑니다 (X) - 자신이 타 동네로 등산하러 원정을 간다는 묘사가 아닙니다."
        ]
      },
      {
        id: "q3_r3",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 그림을 보고 상황에 맞는 문장으로 가장 알맞은 것을 고르십시오.",
        image: "topik_school_scene.jpg",
        options: ["학교에서 수업을 듣습니다.", "영화관에서 팝콘을 먹습니다.", "병원에서 진료를 대기합니다.", "은행에서 카드를 만듭니다."],
        correct: 0,
        explanation: "그림은 넓은 운동장이 있는 학교 전경을 묘사하고 있으므로, 학교 내 활동 상황인 ①번이 정답입니다.",
        instructorGuide: "<strong>[읽기 3번 교수 시나리오]</strong><br>- 정문, 학교 건물, 학생의 이동 등을 관찰하여 장소 '학교'를 연상시키세요.",
        optionExplanations: [
          "① 학교에서 수업을 듣습니다 (O) - 학교라는 특수 공간에서 일어나는 통상 활동에 완벽히 정합합니다.",
          "② 영화관에서 팝콘을 먹습니다 (X) - 상영관의 정경이 아닙니다.",
          "③ 병원에서 진료를 대기합니다 (X) - 환자 대기실 정경과 거리가 멉니다.",
          "④ 은행에서 카드를 만듭니다 (X) - 금융 창구 데스크 묘사가 아닙니다."
        ]
      },
      {
        id: "q3_r4",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 빈칸에 들어갈 문법 표현으로 가장 알맞은 것을 고르십시오.<br><br><div class='quiz-box'>내일은 즐거운 주말( &nbsp; &nbsp; &nbsp; &nbsp; ) 회사에 출근하지 않고 집에서 푹 쉴 것입니다.</div>",
        options: ["이어서", "이라서", "이거나", "이지만"],
        correct: 1,
        explanation: "회사에 가지 않고 집에서 쉬는 이유가 뒤이어 나오는 인과적 어미인 **이라서**(주말이기 때문에)가 결합해야 자연스럽습니다.",
        instructorGuide: "<strong>[읽기 4번 교수 시나리오]</strong><br>- <strong>이유 어미 설명:</strong> 명사 + (이)라서가 구어와 문어에서 인과 관계(Because)를 나타낼 때 쓰임을 예문으로 판서해 주세요.",
        optionExplanations: [
          "① 이어서 (X) - 행동이나 상태가 이어진다는 뜻이므로 인과성에 어긋납니다.",
          "② 이라서 (O) - 주말이라는 조건이 원인이 되어 쉰다는 표현이 매끄럽습니다.",
          "③ 이거나 (X) - 대상을 선택 나열하는 어미입니다.",
          "④ 이지만 (X) - 양보/대조의 어미로 '회사에 간다'는 문장과 결합해야 합니다."
        ]
      },
      {
        id: "q3_r5",
        type: "reading",
        category: "읽기 (Reading) 추가 기출",
        question: "다음 글의 내용과 일치하는 것(같은 것)을 고르십시오.<br><br><div class='quiz-box'>우리 동네에는 아주 크고 예쁜 카페가 있습니다. 커피 맛도 정말 훌륭하고 조용합니다. 저는 오늘 오후에 그 카페에 가서 커피를 마시며 재미있는 소설책을 읽을 계획입니다.</div>",
        options: [
          "저는 오늘 동네 카페에 갈 계획입니다.",
          "동네 카페는 커피가 맛이 없습니다.",
          "저는 오늘 카페에서 친구를 만날 것입니다.",
          "우리 동네 카페는 가격이 너무 비쌉니다."
        ],
        correct: 0,
        explanation: "글쓴이가 오늘 오후에 동네 카페에 방문하여 독서를 할 생각이라고 계획을 밝혔으므로, ①번 '저는 오늘 동네 카페에 갈 계획이다'가 완벽하게 일치합니다.",
        instructorGuide: "<strong>[읽기 5번 교수 시나리오]</strong><br>- 글쓴이의 주어와 계획 시점('오늘 오후')을 맞대조하여 팩트를 검증하도록 가이드하십시오.",
        optionExplanations: [
          "① 오늘 동네 카페에 갈 계획입니다 (O) - 오늘 오후 독서 방문 계획 서술과 확실히 호환됩니다.",
          "② 커피가 맛이 없습니다 (X) - '커피 맛도 정말 훌륭하다'고 극찬했으므로 모순됩니다.",
          "③ 카페에서 친구를 만납니다 (X) - 친구에 관한 약속 진술은 없습니다.",
          "④ 가격이 너무 비쌉니다 (X) - 가격 정보는 글 속에 명시되어 있지 않습니다."
        ]
      },
      {
        id: "q3_l1",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 이어질 대화로 가장 알맞은 것을 고르십시오. (TOPIK I 기출)",
        audioScript: [
          { speaker: "남", text: "수진 씨, 이번 주말에 뭐 할 거예요?" }
        ],
        options: [
          "주말에 날씨가 아주 좋았어요.",
          "집에서 재미있는 책을 읽을 거예요.",
          "지난주에 친구를 만나 영화를 봤어요.",
          "영화관이 우리 집에서 아주 멀어요."
        ],
        correct: 1,
        explanation: "남자가 '주말에 뭐 할 거예요?'라며 미래 계획을 물어보았으므로, 자신의 주말 예정 활동을 '~을 거예요' 시제로 답하는 '집에서 책을 읽을 거예요.'(②)가 유일하게 알맞은 대답입니다.",
        instructorGuide: "<strong>[듣기 1번 교수 시나리오]</strong><br>- <strong>의문사 및 시제 매칭:</strong> 질문 속 미래형 어미('할 거예요')를 확인해 주말 계획 답변을 고르게 지도하십시오.",
        optionExplanations: [
          "① 좋았어요 (X) - 과거 시제 서술이므로 미래 계획 대답으로 안 맞습니다.",
          "② 책을 읽을 거예요 (O) - 미래에 계획하는 행동을 자연스럽게 답변하는 격조입니다.",
          "③ 영화를 봤어요 (X) - 과거 행동을 나타내므로 시제가 어긋납니다.",
          "④ 아주 멀어요 (X) - 거리 정보 설명은 주말 계획과 무관합니다."
        ]
      },
      {
        id: "q3_l2",
        type: "listening",
        category: "듣기 (Listening) 기출",
        question: "다음을 듣고 대화가 끝난 후 두 사람이 할 행동으로 가장 알맞은 것을 고르십시오. (TOPIK I 기출)",
        image: "topik_rainy_scene.jpg",
        audioScript: [
          { speaker: "여", text: "민수 씨, 지금 밖에 비가 많이 와요. 혹시 우산이 있어요?" },
          { speaker: "남", text: "아니요, 안 가져왔어요. 수진 씨는 우산이 있어요?" },
          { speaker: "여", text: "저도 없어요. 그럼 우리 아래층 편의점에 가서 우산을 같이 사요." },
          { speaker: "남", text: "네, 좋아요. 지금 같이 내려가요." }
        ],
        options: [
          "편의점에 우산을 사러 갑니다.",
          "공원에 가서 운동을 합니다.",
          "도서관에서 책을 빌립니다.",
          "친구에게 우산을 빌려줍니다."
        ],
        correct: 0,
        explanation: "갑자기 비가 내리기 시작해 두 사람 모두 우산이 없는 상태입니다. 여자가 편의점에 우산을 사러 같이 가자고 제안했고 남자가 이에 수락했으므로 대화 직후 두 사람의 행동은 **우산을 사러 편의점에 가는 것**이 확실합니다. 따라서 정답은 ①번입니다.",
        instructorGuide: "<strong>[듣기 2번 교수 시나리오]</strong><br>- <strong>그림과의 연관성 지도:</strong> 비가 쏟아지는 거리 그림을 보여주며 두 사람의 비상 공동 행동을 파악하게 하세요.",
        optionExplanations: [
          "① 편의점에 우산을 사러 갑니다 (O) - 대화 마무리 단계에서 약속한 내용에 정확히 부합합니다.",
          "② 공원에 가서 운동을 합니다 (X) - 비가 쏟아지고 있으므로 어색합니다.",
          "③ 도서관에서 책을 빌립니다 (X) - 독서 활동 제안은 들리지 않습니다.",
          "④ 우산을 빌려줍니다 (X) - 둘 다 우산이 없어 사러 가는 판이므로 불가합니다."
        ]
      },
      {
        id: "q3_l3",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 이어질 대화로 가장 알맞은 것을 고르십시오.",
        audioScript: [
          { speaker: "남", text: "수진 씨, 내일 아침에 도서관에 공부하러 같이 갈래요?" }
        ],
        options: [
          "좋아요. 아침 여덟 시에 입구에서 만나요.",
          "도서관에 책이 아주 많이 꽂혀 있어요.",
          "네, 도서관은 우리 집에서 무척 멀어요.",
          "아니요, 저는 오늘 그 소설책을 다 읽었습니다."
        ],
        correct: 0,
        explanation: "남자가 같이 도서관에 가자고 제안(갈래요?)했으므로 수락하며 시간과 장소를 약속하는 ①번이 가장 적절합니다.",
        instructorGuide: "<strong>[듣기 3번 교수 시나리오]</strong><br>- 제안어미 '~을래요?'에 대한 응답으로 '좋아요' 및 약속을 정하는 구어체 패턴을 익히도록 발문하세요.",
        optionExplanations: [
          "① 좋아요. 아침 여덟 시에 만나요 (O) - 제안을 흔쾌히 수락하고 약속 세부 정보를 확정하는 대화입니다.",
          "② 책이 많이 꽂혀 있어요 (X) - 도서관의 시설 현황을 설명하는 엉뚱한 대답입니다.",
          "③ 도서관은 멀어요 (X) - 제안에 거절하는 어조로 '네'로 동의하며 멀다고 하는 모순된 문장입니다.",
          "④ 오늘 소설책을 다 읽었습니다 (X) - 도서관 학습 제안의 논지와 매칭이 안 됩니다."
        ]
      },
      {
        id: "q3_l4",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 두 사람이 대화하는 장소로 가장 알맞은 곳을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "승무원님, 이 가방을 통로 쪽에 놓아도 괜찮을까요?" },
          { speaker: "남", text: "아니요, 승객님. 통로는 위험하니 머리 위 선반에 올리시거나 안고 타셔야 합니다. 기차가 곧 출발합니다." }
        ],
        options: ["병원", "약국", "기차 안", "서점"],
        correct: 2,
        explanation: "승무원과 승객이 대화를 나누며 가방 적재를 안내하고 있고, '기차가 출발한다'고 하였으므로 **기차 안**이 확실합니다.",
        instructorGuide: "<strong>[듣기 4번 교수 시나리오]</strong><br>- '승무원', '승객', '선반', '기차 출발' 단어들을 조합해 탑승 공간을 유추하게 이끄십시오.",
        optionExplanations: [
          "① 병원 (X) - 환자 및 진료 행위가 들리지 않습니다.",
          "② 약국 (X) - 복약 지도 상황이 아닙니다.",
          "③ 기차 안 (O) - 출발을 앞둔 기차 객실 정황과 안내 멘트가 완벽히 증명됩니다.",
          "④ 서점 (X) - 도서 검색 및 판매 상황이 아닙니다."
        ]
      },
      {
        id: "q3_l5",
        type: "listening",
        category: "듣기 (Listening) 추가 기출",
        question: "다음을 듣고 대화 내용과 일치하는 것(같은 내용)을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "민수 씨, 내일 비가 오면 등산 약속을 미뤄야 할까요?" },
          { speaker: "남", text: "네, 산길이 미끄러우니 위험해요. 대신 주말 약속을 미술관 관람으로 변경해요." }
        ],
        options: [
          "두 사람은 내일 등산을 강행할 것입니다.",
          "비가 오면 미술관에 가기로 약속을 변경합니다.",
          "두 사람은 내일 도서관에서 만나기로 약속했습니다.",
          "남자는 내일 비가 오지 않기를 간절히 바라고 있습니다."
        ],
        correct: 1,
        explanation: "비가 오면 등산로가 미끄러워 취소하는 대신, 주말 일정을 미술관 관람으로 변경하자는 남자의 제안이 있으므로 ②번이 확실한 일치 진술입니다.",
        instructorGuide: "<strong>[듣기 5번 교수 시나리오]</strong><br>- 조건절('비가 오면')과 대안 행동('미술관 관람')을 문장에서 팩트로 정리하도록 학생들을 가이드해 주세요.",
        optionExplanations: [
          "① 등산을 강행할 것입니다 (X) - 위험하기 때문에 미루고 변경하자고 하였습니다.",
          "② 비가 오면 미술관에 가기로 약속을 변경합니다 (O) - 대화 속 제안 사실과 완벽하게 부합합니다.",
          "③ 도서관에서 만납니다 (X) - 변경 목적지는 도서관이 아닌 미술관입니다.",
          "④ 비가 오지 않기를 바라고 있습니다 (X) - 기상 예측에 대한 심리적 서술은 없습니다."
        ]
      },
      {
        id: "q3_r6",
        type: "reading",
        category: "읽기 (Reading) 추가 실전",
        question: "다음 일정표의 내용과 같은 것을 고르십시오.<br><br><div class='quiz-box'><strong>[토요일 계획]</strong><br>오전 10시: 병원<br>오후 1시: 점심 약속<br>오후 4시: 도서관</div>",
        options: ["아침에 도서관에 갑니다.", "점심을 먹은 후 병원에 갑니다.", "오후 네 시에 도서관에 갑니다.", "토요일에는 약속이 없습니다."],
        correct: 2,
        explanation: "일정표에 오후 4시 도서관 방문이 적혀 있으므로 정답은 ③번입니다.",
        instructorGuide: "<strong>[추가 읽기 교수 팁]</strong><br>- 시간 표현을 먼저 표시하고 각 행동의 순서를 확인하게 하세요.",
        optionExplanations: [
          "① 아침에 도서관에 갑니다 (X) - 아침에는 병원에 갑니다.",
          "② 점심 후 병원에 갑니다 (X) - 병원은 오전 일정입니다.",
          "③ 오후 네 시에 도서관에 갑니다 (O) - 일정표의 내용과 같습니다.",
          "④ 약속이 없습니다 (X) - 오후 1시에 점심 약속이 있습니다."
        ]
      },
      {
        id: "q3_l6",
        type: "listening",
        category: "듣기 (Listening) 추가 실전",
        question: "다음을 듣고 남자의 내일 계획을 고르십시오.",
        audioScript: [
          { speaker: "여", text: "내일 회사가 끝난 후에 뭐 할 거예요?" },
          { speaker: "남", text: "친구 생일이라서 저녁에 같이 밥을 먹을 거예요." }
        ],
        options: ["회사에서 야근합니다.", "친구와 저녁을 먹습니다.", "집에서 혼자 쉽니다.", "친구에게 책을 빌립니다."],
        correct: 1,
        explanation: "남자는 친구 생일을 맞아 내일 저녁에 친구와 함께 식사할 계획입니다.",
        instructorGuide: "<strong>[추가 듣기 1 교수 팁]</strong><br>- 미래형 '-을 거예요' 앞의 행동을 정확히 받아쓰게 하세요.",
        optionExplanations: [
          "① 야근합니다 (X) - 회사가 끝난 후의 계획을 말하고 있습니다.",
          "② 친구와 저녁을 먹습니다 (O) - 남자가 말한 내일 계획과 같습니다.",
          "③ 집에서 쉽니다 (X) - 친구를 만날 예정입니다.",
          "④ 책을 빌립니다 (X) - 책에 대한 언급이 없습니다."
        ]
      },
      {
        id: "q3_l7",
        type: "listening",
        category: "듣기 (Listening) 추가 실전",
        question: "다음을 듣고 두 사람이 약속을 바꾼 이유를 고르십시오.",
        audioScript: [
          { speaker: "남", text: "내일 오전에 공원에서 만날까요?" },
          { speaker: "여", text: "오전에는 비가 많이 온대요. 비가 그치는 오후 세 시에 만나요." }
        ],
        options: ["여자가 아파서", "공원이 문을 닫아서", "오전에 비가 와서", "남자가 바빠서"],
        correct: 2,
        explanation: "오전에 비가 많이 온다는 예보 때문에 만나는 시간을 오후 3시로 변경했습니다.",
        instructorGuide: "<strong>[추가 듣기 2 교수 팁]</strong><br>- 원래 시간, 변경 시간, 변경 이유를 세 칸 표로 정리하게 하세요.",
        optionExplanations: [
          "① 여자가 아파서 (X) - 건강 상태에 대한 말이 없습니다.",
          "② 공원이 문을 닫아서 (X) - 공원 운영 시간은 언급되지 않았습니다.",
          "③ 오전에 비가 와서 (O) - 약속 시간을 바꾼 직접적인 이유입니다.",
          "④ 남자가 바빠서 (X) - 남자의 일정 문제는 나오지 않습니다."
        ]
      }
    ],

    // 3단계: 마무리 장악 (Vocabulary Mastery)
    vocabularyMastery: {
      title: "6단계: 마무리 정리 (오늘 꼭 복습할 명사 & 동사)",
      description: "날씨, 일정 조정, 상태 설명 등에 필수적인 핵심 10개 명사 및 10개 동사입니다.",
      nouns: [
        { word: "오늘", meaning: "Today" },
        { word: "내일", meaning: "Tomorrow" },
        { word: "주말", meaning: "Weekend" },
        { word: "비", meaning: "Rain" },
        { word: "눈", meaning: "Snow / Eye" },
        { word: "바람", meaning: "Wind" },
        { word: "약속", meaning: "Appointment / Promise" },
        { word: "시간", meaning: "Time" },
        { word: "감기", meaning: "Cold (flu)" },
        { word: "머리", meaning: "Head / Hair" }
      ],
      verbs: [
        { word: "쉬다", meaning: "To rest" },
        { word: "약속하다", meaning: "To promise" },
        { word: "생각하다", meaning: "To think" },
        { word: "사오다", meaning: "To buy and bring" },
        { word: "아프다", meaning: "To be sick (Adj)" },
        { word: "피곤하다", meaning: "To be tired (Adj)" },
        { word: "바쁘다", meaning: "To be busy (Adj)" },
        { word: "맑다", meaning: "To be clear (Adj)" },
        { word: "내리다", meaning: "To fall / rain" },
        { word: "걸리다", meaning: "To catch (cold) / take (time)" }
      ]
    }
  }
];
