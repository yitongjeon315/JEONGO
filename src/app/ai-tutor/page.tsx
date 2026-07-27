'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sparkles, MessageSquare, Mic, Volume2, Check, X, ShieldAlert, Award, Star, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  translation?: string;
  pinyin?: string;
  score?: number;
}

export default function AiTutorPage() {
  const { stats, addXP, addGold } = useApp();
  
  // Game states
  const [sessionState, setSessionState] = useState<'lobby' | 'chatting' | 'summary'>('lobby');
  const [selectedTutor, setSelectedTutor] = useState<string>('lily');
  const [selectedScenario, setSelectedScenario] = useState<string>('restaurant');
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showPitchChart, setShowPitchChart] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<any>(null);
  
  // Simulated speech input text they are supposed to read
  const [targetSentence, setTargetSentence] = useState({
    hanzi: '',
    pinyin: '',
    meaning: ''
  });

  const tutors = {
    lily: { name: '릴리 (현지인 친구)', emoji: '🎧', personality: '상하이 트렌디 피플', desc: '유행어와 자연스러운 구어체 위주의 핑퐁 회화.' },
    wang: { name: '왕 선생님 (친절한 멘토)', emoji: '🎒', personality: '표준어 교육공학가', desc: '초보자 맞춤형 천천히 말하기와 기초 문법 피드백.' },
    lee: { name: '교관 리 (독설형 교관)', emoji: '🦁', personality: '스파르타 스피킹 코치', desc: '성조가 1도 틀려도 칼같이 지적하고 교정을 압박.' }
  };

  const scenarios = {
    restaurant: {
      title: '식당에서 훠궈 주문하기',
      turns: [
        {
          aiText: '您好！请问几位？想吃点什么？',
          aiTrans: '안녕하세요! 몇 분이신가요? 무엇을 드시겠어요?',
          userPrompt: '我们两个人，想要一个麻辣火锅。',
          userPinyin: 'Wǒmen liǎng gè rén, xiǎng yào yí gè málà huǒguō.',
          userTrans: '우리 두 명입니다, 마라 훠궈 하나 주세요.',
          simulatedUserPitch: [120, 110, 150, 140, 220, 120, 110, 140, 120, 180],
          simulatedNativePitch: [125, 115, 160, 140, 240, 120, 115, 145, 125, 230],
          vocabScores: [
            { word: '我们', status: 'ok' },
            { word: '想要', status: 'ok' },
            { word: '麻辣', status: 'bad', reason: '麻(má)의 2성 상승조가 너무 평평하게 발음됨.' },
            { word: '火锅', status: 'ok' }
          ]
        },
        {
          aiText: '好的，麻辣火锅。请问需要加些饮料吗？',
          aiTrans: '좋습니다, 마라 훠궈. 음료수도 추가하시겠어요?',
          userPrompt: '我要两杯冰可乐，谢谢。',
          userPinyin: 'Wǒ yào liǎng bēi bīng kělè, xièxie.',
          userTrans: '아이스 콜라 두 잔 주세요, 감사합니다.',
          simulatedUserPitch: [110, 220, 150, 250, 250, 110, 200, 110, 100],
          simulatedNativePitch: [115, 230, 155, 250, 250, 115, 210, 115, 105],
          vocabScores: [
            { word: '两杯', status: 'ok' },
            { word: '可乐', status: 'ok' },
            { word: '谢谢', status: 'ok' }
          ]
        },
        {
          aiText: '没问题，菜马上就来！请慢用。',
          aiTrans: '문제없습니다, 음식 곧 나옵니다! 맛있게 드세요.',
          userPrompt: '太好了，非常感谢！',
          userPinyin: 'Tài hǎo le, fēicháng gǎnxiè!',
          userTrans: '좋네요, 정말 감사합니다!',
          simulatedUserPitch: [220, 110, 100, 250, 180, 110, 220],
          simulatedNativePitch: [240, 115, 100, 250, 185, 115, 230],
          vocabScores: [
            { word: '太好了', status: 'ok' },
            { word: '非常', status: 'ok' },
            { word: '感谢', status: 'ok' }
          ]
        }
      ]
    },
    airport: {
      title: '베이징 공항 입국 심사',
      turns: [
        {
          aiText: '您好，来中国旅游还是工作？',
          aiTrans: '안녕하세요, 중국에는 관광차 오셨나요, 일하러 오셨나요?',
          userPrompt: '我是来旅游的，计划待一个星期。',
          userPinyin: 'Wǒ shì lái lǚyóu de, jìhuà dāi yí gè xīngqī.',
          userTrans: '저는 관광하러 온 것이고, 일주일 머물 예정입니다.',
          simulatedUserPitch: [110, 220, 150, 120, 180, 100, 225, 115, 250, 250, 250],
          simulatedNativePitch: [115, 230, 155, 120, 185, 100, 240, 115, 250, 250, 250],
          vocabScores: [
            { word: '旅游', status: 'ok' },
            { word: '计划', status: 'ok' },
            { word: '星期', status: 'bad', reason: '星期(xīngqī)의 1성 고음 발음 시 떨림 현상 감지.' }
          ]
        }
      ]
    }
  };

  const startScenario = () => {
    const selectedScenarioData = (scenarios as any)[selectedScenario];
    const firstTurn = selectedScenarioData.turns[0];
    
    setTurnIndex(0);
    setMessages([
      {
        sender: 'ai',
        text: firstTurn.aiText,
        translation: firstTurn.aiTrans
      }
    ]);
    
    setTargetSentence({
      hanzi: firstTurn.userPrompt,
      pinyin: firstTurn.userPinyin,
      meaning: firstTurn.userTrans
    });
    
    setSessionState('chatting');
    setShowPitchChart(false);
    setEvaluationReport(null);
  };

  // Simulating Voice Recording and Pitch Analysis
  const triggerSimulatedRecording = () => {
    setIsRecording(true);
    
    setTimeout(() => {
      setIsRecording(false);
      
      const selectedScenarioData = (scenarios as any)[selectedScenario];
      const activeTurn = selectedScenarioData.turns[turnIndex];
      
      // Calculate random high-fidelity score
      const hasErrors = activeTurn.vocabScores.some((w: any) => w.status === 'bad');
      const score = hasErrors ? Math.floor(Math.random() * 10) + 72 : Math.floor(Math.random() * 10) + 88;
      
      setEvaluationReport({
        score,
        vocabScores: activeTurn.vocabScores,
        userPitch: activeTurn.simulatedUserPitch,
        nativePitch: activeTurn.simulatedNativePitch,
        pinyinWords: activeTurn.userPinyin.split(' ')
      });
      
      setShowPitchChart(true);
      
      // Update message listing
      setMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: activeTurn.userPrompt,
          pinyin: activeTurn.userPinyin,
          translation: activeTurn.userTrans,
          score
        }
      ]);
      
      // Add XP & Gold on spoking success
      addXP(20);
      addGold(15);
      
    }, 2500); // 2.5s recording & processing duration
  };

  const advanceConversation = () => {
    const selectedScenarioData = (scenarios as any)[selectedScenario];
    const nextTurnIdx = turnIndex + 1;
    
    if (nextTurnIdx >= selectedScenarioData.turns.length) {
      setSessionState('summary');
    } else {
      setTurnIndex(nextTurnIdx);
      const nextTurn = selectedScenarioData.turns[nextTurnIdx];
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: nextTurn.aiText,
          translation: nextTurn.aiTrans
        }
      ]);
      
      setTargetSentence({
        hanzi: nextTurn.userPrompt,
        pinyin: nextTurn.userPinyin,
        meaning: nextTurn.userTrans
      });
      
      setShowPitchChart(false);
      setEvaluationReport(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {/* Lobby State */}
        {sessionState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Lobby Banner */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col items-center bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/20">
              <div className="w-16 h-16 rounded-full bg-neon-cyan/15 flex items-center justify-center text-neon-cyan glow-cyan animate-float">
                <Sparkles size={32} />
              </div>
              <h3 className="text-base font-bold mt-4 text-white">AI 튜터 성조 매칭 대화방</h3>
              <p className="text-xs text-gray-400 text-center px-4 mt-1 font-medium">
                원하는 성격의 AI 튜터를 배정받아 현지 상황극 롤플레이 대화를 진행합니다.
              </p>
            </div>

            {/* Selector: Tutor */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 px-1">1. AI 튜터 성격 클래스 지정</span>
              <div className="flex flex-col gap-2">
                {Object.entries(tutors).map(([key, tutor]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTutor(key)}
                    className={`glass-panel border rounded-2xl p-4 text-left flex gap-3.5 items-center transition-all ${
                      selectedTutor === key ? 'border-neon-cyan/40 bg-neon-cyan/5' : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-3xl bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                      {tutor.emoji}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {tutor.name}
                        {selectedTutor === key && (
                          <span className="text-[9px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 px-1.5 py-0.2 rounded-full font-bold">
                            배정완료
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {tutor.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector: Scenario */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-xs font-bold text-gray-400 px-1">2. 회화 시나리오 스토리 선택</span>
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setSelectedScenario('restaurant')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    selectedScenario === 'restaurant' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  훠궈 식당 🍲
                </button>
                <button
                  onClick={() => setSelectedScenario('airport')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    selectedScenario === 'airport' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  공항 심사 ✈️
                </button>
              </div>
            </div>

            <button
              onClick={startScenario}
              className="w-full mt-4 py-3.5 bg-neon-cyan hover:bg-cyan-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-neon-cyan/20 hover:scale-105 active:scale-95 transition-all"
            >
              대화방 접속 및 롤플레이 시작
            </button>
          </motion.div>
        )}

        {/* Chatting State */}
        {sessionState === 'chatting' && (
          <motion.div
            key="chatting"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 min-h-[500px]"
          >
            {/* Conversation Header */}
            <div className="glass-panel border-white/10 rounded-2xl px-4 py-3 flex justify-between items-center bg-white/2 shadow">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-lg">
                  {(tutors as any)[selectedTutor].emoji}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{(tutors as any)[selectedTutor].name}</h4>
                  <p className="text-[8px] text-neon-cyan uppercase font-bold">{(tutors as any)[selectedTutor].personality}</p>
                </div>
              </div>
              <button
                onClick={() => setSessionState('lobby')}
                className="text-[10px] text-gray-400 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg"
              >
                강제 이탈
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 min-h-[220px] bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto max-h-[300px]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.sender === 'ai' ? 'self-start items-start' : 'self-end items-end'
                  }`}
                >
                  {/* Sender Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                      msg.sender === 'ai'
                        ? 'bg-white/10 border border-white/10 text-white rounded-tl-sm'
                        : 'bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan rounded-tr-sm'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.pinyin && <div className="text-[10px] text-gray-300/80 font-mono mt-0.5">{msg.pinyin}</div>}
                  </div>
                  {/* Translation */}
                  {msg.translation && (
                    <span className="text-[9px] text-gray-500 font-medium px-1">
                      {msg.translation}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Target Shadowing Guide Panel */}
            <AnimatePresence>
              {!showPitchChart && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel border-neon-cyan/20 rounded-2xl p-4 flex flex-col gap-2 bg-gradient-to-r from-neon-cyan/5 to-transparent"
                >
                  <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-wider">🎙️ 섀도잉 제시 구절</span>
                  <h2 className="text-xl font-extrabold text-white leading-snug">{targetSentence.hanzi}</h2>
                  <p className="text-xs text-gray-400 font-mono font-medium">{targetSentence.pinyin}</p>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5">뜻: {targetSentence.meaning}</p>
                  
                  {/* Microphone Button */}
                  <button
                    onClick={triggerSimulatedRecording}
                    disabled={isRecording}
                    className={`mt-2 py-3 bg-neon-cyan hover:bg-cyan-500 text-dark-bg font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/20 ${
                      isRecording ? 'animate-pulse bg-neon-rose text-white glow-rose' : ''
                    }`}
                  >
                    <Mic size={16} />
                    {isRecording ? '내 음성을 실시간 분석 중입니다...' : '발화 개시 (마이크 녹음)'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tone Pitch Analysis Chart View */}
            <AnimatePresence>
              {showPitchChart && evaluationReport && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel border-white/10 rounded-2xl p-4 flex flex-col gap-3 bg-white/2"
                >
                  {/* Analysis Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Star size={14} className="text-cyber-yellow" />
                      성조 피치 대조 분석 리포트
                    </span>
                    <span className={`text-base font-extrabold ${evaluationReport.score >= 80 ? 'text-neon-green' : 'text-neon-rose'}`}>
                      {evaluationReport.score} 점
                    </span>
                  </div>

                  {/* SVG-based line chart comparing User vs Native pitch */}
                  <div className="h-28 bg-dark-bg/60 border border-white/5 rounded-xl relative p-2 overflow-hidden flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      {/* Native Pitch Line (dotted, blue) */}
                      <path
                        d="M 5,20 Q 25,12 50,15 T 95,5"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        className="opacity-60"
                      />
                      {/* User Pitch Line (solid, red/green) */}
                      <path
                        d="M 5,20 Q 25,18 50,22 T 95,8"
                        fill="none"
                        stroke={evaluationReport.score >= 80 ? '#10b981' : '#f43f5e'}
                        strokeWidth="1.8"
                      />
                    </svg>
                    
                    {/* SVG Legend */}
                    <div className="absolute top-1 right-2 flex gap-3 text-[7px] font-bold">
                      <span className="text-neon-cyan">● 원어민 피치 가이드</span>
                      <span className={evaluationReport.score >= 80 ? 'text-neon-green' : 'text-neon-rose'}>
                        ● 내 음성 피칭
                      </span>
                    </div>
                    
                    {/* Chart axis label */}
                    <span className="absolute bottom-1 left-1.5 text-[7px] text-gray-500 font-bold font-mono">PITCH (Hz)</span>
                    <span className="absolute bottom-1 right-1.5 text-[7px] text-gray-500 font-bold font-mono">TIME (s)</span>
                  </div>

                  {/* Word Feedback Summary */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <h5 className="text-[10px] font-bold text-gray-400">단어별 발음 교정 정보</h5>
                    <div className="flex flex-col gap-1 text-[10px]">
                      {evaluationReport.vocabScores.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-1.5 p-2 rounded-lg border ${
                            item.status === 'ok'
                              ? 'bg-neon-green/5 border-neon-green/10 text-neon-green'
                              : 'bg-neon-rose/5 border-neon-rose/10 text-neon-rose'
                          }`}
                        >
                          {item.status === 'ok' ? <Check size={12} className="shrink-0 mt-0.5" /> : <X size={12} className="shrink-0 mt-0.5" />}
                          <div>
                            <span className="font-bold">{item.word}</span>
                            {item.reason && <p className="text-[9px] text-gray-300 mt-0.5">{item.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={advanceConversation}
                    className="w-full mt-1 py-3 bg-neon-cyan hover:bg-cyan-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-neon-cyan/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    다음 회화 턴 진행 <ChevronRight size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
        )}

        {/* Summary State */}
        {sessionState === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl p-6 flex flex-col items-center bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/20"
          >
            <div className="w-16 h-16 rounded-full bg-neon-cyan/15 flex items-center justify-center text-neon-cyan glow-cyan animate-float">
              <Award size={32} />
            </div>
            <h3 className="text-base font-bold mt-4 text-white">회화 롤플레이 완료!</h3>
            <p className="text-xs text-gray-400 text-center px-4 mt-1 font-medium">
              AI 튜터와의 상황극 스피킹 세션을 무사히 수행하여 스피킹 유창성 스펙이 상승하였습니다.
            </p>

            {/* Rewards Summary */}
            <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-300">획득 스피킹 보상 명세</h4>
              <hr className="border-white/5" />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400 font-medium">획득 경험치 (XP)</span>
                <span className="text-neon-cyan font-bold">+60 XP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">획득 골드 (Gold)</span>
                <span className="text-cyber-yellow font-bold">+45 Gold</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">상승 스탯</span>
                <span className="text-violet-400 font-bold">DEX(유창성) +1, INT(성조) +1</span>
              </div>
            </div>

            <button
              onClick={() => setSessionState('lobby')}
              className="w-full mt-6 py-3 bg-neon-cyan hover:bg-cyan-500 text-dark-bg font-extrabold rounded-xl text-xs shadow-lg shadow-neon-cyan/20 hover:scale-105 active:scale-95 transition-all"
            >
              대화 로비로 돌아가기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
