import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession, SESSION_STATES } from '../context/SessionContext'
import { getCurrentUser } from '../services/AuthService'

//Vote page for poll participants.
function Vote() {
    const { code } = useParams()
    const navigate = useNavigate()
    const { getSession, submitVotes, calculateRemainingTime, getParticipantResults, currentSession } = useSession()
    const [timeLeft, setTimeLeft] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [participantName, setParticipantName] = useState('')
    const [loading, setLoading] = useState(true)
    const [myResults, setMyResults] = useState(null)
    //Ref prevents the component to re-render when modified
    const answersRef = useRef({})
    const [answers, setAnswers] = useState({})

    //Fetches session when component is mounted.
    useEffect(() => {
        const init = async () => {
            setLoading(true)
            console.log('Vote: init with code:', code, '-> uppercase:', code.toUpperCase())
            await getSession(code.toUpperCase())
            setLoading(false)

            const storageKey = `xpoll_participant_${code.toUpperCase()}`
            console.log('Vote: Looking for storage key:', storageKey)
            //Uses sessionStorage for all users (per-tab isolation)
            const storedName = sessionStorage.getItem(storageKey)
            console.log('Vote: storedName found:', storedName)
            if (storedName) {
                setParticipantName(storedName)

                //Loads submitted state from localStorage
                const submittedKey = `xpoll_submitted_${code.toUpperCase()}_${storedName}`
                const wasSubmitted = localStorage.getItem(submittedKey) === 'true'
                if (wasSubmitted) {
                    setSubmitted(true)
                }
            } else {
                //If no nickname was found, redirect to lobby to join properly
                console.log('Vote: No nickname found, redirecting to lobby')
                navigate(`/lobby/${code.toUpperCase()}`)
                return
            }

            //Loads saved answers from localStorage for page reload.
            const answersKey = `xpoll_answers_${code.toUpperCase()}_${storedName}`
            console.log('Vote: Looking for answers at key:', answersKey)
            const savedAnswers = localStorage.getItem(answersKey)
            console.log('Vote: savedAnswers found:', savedAnswers)

            if (savedAnswers) {
                const parsed = JSON.parse(savedAnswers)
                console.log('Vote: Loaded answers from localStorage:', parsed)
                setAnswers(parsed)
                answersRef.current = parsed
            }
        }
        init()
    }, [code, getSession, navigate])

    const session = currentSession

    //Debug logging for realtime updates
    useEffect(() => {
        console.log('Vote: currentSession updated', currentSession)
    }, [currentSession])

    //Updates timer and auto-submits when timer end.
    useEffect(() => {
        if (session?.state === SESSION_STATES.OPEN && !submitted) {
            const interval = setInterval(() => {
                const remaining = calculateRemainingTime(session)
                setTimeLeft(remaining)

                //Auto-submit when timer ends if has answers.
                if (remaining <= 0 && !submitted && Object.keys(answersRef.current).length > 0) {
                    handleSubmit()
                }
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [session?.state, session?.timerStartedAt, submitted, calculateRemainingTime])

    //Watches for session state changes to auto-submit.
    useEffect(() => {
        if (session?.state === SESSION_STATES.CLOSED && !submitted) {
            if (Object.keys(answersRef.current).length > 0) {
                handleSubmit()
            } else {
                setSubmitted(true)
            }
        }
    }, [session?.state])

    //Fetches results when resultsShown becomes true.
    useEffect(() => {
        const fetchResults = async () => {
            console.log('Vote: Checking for results', { resultsShown: session?.resultsShown, participantName })

            if (session?.resultsShown && participantName) {
                console.log('Vote: Fetching participant results...')
                const results = await getParticipantResults(code.toUpperCase(), participantName)
                console.log('Vote: Got results', results)
                setMyResults(results)
            }
        }
        fetchResults()
    }, [session?.resultsShown, code, participantName, getParticipantResults])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    //Handles answer selection with toggle to deselect.
    const handleSelectAnswer = (questionId, optionIndex, questionType) => {
        if (!submitted && session?.state === SESSION_STATES.OPEN) {
            let newAnswers = { ...answersRef.current }

            if (questionType === 'MULTIPLE_CHOICE') {
                // For multiple choice, use an array
                const currentSelections = Array.isArray(newAnswers[questionId]) ? newAnswers[questionId] : []

                if (currentSelections.includes(optionIndex)) {
                    // Remove if already selected
                    const updated = currentSelections.filter(idx => idx !== optionIndex)
                    if (updated.length === 0) {
                        delete newAnswers[questionId]
                    } else {
                        newAnswers[questionId] = updated
                    }
                } else {
                    // Add to selections
                    newAnswers[questionId] = [...currentSelections, optionIndex]
                }
            } else {
                // For single choice, use a single value
                if (newAnswers[questionId] === optionIndex) {
                    delete newAnswers[questionId]
                } else {
                    newAnswers[questionId] = optionIndex
                }
            }

            answersRef.current = newAnswers
            setAnswers(newAnswers)
            //Saves answers to localStorage with participant name to prevent conflicts.
            localStorage.setItem(`xpoll_answers_${code.toUpperCase()}_${participantName}`, JSON.stringify(newAnswers))
        }
    }

    //Submits answers with confirmation dialog.
    const handleSubmit = async () => {
        if (!submitted && Object.keys(answersRef.current).length > 0) {
            if (confirm('Are you sure you want to submit your answers?')) {
                setSubmitted(true)
                //Saves submitted state in localStorage for cross-tab sync
                localStorage.setItem(`xpoll_submitted_${code.toUpperCase()}_${participantName}`, 'true')
                await submitVotes(code.toUpperCase(), participantName || 'Anonymous', answersRef.current)
                localStorage.removeItem(`xpoll_answers_${code.toUpperCase()}_${participantName}`)
            }
        }
    }

    const getAnsweredCount = () => Object.keys(answers).length

    //Loading state.
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-primary-container">Loading...</div>
            </div>
        )
    }

    //Session not found state.
    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-on-primary mb-2">Session Not Found</h1>
                    <p className="text-primary-container mb-8">The session no longer exists.</p>
                    <button onClick={() => navigate(getCurrentUser() ? '/dashboard' : '/')}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        {getCurrentUser() ? 'Back to Dashboard' : 'Back to Home'}
                    </button>
                </div>
            </div>
        )
    }

    //Waiting state.
    if (session.state === SESSION_STATES.WAITING) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-on-primary mb-4">Poll not started yet</h1>
                    <p className="text-primary-container mb-8">Wait for the creator to start the poll.</p>
                    <button onClick={() => navigate(`/lobby/${code}`)}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Lobby
                    </button>
                </div>
            </div>
        )
    }

    //Closed state.
    if (session.state === SESSION_STATES.CLOSED) {
        //Creator clicked show results - display personalized results.
        if (session.resultsShown && myResults) {
            return (
                <div className="min-h-screen flex flex-col">
                    { /* Header */}
                    <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                        <span className="text-primary font-bold text-lg">XPoll</span>
                        <span className="text-primary-container text-sm">Your Results</span>
                    </div>

                    { /*Results*/}
                    <div className="flex-1 p-5 max-w-2xl mx-auto w-full">
                        {/* Score header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-on-primary mb-2">{myResults.pollTitle}</h1>
                            <div className="flex justify-center items-center gap-4">
                                <div className="bg-primary/20 rounded-lg p-4">
                                    <p className="text-4xl font-bold text-primary">{myResults.score ?? 0} pts</p>
                                    <p className="text-primary-container text-sm">Your score</p>
                                </div>
                            </div>
                        </div>

                        { /* Questions with corrections */}
                        <div className="space-y-6">
                            {myResults.questions.map((question, qIndex) => (
                                <div key={question.id} className={`bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)] border-l-4 ${question.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${question.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {question.isCorrect ? '✓' : '✗'}
                                        </span>
                                        <h2 className="text-lg font-semibold text-on-primary">
                                            {question.text}
                                        </h2>
                                    </div>

                                    <div className="space-y-2 ml-10">
                                        {question.options.map((option, oIndex) => {
                                            // Use arrays for multiple choice, fallback to single index for backwards compatibility
                                            const selectedIndices = question.selectedIndices || (question.selectedIndex >= 0 ? [question.selectedIndex] : [])
                                            const correctIndices = question.correctIndices || (question.correctAnswerIndex >= 0 ? [question.correctAnswerIndex] : [])
                                            const isSelected = selectedIndices.includes(oIndex)
                                            const isCorrectAnswer = correctIndices.includes(oIndex)
                                            const isMultipleChoice = question.type === 'MULTIPLE_CHOICE'
                                            let bgClass = 'border-primary-container/30'

                                            if (isCorrectAnswer) {
                                                bgClass = 'border-green-500 bg-green-500/10'
                                            } else if (isSelected && !isCorrectAnswer) {
                                                bgClass = 'border-red-500 bg-red-500/10'
                                            }

                                            return (
                                                <div key={option.id || oIndex} className={`p-3 rounded-lg border-2 ${bgClass}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-5 h-5 ${isMultipleChoice ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-primary-container'}`}>
                                                                {isSelected && (
                                                                    isMultipleChoice ? (
                                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) : (
                                                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                                                    )
                                                                )}
                                                            </span>
                                                            <span className="text-on-primary">{option.text}</span>
                                                        </div>
                                                        <div className="flex gap-2"> {isSelected && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                                                Your answer
                                                            </span>
                                                        )} {isCorrectAnswer && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                                                ✓ Correct
                                                            </span>
                                                        )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        { /* Thank you message */}
                        <div className="text-center mt-8 p-6 bg-surface rounded-card">
                            <p className="text-on-primary text-lg font-semibold mb-4">
                                Thanks for participating! 🎉
                            </p>
                            <button
                                onClick={() => navigate(getCurrentUser() ? '/dashboard' : '/')}
                                className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                                {getCurrentUser() ? 'Back to Dashboard' : 'Back to Home'}
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        //Creator exited/session closed shows thank you.
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h1 className="text-3xl font-bold text-on-primary mb-2">Thanks for participating!</h1>
                    <p className="text-primary-container mb-4">
                        You answered {getAnsweredCount()} of {session.questions?.length || 0} questions
                    </p>
                    {!session.exitedWithoutResults && !session.resultsShown && (
                        <>
                            <p className="text-primary-container text-sm">Waiting for the creator to decide...</p>
                            <div className="flex justify-center mt-6">
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </>
                    )} {(session.exitedWithoutResults || session.resultsShown) && (
                        <button
                            onClick={() => navigate(getCurrentUser() ? '/dashboard' : '/')}
                            className="mt-6 py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                            {getCurrentUser() ? 'Back to Dashboard' : 'Back to Home'}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    //Submitted state (while poll is  open), shows thank you page.
    if (submitted && session.state === SESSION_STATES.OPEN) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-on-primary mb-2">Answers Submitted!</h1>
                    <p className="text-primary-container mb-4">
                        You answered {getAnsweredCount()} of {session.questions?.length || 0} questions
                    </p>
                    <p className="text-primary-container text-sm mb-6">
                        Waiting for the poll to end...
                    </p>
                    <div className="flex justify-center">
                        <div className={`px-4 py-2 rounded-full font-mono font-bold ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-on-primary'}`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    //Poll in progress state
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-4">
                    <span className="text-primary font-bold text-lg">XPoll</span>
                    <span className="text-primary-container text-sm">{session.pollTitle}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`text-on-primary text-sm px-3 py-1.5 rounded-full font-medium flex items-center gap-2 ${getCurrentUser() ? 'bg-green-500/30 text-green-100' : 'bg-primary/30'}`}>
                        {getCurrentUser()?.user?.accessMode === 'GOOGLE' || getCurrentUser()?.accessMode === 'GOOGLE' ? (
                            /* Google icon */
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        ) : getCurrentUser() ? (
                            /* Logged in user icon */
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        ) : (
                            /* Guest icon (person) */
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                        {participantName || 'Guest'}
                    </div>
                    <span className="text-primary-container text-sm">
                        {getAnsweredCount()}/{session.questions?.length || 0} answers
                    </span>
                    <div className={`px-4 py-2 rounded-full font-mono font-bold ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-on-primary'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            { /* Questions */}
            <div className="flex-1 p-5 max-w-2xl mx-auto w-full">
                <div className="space-y-6">
                    {session.questions?.map((question, qIndex) => (
                        <div key={question.id} className="bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="bg-primary/20 text-primary text-sm font-bold px-3 py-1 rounded-full">
                                    {qIndex + 1}
                                </span>
                                <h2 className="text-lg font-semibold text-on-primary">
                                    {question.text}
                                </h2>
                            </div>

                            <div className="space-y-2 ml-10">
                                {question.options?.map((option, oIndex) => {
                                    const isSelected = Array.isArray(answers[question.id])
                                        ? answers[question.id].includes(oIndex)
                                        : answers[question.id] === oIndex

                                    return (
                                        <button key={option.id || oIndex} onClick={() => handleSelectAnswer(question.id, oIndex, question.type)} disabled={submitted}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-primary bg-primary/10 text-on-primary' : 'border-primary-container/30 hover:border-primary-container hover:bg-primary-container/5 text-on-primary'} ${submitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`w-5 h-5 ${question.type === 'MULTIPLE_CHOICE' ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-primary-container'}`}>
                                                    {isSelected && (
                                                        question.type === 'MULTIPLE_CHOICE' ? (
                                                            // Checkmark for multiple choice
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            // Dot for single choice
                                                            <span className="w-2 h-2 bg-white rounded-full"></span>
                                                        )
                                                    )}
                                                </span>
                                                <span>{option.text}</span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                { /*Submit button*/}
                <div className="mt-8 text-center">
                    <button onClick={handleSubmit} disabled={getAnsweredCount() === 0} className="py-3 px-8 rounded-btn font-semibold text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                        Submit Answers ({getAnsweredCount()}/{session.questions?.length || 0})
                    </button>
                    <p className="text-primary-container text-sm mt-2">
                        You can submit without answering all questions
                    </p>
                </div>
            </div>
        </div>
    )
}
export default Vote
