import React, { useState, useEffect, useRef } from 'react';
import { QuestionModel } from '../models/Question';
import { AnswerModel } from '../models/Answer';
import { QASessionModel } from '../models/QASession';
import { fetchQAs, regenerateQAs } from '../services/qaApi';
import { saveSession, loadSession } from '../services/storage';

const QALearningCards: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [answers, setAnswers] = useState<Map<string, AnswerModel>>(new Map());
  const [session, setSession] = useState<QASessionModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const dataLoadingRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple simultaneous calls
      if (dataLoadingRef.current) return;

      try {
        setLoading(true);
        dataLoadingRef.current = true;
        const qaData = await fetchQAs();
        const questionModels = qaData.map((q) => QuestionModel.fromData(q));
        const answerModels = qaData.map((a) => AnswerModel.fromData(a));
        const answerMap = new Map(answerModels.map((a) => [a.id, a]));
        const questionIds = questionModels.map((q) => q.id);

        setQuestions(questionModels);
        setAnswers(answerMap);

        const savedSession = loadSession();
        if (savedSession && savedSession.questionIds.length === questionIds.length) {
          setSession(
            new QASessionModel(
              savedSession.currentIndex,
              savedSession.revealed,
              savedSession.questionIds
            )
          );
        } else {
          setSession(QASessionModel.create(questionIds));
        }

        dataLoadingRef.current = false;
      } catch (err) {
        setError('Failed to load Q&As. Please check your connection and try again.');
      } finally {
        setLoading(false);
        dataLoadingRef.current = false; // Always reset the loading ref
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  const handleReveal = async () => {
    setIsRevealing(true);
    // Add a small delay for animation
    setTimeout(() => {
      setSession((prev) => {
        if (prev) {
          const newSession = new QASessionModel(prev.currentIndex, prev.revealed, prev.questionIds);
          newSession.reveal();
          return newSession;
        }
        return prev;
      });
      setIsRevealing(false);
    }, 300);
  };

  const handleNext = () => {
    setSession((prev) => {
      if (prev) {
        const newSession = new QASessionModel(prev.currentIndex, prev.revealed, prev.questionIds);
        newSession.next();
        return newSession;
      }
      return prev;
    });
  };

  const handlePrevious = () => {
    setSession((prev) => {
      if (prev) {
        const newSession = new QASessionModel(prev.currentIndex, prev.revealed, prev.questionIds);
        newSession.previous();
        return newSession;
      }
      return prev;
    });
  };

  const handleRestart = () => {
    setSession((prev) => {
      if (prev) {
        const newSession = new QASessionModel(prev.currentIndex, prev.revealed, prev.questionIds);
        newSession.reset();
        return newSession;
      }
      return prev;
    });
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      setError(null);
      await regenerateQAs();
      // Clear local storage and reload the page
      localStorage.removeItem('qa-session');
      // Reset the data loaded flag so new data can be loaded on reload
      window.location.reload();
    } catch (err) {
      setError('Failed to regenerate Q&As. Please try again.');
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Q&A Cards</h2>
          <p className="text-gray-600">Preparing your learning experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Content</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Q&A Content Available</h2>
          <p className="text-gray-600">Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[session.currentIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const progress = ((session.currentIndex + (session.revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Q&A Learning Cards</h1>
              <p className="text-lg text-gray-600">
                Test your knowledge and learn through interactive flashcards
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate a new set of Q&As"
            >
              {isRegenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Regenerate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Question {session.currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className="p-8 md:p-12">
            {/* Question */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer Section */}
            <div className="text-center">
              {!session.revealed ? (
                <button
                  onClick={handleReveal}
                  disabled={isRevealing}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRevealing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Revealing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Reveal Answer
                    </>
                  )}
                </button>
              ) : (
                <div className="animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 md:p-8">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Answer</h3>
                    <p className="text-gray-700 text-lg leading-relaxed mb-6">
                      {currentAnswer?.text}
                    </p>
                    {currentAnswer?.evidence && (
                      <div className="border-t border-green-200 pt-4">
                        <h4 className="text-md font-medium text-green-700 mb-2">Evidence</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {currentAnswer.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={session.currentIndex === 0}
              className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            {session.isComplete() ? (
              <div className="text-center">
                <div className="text-green-600 font-semibold mb-2">🎉 All Questions Completed!</div>
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Start Over
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                disabled={session.currentIndex === questions.length - 1}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QALearningCards;
