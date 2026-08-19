'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { Sparkles, Mic, Volume2, Check, X, Award, Star, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChineseSpeechRecognition, isSpeechRecognitionSupported, speakChinese, type SpeechRecognitionController } from '@/lib/browser-speech';
import { evaluatePronunciation, type PronunciationCorrection, type PronunciationEvaluation, type PronunciationWordScore } from '@/lib/pronunciation';

interface ScenarioTurn {
  aiText: string;
  aiTrans: string;
  userPrompt: string;
  userPinyin: string;
  userTrans: string;
  keywords: string[];
}

interface Scenario {
  title: string;
  turns: ScenarioTurn[];
}

interface TutorInfo {
  name: string;
  emoji: string;
  image: string;
  personality: string;
  desc: string;
}

interface EvaluationReport extends PronunciationEvaluation {
  transcript: string;
  inputMethod: 'voice' | 'text';
  pronunciationScore?: number;
  fluencyScore?: number;
  precisionAnalysis?: boolean;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  translation?: string;
  pinyin?: string;
  score?: number;
}

export default function AiTutorPage() {
  const { addXP, addGold, recordLearningEvent, rewardPronunciationGrowth } = useApp();
  
  // Game states
  const [sessionState, setSessionState] = useState<'lobby' | 'chatting' | 'summary'>('lobby');
  const [selectedTutor, setSelectedTutor] = useState<string>('lily');
  const [selectedScenario, setSelectedScenario] = useState<string>('restaurant');
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [sessionRewards, setSessionRewards] = useState({ xp: 0, gold: 0 });
  const [isTutorReplyLoading, setIsTutorReplyLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);
  const recognizedTextRef = useRef('');
  const evaluationStartedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const serverAudioPendingRef = useRef(false);

  // Track recording duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const supportCheck = window.setTimeout(() => setSpeechSupported(isSpeechRecognitionSupported()), 0);
    return () => {
      window.clearTimeout(supportCheck);
      evaluationStartedRef.current = true;
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);
  
  // Simulated speech input text they are supposed to read
  const [targetSentence, setTargetSentence] = useState({
    hanzi: '',
    pinyin: '',
    meaning: ''
  });

  const tutors: Record<string, TutorInfo> = {
    lily: { name: '릴리 (현지인 친구)', emoji: '🎧', image: '/tutor_lily.jpg', personality: '상하이 트렌디 피플', desc: '유행어와 자연스러운 구어체 위주의 핑퐁 회화.' },
    wang: { name: '왕 선생님 (친절한 멘토)', emoji: '🎒', image: '/tutor_wang.jpg', personality: '표준어 교육공학가', desc: '초보자 맞춤형 천천히 말하기와 기초 문법 피드백.' },
    lee: { name: '교관 리 (독설형 교관)', emoji: '🦁', image: '/tutor_lee.jpg', personality: '스파르타 스피킹 코치', desc: '성조가 1도 틀려도 칼같이 지적하고 교정을 압박.' }
  };

  const scenarios: Record<string, Scenario> = {
    restaurant: {
      title: '식당에서 훠궈 주문하기',
      turns: [
        {
          aiText: '您好！请问几位？想吃点什么？',
          aiTrans: '안녕하세요! 몇 분이신가요? 무엇을 드시겠어요?',
          userPrompt: '我们两个人，想要一个麻辣火锅。',
          userPinyin: 'Wǒmen liǎng gè rén, xiǎng yào yí gè málà huǒguō.',
          userTrans: '우리 두 명입니다, 마라 훠궈 하나 주세요.',
          keywords: ['我们', '想要', '麻辣', '火锅'],
        },
        {
          aiText: '好的，麻辣火锅。请问需要加些饮料吗？',
          aiTrans: '좋습니다, 마라 훠궈. 음료수도 추가하시겠어요?',
          userPrompt: '我要两杯冰可乐，谢谢。',
          userPinyin: 'Wǒ yào liǎng bēi bīng kělè, xièxie.',
          userTrans: '아이스 콜라 두 잔 주세요, 감사합니다.',
          keywords: ['两杯', '可乐', '谢谢'],
        },
        {
          aiText: '没问题，菜马上就来！请慢用。',
          aiTrans: '문제없습니다, 음식 곧 나옵니다! 맛있게 드세요.',
          userPrompt: '太好了，非常感谢！',
          userPinyin: 'Tài hǎo le, fēicháng gǎnxiè!',
          userTrans: '좋네요, 정말 감사합니다!',
          keywords: ['太好了', '非常', '感谢'],
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
          keywords: ['旅游', '计划', '星期'],
        }
      ]
    }
  };

  const startScenario = () => {
    const selectedScenarioData = scenarios[selectedScenario];
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
    setShowEvaluation(false);
    setEvaluationReport(null);
    setRecognizedText('');
    setManualText('');
    setSpeechError('');
    setSessionRewards({ xp: 0, gold: 0 });
    speakChinese(firstTurn.aiText);
  };

  const analyzeTranscript = (transcript: string, inputMethod: 'voice' | 'text', precision?: { pronunciationScore: number; fluencyScore: number }) => {
    const cleanedTranscript = transcript.trim();
    if (!cleanedTranscript || evaluationStartedRef.current) {
      if (!cleanedTranscript) setSpeechError('인식된 문장이 없습니다. 다시 말하거나 아래 텍스트 연습을 이용해 주세요.');
      return;
    }
    evaluationStartedRef.current = true;
    setIsRecording(false);
    setIsAnalyzing(true);
    setSpeechError('');

    window.setTimeout(() => {
      const activeTurn = scenarios[selectedScenario].turns[turnIndex];
      const transcriptEvaluation = evaluatePronunciation(activeTurn.userPrompt, cleanedTranscript, activeTurn.keywords);
      const evaluation = precision ? { ...transcriptEvaluation, score: Math.round((precision.pronunciationScore + precision.fluencyScore) / 2) } : transcriptEvaluation;
      setEvaluationReport({ ...evaluation, transcript: cleanedTranscript, inputMethod, ...precision, precisionAnalysis: Boolean(precision) });
      setShowEvaluation(true);
      setIsAnalyzing(false);
      setMessages((previous) => [
        ...previous,
        {
          sender: 'user',
          text: cleanedTranscript,
          pinyin: activeTurn.userPinyin,
          translation: activeTurn.userTrans,
          score: evaluation.score,
        },
      ]);

      if (inputMethod === 'voice') {
        const xp = evaluation.score >= 80 ? 20 : 5;
        const gold = evaluation.score >= 80 ? 15 : 0;
        addXP(xp);
        if (gold > 0) addGold(gold);
        if (precision) rewardPronunciationGrowth(precision.pronunciationScore, precision.fluencyScore);
        setSessionRewards((current) => ({ xp: current.xp + xp, gold: current.gold + gold }));
        recordLearningEvent({
          type: 'pronunciation',
          correct: evaluation.score >= 80 ? 1 : 0,
          total: 1,
          xp,
          gold,
          toneScore: evaluation.score,
          weakItems: evaluation.wordScores.filter((item) => item.status === 'bad').map((item) => item.word),
        });
      }
    }, 350);
  };

  const recognitionErrorMessage = (error: string) => {
    if (error === 'not-allowed' || error === 'service-not-allowed') return '마이크 권한이 차단되었습니다. 브라우저 주소창의 마이크 권한을 허용해 주세요.';
    if (error === 'no-speech') return '목소리를 듣지 못했습니다. 마이크 가까이에서 다시 말해 주세요.';
    if (error === 'audio-capture') return '사용 가능한 마이크를 찾지 못했습니다.';
    if (error === 'network') return '브라우저 음성인식 서비스에 연결하지 못했습니다.';
    return '음성인식을 완료하지 못했습니다. 다시 시도해 주세요.';
  };

  const transcribeRecordedAudio = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.set('audio', new File([blob], 'speech.webm', { type: blob.type || 'audio/webm' }));
      form.set('prompt', targetSentence.hanzi);
      const response = await fetch('/api/ai/transcribe', { method: 'POST', body: form });
      if (response.ok) {
        const data = (await response.json()) as { transcript?: string; pronunciationScore?: number; fluencyScore?: number; source?: string };
        if (data.transcript) {
          setRecognizedText(data.transcript);
          const precision = data.source === 'pronunciation-provider' && typeof data.pronunciationScore === 'number' && typeof data.fluencyScore === 'number'
            ? { pronunciationScore: data.pronunciationScore, fluencyScore: data.fluencyScore }
            : undefined;
          analyzeTranscript(data.transcript, 'voice', precision);
          return;
        }
      }
    } catch {
      // Browser speech recognition below remains the no-key/offline fallback.
    }
    analyzeTranscript(recognizedTextRef.current, 'voice');
  };

  const startRecognition = async () => {
    setRecordDuration(0);
    setRecognizedText('');
    setManualText('');
    setSpeechError('');
    recognizedTextRef.current = '';
    evaluationStartedRef.current = false;
    serverAudioPendingRef.current = false;

    const recognition = createChineseSpeechRecognition({
      onUpdate: ({ transcript }) => {
        recognizedTextRef.current = transcript;
        setRecognizedText(transcript);
      },
      onError: (error) => {
        evaluationStartedRef.current = true;
        setSpeechError(recognitionErrorMessage(error));
        setIsRecording(false);
        setIsAnalyzing(false);
      },
      onEnd: () => {
        setIsRecording(false);
        recognitionRef.current = null;
        if (mediaRecorderRef.current?.state === 'recording') {
          serverAudioPendingRef.current = true;
          mediaRecorderRef.current.stop();
        } else if (!evaluationStartedRef.current && !serverAudioPendingRef.current) {
          analyzeTranscript(recognizedTextRef.current, 'voice');
        }
      },
    });

    if (!recognition) {
      setSpeechSupported(false);
      setSpeechError('이 브라우저는 음성인식을 지원하지 않습니다. Chrome 또는 Edge에서 열거나 텍스트 연습을 이용해 주세요.');
      return;
    }

    recognitionRef.current = recognition;
    try {
      if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          recorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
          });
          recorder.addEventListener('stop', () => {
            const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            mediaRecorderRef.current = null;
            mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
            void transcribeRecordedAudio(blob).finally(() => { serverAudioPendingRef.current = false; });
          }, { once: true });
          recorder.start();
        } catch {
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
        }
      }
      recognition.start();
      setIsRecording(true);
    } catch {
      recognitionRef.current = null;
      setSpeechError('음성인식을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const toggleRecognition = () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current?.state === 'recording') {
        serverAudioPendingRef.current = true;
        mediaRecorderRef.current.stop();
      }
      recognitionRef.current?.stop();
      return;
    }
    void startRecognition();
  };

  const evaluateManualText = () => {
    evaluationStartedRef.current = false;
    setRecognizedText(manualText);
    analyzeTranscript(manualText, 'text');
  };

  const advanceConversation = async () => {
    const selectedScenarioData = scenarios[selectedScenario];
    const nextTurnIdx = turnIndex + 1;
    
    if (nextTurnIdx >= selectedScenarioData.turns.length) {
      setSessionState('summary');
    } else {
      setIsTutorReplyLoading(true);
      setTurnIndex(nextTurnIdx);
      const nextTurn = selectedScenarioData.turns[nextTurnIdx];
      let tutorReply = { text: nextTurn.aiText, translation: nextTurn.aiTrans };
      try {
        const response = await fetch('/api/ai/tutor', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            scenario: selectedScenarioData.title,
            tutorName: tutors[selectedTutor].name,
            personality: tutors[selectedTutor].personality,
            userText: evaluationReport?.transcript ?? recognizedText,
            history: messages.map(({ sender, text }) => ({ sender, text })),
          }),
        });
        if (response.ok) {
          const data = (await response.json()) as { reply?: { text?: string; translation?: string } };
          if (data.reply?.text && data.reply.translation) tutorReply = { text: data.reply.text, translation: data.reply.translation };
        }
      } catch {
        // Keep the authored scenario reply when the server is unreachable.
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: tutorReply.text,
          translation: tutorReply.translation
        }
      ]);
      
      setTargetSentence({
        hanzi: nextTurn.userPrompt,
        pinyin: nextTurn.userPinyin,
        meaning: nextTurn.userTrans
      });
      
      setShowEvaluation(false);
      setEvaluationReport(null);
      setRecognizedText('');
      setManualText('');
      setSpeechError('');
      evaluationStartedRef.current = false;
      setIsTutorReplyLoading(false);
      speakChinese(tutorReply.text);
    }
  };

  const endScenario = () => {
    evaluationStartedRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setIsAnalyzing(false);
    setSessionState('lobby');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
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
                실제 중국어 음성인식으로 현지 상황극 문장을 연습하고 인식 정확도를 확인합니다.
              </p>
              {speechSupported === false && <p className="mt-2 text-[10px] text-cyber-yellow">현재 브라우저는 마이크 음성인식을 지원하지 않아 텍스트 연습 모드가 제공됩니다.</p>}
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
                    <div className="relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                      {tutor.image ? (
                        <Image src={tutor.image} alt={tutor.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="text-3xl">{tutor.emoji}</span>
                      )}
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
            {/* Conversation Header & Control Bar */}
            <div className="glass-panel border-white/10 rounded-2xl px-4 py-3 flex justify-between items-center bg-white/2 shadow">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse glow-cyan" />
                <h4 className="text-xs font-bold text-white">원어민 회화 실시간 통화</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(prev => !prev)}
                  className={`text-[10px] border px-2.5 py-1 rounded-lg transition-all ${
                    showHistory 
                      ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan' 
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {showHistory ? '로그 닫기' : '이전 대화 로그'}
                </button>
                <button
                  onClick={endScenario}
                  className="text-[10px] text-gray-400 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-lg transition-all"
                >
                  통화 종료
                </button>
              </div>
            </div>

            {/* Immersive AI Tutor Video Call Screen */}
            <div className="relative w-full aspect-square sm:aspect-auto sm:h-[clamp(420px,58vh,640px)] rounded-3xl overflow-hidden border border-white/10 bg-dark-bg shadow-2xl flex items-center justify-center">
              {/* On wide screens, a soft background fills the sides without enlarging the tutor. */}
              <Image
                src={tutors[selectedTutor].image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover object-center scale-110 blur-xl opacity-35"
              />

              {/* Keep the tutor's full head and body visible on laptops and desktops. */}
              <Image
                src={tutors[selectedTutor].image}
                alt={tutors[selectedTutor].name}
                fill
                preload
                sizes="(max-width: 639px) 100vw, (max-height: 900px) 58vh, 640px"
                className={`object-contain object-center transition-all duration-700 ${
                  isRecording ? 'scale-[1.02] filter brightness-75 blur-[1px]' : 'scale-100'
                }`}
              />
              
              {/* Ambient Overlay Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/95 via-transparent to-black/50" />

              {/* Status Badge: LIVE CALL */}
              <div className="absolute top-3 right-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 px-2.5 py-1 rounded-full text-[9px] font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.15)] flex items-center gap-1 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse glow-cyan" />
                LIVE CALL
              </div>

              {/* Top Left: Tutor Quick Info */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-10">
                <span className="text-base">{tutors[selectedTutor].emoji}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-white">{tutors[selectedTutor].name}</span>
                  <span className="text-[8px] font-bold text-neon-cyan tracking-wider">{tutors[selectedTutor].personality}</span>
                </div>
              </div>

              {/* Center Overlay: Recording / Voice analyzing pulse */}
              {isRecording && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs z-10">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full border border-neon-rose/40 animate-ping opacity-75" />
                    <div className="absolute w-16 h-16 rounded-full border border-neon-rose/60 animate-pulse glow-rose" />
                    <div className="w-12 h-12 rounded-full bg-neon-rose flex items-center justify-center text-white shrink-0 shadow-lg glow-rose z-20">
                      <Mic size={20} className="animate-pulse" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neon-rose tracking-wide mt-3 animate-pulse">중국어 음성 인식 중... [00:{recordDuration < 10 ? '0' : ''}{recordDuration}]</span>
                  <span className="text-[9px] text-gray-400 mt-1">완료하려면 아래 버튼을 눌러주세요</span>
                </div>
              )}

              {/* Center Overlay: Analyzing Loader */}
              {(isAnalyzing || isTutorReplyLoading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                  <RefreshCw size={36} className="text-neon-cyan animate-spin glow-cyan" />
                  <span className="text-xs font-bold text-neon-cyan tracking-wide mt-3 animate-pulse">{isTutorReplyLoading ? 'AI 튜터가 답변을 만드는 중...' : '인식 문장과 목표 문장 비교 중...'}</span>
                </div>
              )}

              {/* Subtitles: What the tutor just said */}
              {!isRecording && !isAnalyzing && !isTutorReplyLoading && (
                <div className="absolute bottom-4 left-4 right-16 flex flex-col gap-1 pr-4 z-10 animate-fade-in">
                  <span className="text-[9px] font-bold text-neon-cyan uppercase tracking-wider">AI 대화 자막</span>
                  <p className="text-sm md:text-base font-extrabold text-white drop-shadow-md leading-normal">
                    {messages[messages.length - 1]?.sender === 'ai' 
                      ? messages[messages.length - 1]?.text 
                      : (messages[messages.length - 2]?.text || '...')
                    }
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-300 font-semibold drop-shadow-md leading-relaxed">
                    {messages[messages.length - 1]?.sender === 'ai' 
                      ? messages[messages.length - 1]?.translation 
                      : (messages[messages.length - 2]?.translation || '')
                    }
                  </p>
                </div>
              )}

              {/* Replay the tutor's latest actual browser-generated speech. */}
              {!isRecording && !isAnalyzing && !isTutorReplyLoading && !showEvaluation && (
                <button type="button" aria-label="튜터 문장 다시 듣기" onClick={() => {
                  const latestTutorMessage = [...messages].reverse().find((message) => message.sender === 'ai');
                  if (latestTutorMessage) speakChinese(latestTutorMessage.text);
                }} className="absolute bottom-4 right-3 z-10 rounded-full border border-white/10 bg-black/60 p-2 text-neon-cyan backdrop-blur-md">
                  <Volume2 size={14} />
                </button>
              )}
            </div>

            {/* Optional Collapsible History Log */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="min-h-[120px] max-h-[200px] bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          msg.sender === 'ai' ? 'self-start items-start' : 'self-end items-end'
                        }`}
                      >
                        <div
                          className={`rounded-xl px-3 py-2 text-xs font-medium leading-relaxed shadow-sm ${
                            msg.sender === 'ai'
                              ? 'bg-white/10 border border-white/10 text-white rounded-tl-sm'
                              : 'bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan rounded-tr-sm'
                          }`}
                        >
                          <div>{msg.text}</div>
                          {msg.pinyin && <div className="text-[9px] text-gray-300/80 font-mono mt-0.5">{msg.pinyin}</div>}
                        </div>
                        {msg.translation && (
                          <span className="text-[8px] text-gray-500 font-medium px-1">
                            {msg.translation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Target Shadowing Guide Panel */}
            <AnimatePresence>
              {!showEvaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-panel border-neon-cyan/20 rounded-2xl p-5 flex flex-col gap-2.5 bg-gradient-to-r from-neon-cyan/5 to-transparent shadow-lg"
                >
                  <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-wider">🎙️ 섀도잉 제시 구절</span>
                  <h2 lang="zh-CN" className="font-hanzi text-xl font-semibold text-white leading-snug tracking-wide">{targetSentence.hanzi}</h2>
                  <p className="text-xs text-gray-400 font-mono font-medium">{targetSentence.pinyin}</p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">뜻: {targetSentence.meaning}</p>
                  <button type="button" onClick={() => speakChinese(targetSentence.hanzi)} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-[10px] font-bold text-gray-300">
                    <Volume2 size={13} /> 원어민 발음 듣기
                  </button>

                  <button
                    type="button"
                    onClick={toggleRecognition}
                    disabled={isAnalyzing}
                    className={`mt-2 py-3.5 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-102 active:scale-98 transition-all w-full ${
                      isRecording 
                        ? 'bg-neon-rose text-white glow-rose animate-pulse hover:bg-rose-500 shadow-neon-rose/20' 
                        : isAnalyzing
                        ? 'bg-white/10 text-gray-500 border border-white/5 cursor-not-allowed'
                        : 'bg-neon-cyan hover:bg-cyan-500 text-dark-bg shadow-neon-cyan/20'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Mic size={16} />
                        <span>말하기 완료 (음성 인식 종료) [00:{recordDuration < 10 ? '0' : ''}{recordDuration}]</span>
                      </>
                    ) : isAnalyzing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>인식 문장 비교 중...</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} />
                        <span>{speechSupported === false ? '마이크 음성인식 미지원' : '중국어 말하기 시작'}</span>
                      </>
                    )}
                  </button>
                  {recognizedText && !isAnalyzing && <p className="rounded-lg bg-white/5 p-2 text-[11px] text-gray-300" role="status">인식 중: {recognizedText}</p>}
                  {speechError && <p className="rounded-lg border border-neon-rose/20 bg-neon-rose/10 p-2 text-[10px] text-neon-rose" role="alert">{speechError}</p>}

                  <div className="mt-1 border-t border-white/10 pt-3">
                    <label className="text-[10px] font-bold text-gray-400">
                      마이크를 사용할 수 없나요? 인식 결과를 직접 입력해 연습할 수 있습니다.
                      <input
                        aria-label="발음 연습 문장 직접 입력"
                        value={manualText}
                        onChange={(event) => setManualText(event.target.value)}
                        placeholder="중국어 문장을 입력하세요"
                        className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white placeholder:text-gray-600"
                      />
                    </label>
                    <button type="button" onClick={evaluateManualText} disabled={!manualText.trim() || isAnalyzing} className="mt-2 w-full rounded-lg border border-white/10 py-2 text-[10px] font-bold text-gray-300 disabled:opacity-40">
                      텍스트로 비교하기 · 보상 없음
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actual speech-recognition comparison report */}
            <AnimatePresence>
              {showEvaluation && evaluationReport && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel border-white/10 rounded-2xl p-4 flex flex-col gap-3 bg-white/2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Star size={14} className="text-cyber-yellow" />
                      {evaluationReport.inputMethod === 'text' ? '타이핑 문장 정확도 리포트' : '음성 인식 문장 일치도 리포트'}
                    </span>
                    <span className={`text-base font-extrabold ${evaluationReport.score >= 80 ? 'text-neon-green' : 'text-neon-rose'}`}>
                      {evaluationReport.score} 점
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-dark-bg/60 p-3 text-[10px]">
                    <p className="text-gray-500">목표 문장</p>
                    <p lang="zh-CN" className="font-hanzi mt-1 font-semibold text-white">{targetSentence.hanzi}</p>
                    <p className="mt-3 text-gray-500">{evaluationReport.inputMethod === 'voice' ? '실제 음성 인식 결과' : '직접 입력한 연습 문장'}</p>
                    <p lang="zh-CN" className="font-hanzi mt-1 font-semibold text-neon-cyan" data-testid="recognized-speech">{evaluationReport.transcript}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full ${evaluationReport.score >= 80 ? 'bg-neon-green' : 'bg-neon-rose'}`} style={{ width: `${evaluationReport.score}%` }} />
                    </div>
                    <p className="mt-1 text-gray-500">
                      정확히 일치 {evaluationReport.matchedCharacters}자 · 수정할 곳 {evaluationReport.corrections.length}개
                    </p>
                  </div>
                  {evaluationReport.corrections.length > 0 && (
                    <div className="rounded-xl border border-neon-rose/20 bg-neon-rose/10 p-3">
                      <p className="text-[10px] font-bold text-neon-rose">틀린 부분</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {evaluationReport.corrections.map((correction: PronunciationCorrection, index: number) => (
                          <span key={`${correction.type}-${index}`} className="rounded-md bg-black/25 px-2 py-1 text-[10px] text-gray-200">
                            {correction.type === 'extra' && <>추가 입력: <strong className="text-neon-rose">{correction.actual}</strong></>}
                            {correction.type === 'missing' && <>빠진 글자: <strong className="text-cyber-yellow">{correction.expected}</strong></>}
                            {correction.type === 'replace' && <>교체: <strong className="text-neon-rose">{correction.actual}</strong> → <strong className="text-neon-green">{correction.expected}</strong></>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {evaluationReport.precisionAnalysis ? <p className="rounded-lg bg-neon-cyan/10 p-2 text-[9px] text-neon-cyan">정밀 분석 · 발음 {evaluationReport.pronunciationScore}점 · 유창성 {evaluationReport.fluencyScore}점 · 통과 시 INT/DEX 성장 반영</p> : <p className="text-[9px] leading-relaxed text-gray-500">이 점수는 음성 인식 엔진이 전사한 문장과 목표 문장의 일치도입니다. 정밀 성조 공급자를 연결하면 음높이와 유창성 평가가 활성화됩니다.</p>}
                  {evaluationReport.inputMethod === 'text' && <p className="rounded-lg bg-cyber-yellow/10 p-2 text-[9px] text-cyber-yellow">텍스트 대체 연습에는 XP와 골드가 지급되지 않습니다.</p>}

                  {/* Word Feedback Summary */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <h5 className="text-[10px] font-bold text-gray-400">핵심 표현 인식 결과</h5>
                    <div className="flex flex-col gap-1 text-[10px]">
                      {evaluationReport.wordScores.map((item: PronunciationWordScore, idx: number) => (
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
              실제 음성 인식 결과를 바탕으로 상황극 스피킹 세션을 완료했습니다.
            </p>

            {/* Rewards Summary */}
            <div className="w-full mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-gray-300">획득 스피킹 보상 명세</h4>
              <hr className="border-white/5" />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400 font-medium">획득 경험치 (XP)</span>
                <span className="text-neon-cyan font-bold">+{sessionRewards.xp} XP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">획득 골드 (Gold)</span>
                <span className="text-cyber-yellow font-bold">+{sessionRewards.gold} Gold</span>
              </div>
            </div>

            <button
              onClick={endScenario}
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
