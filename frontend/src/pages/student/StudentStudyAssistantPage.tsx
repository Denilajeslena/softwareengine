import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useAccessibility } from '@/context/AccessibilityContext';
import { generateStudyAssistantApi } from '@/services/ai';
import { StudyAssistantResponse } from '@/types';
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Brain,
  HelpCircle,
  Layers,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';

const SAMPLE_STUDY_MATERIALS = [
  {
    title: 'Algorithms: Dynamic Programming & Graphs',
    text: `Dynamic programming solves complex problems by breaking them into overlapping subproblems with optimal substructure. Rather than recomputing solutions recursively, intermediate subproblem solutions are stored in memory (memoization or tabulation). Bellman-Ford and Dijkstra algorithms illustrate shortest-path optimizations on directed weighted graphs. Bellman-Ford permits negative edge weights and detects negative cycles with O(V*E) complexity, while Dijkstra leverages priority queues for non-negative graphs yielding O(E + V log V).`,
  },
  {
    title: 'Operating Systems: Kernel Architecture & Virtual Memory',
    text: `Operating system kernels coordinate memory hierarchies, multi-threading, and hardware interrupts through hardware abstraction. Virtual memory decouples process logical addresses from physical RAM frames via page tables and Translation Lookaside Buffers (TLBs). Page replacement policies like Least Recently Used (LRU) and clock algorithms aim to minimize page faults under high multi-programming degrees, preventing system thrashing while preserving isolation.`,
  },
  {
    title: 'Machine Learning: Generalization & Gradient Descent',
    text: `Supervised learning seeks a mapping function that minimizes empirical risk on unseen test distributions. Optimization relies on gradient descent variants (Stochastic Gradient Descent, Adam) computing partial derivatives with respect to model weights. Regularization techniques such as L2 Ridge weight decay and dropout prevent high-variance over-fitting, balancing the bias-variance tradeoff to secure robust out-of-sample generalization.`,
  },
];

export const StudentStudyAssistantPage: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_STUDY_MATERIALS[0].text);
  const [inputTitle, setInputTitle] = useState(SAMPLE_STUDY_MATERIALS[0].title);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyAssistantResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'quiz' | 'flashcards'>('summary');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  // Flashcards state
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const { speak, stopSpeaking, isSpeaking } = useAccessibility();

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setSelectedAnswers({});
    setRevealedExplanations({});
    setFlippedCards({});

    try {
      const res = await generateStudyAssistantApi(inputText, {
        title: inputTitle,
        mode: 'all',
      });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      console.error('Study assistant generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = (textToRead: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(textToRead);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-5xl mx-auto">
      <PageHeader
        title="BookMind AI Study Assistant"
        subtitle="Transform textbook excerpts, syllabi readings, and course lecture notes into executive summaries, key concept breakdowns, practice exam quizzes, and active recall flashcards."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-forest-100/70 text-forest border border-forest/20 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-gold-dark" />
            BookMind Intelligence Engine
          </span>
        }
      />

      {/* Input Workspace Card */}
      <div className="bg-white rounded-2xl border border-ivory-border p-6 shadow-scholarly space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-cream gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-forest-dark flex items-center gap-2">
              <FileText className="h-4 w-4 text-forest" />
              Academic Notes or Text Excerpt
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Paste textbook paragraphs, research papers, or select a sample disciplinary syllabus
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {SAMPLE_STUDY_MATERIALS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputTitle(sample.title);
                  setInputText(sample.text);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-ivory text-charcoal border border-ivory-border hover:bg-forest hover:text-warm-ivory transition-colors whitespace-nowrap"
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Document / Chapter Topic Title
            </label>
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              placeholder="e.g. Chapter 4: Graph Traversal & Shortest Paths"
              className="w-full px-3 py-2 text-xs rounded-lg border border-ivory-border bg-ivory/30 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Source Material Excerpt ({inputText.split(/\s+/).filter(Boolean).length} words)
            </label>
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste course notes, chapter summary, or scholarly text here..."
              className="w-full p-3 text-xs font-mono rounded-lg border border-ivory-border bg-ivory/30 text-charcoal focus:outline-none focus:ring-2 focus:ring-gold leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-charcoal-muted">
            Respects university copyright restrictions & operates strictly on provided text.
          </span>
          <PrimaryButton
            size="md"
            onClick={handleGenerate}
            disabled={loading || !inputText.trim()}
            leftIcon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
              ) : (
                <Sparkles className="h-4 w-4 text-gold-dark" />
              )
            }
          >
            {loading ? 'Synthesizing Materials...' : 'Generate Study Bundle'}
          </PrimaryButton>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white rounded-2xl border border-ivory-border p-6 shadow-scholarly space-y-6">
          {/* Result Header & Audio Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ivory-cream gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal-muted">
                Synthesized Study Companion
              </span>
              <h3 className="font-serif text-lg font-bold text-forest-dark">{result.title}</h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                {result.wordCount} words • Estimated {result.estimatedReadTimeMinutes} min read
              </p>
            </div>

            <div className="flex items-center gap-2">
              <SecondaryButton
                size="sm"
                onClick={() =>
                  handleReadAloud(
                    `${result.title}. ${result.executiveSummary} Key arguments: ${result.keyArguments.join('. ')}`
                  )
                }
                leftIcon={
                  isSpeaking ? (
                    <VolumeX className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-forest" />
                  )
                }
              >
                {isSpeaking ? 'Stop Audio' : 'Listen with TTS'}
              </SecondaryButton>
            </div>
          </div>

          {/* Study Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-ivory-cream pb-3">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-forest text-warm-ivory'
                  : 'text-charcoal hover:bg-forest-100/50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('concepts')}
              className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'concepts'
                  ? 'bg-forest text-warm-ivory'
                  : 'text-charcoal hover:bg-forest-100/50'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-gold" />
              Key Concepts ({result.concepts.length})
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-forest text-warm-ivory'
                  : 'text-charcoal hover:bg-forest-100/50'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 text-gold" />
              Practice Exam Quiz ({result.quiz.length})
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3 py-1.5 text-xs font-serif font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'flashcards'
                  ? 'bg-forest text-warm-ivory'
                  : 'text-charcoal hover:bg-forest-100/50'
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-gold" />
              Recall Flashcards ({result.flashcards.length})
            </button>
          </div>

          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-ivory/50 border border-ivory-border">
                <span className="text-[10px] uppercase font-bold tracking-wider text-forest-dark block mb-1">
                  Core Abstract & Summary
                </span>
                <p className="text-sm font-serif text-charcoal leading-relaxed">
                  {result.executiveSummary}
                </p>
              </div>

              <div>
                <span className="text-xs font-serif font-bold text-forest-dark block mb-2">
                  Key Thesis & Arguments
                </span>
                <div className="space-y-2">
                  {result.keyArguments.map((arg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-ivory-border bg-white flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-forest shrink-0 mt-0.5" />
                      <span className="text-xs text-charcoal leading-relaxed">{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEY CONCEPTS */}
          {activeTab === 'concepts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.concepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-ivory-border bg-ivory/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-serif font-bold text-sm text-forest-dark">
                        {concept.term}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
                        {concept.importance}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-muted leading-relaxed">
                      {concept.explanation}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReadAloud(`${concept.term}: ${concept.explanation}`)}
                    className="self-start mt-3 text-[11px] font-semibold text-forest hover:text-gold-dark flex items-center gap-1"
                  >
                    <Volume2 className="h-3 w-3" />
                    Read Definition
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PRACTICE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {result.quiz.map((q, qIdx) => {
                const userChoice = selectedAnswers[q.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctAnswerIndex;
                const showExp = revealedExplanations[q.id] || isAnswered;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-ivory-border bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-serif font-bold text-sm text-forest-dark">
                        Question {qIdx + 1}: {q.question}
                      </h4>
                      {isAnswered && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = 'bg-ivory/40 border-ivory-border hover:bg-ivory text-charcoal';
                        if (isAnswered) {
                          if (optIdx === q.correctAnswerIndex) {
                            btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                          } else if (optIdx === userChoice) {
                            btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                            }
                            className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-start gap-2.5 ${btnStyle}`}
                          >
                            <span className="font-mono font-bold text-forest-dark uppercase">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {showExp && (
                      <div className="p-3 rounded-lg bg-forest/5 border border-forest/20 text-xs text-charcoal leading-relaxed">
                        <span className="font-bold text-forest block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.flashcards.map((card) => {
                const isFlipped = flippedCards[card.id] || false;

                return (
                  <div
                    key={card.id}
                    onClick={() =>
                      setFlippedCards((prev) => ({ ...prev, [card.id]: !isFlipped }))
                    }
                    className={`min-h-[170px] p-5 rounded-xl border border-ivory-border cursor-pointer transition-all flex flex-col justify-between shadow-xs select-none ${
                      isFlipped
                        ? 'bg-forest text-warm-ivory border-forest'
                        : 'bg-ivory/50 text-charcoal hover:bg-ivory'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider block opacity-75 mb-2">
                        {isFlipped ? 'Answer & Takeaway (Back)' : 'Concept Prompt (Front)'}
                      </span>
                      <p className="font-serif font-bold text-sm leading-relaxed">
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-current/15 flex items-center justify-between text-[11px] opacity-75">
                      <span className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Click to flip
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

