import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession, SESSION_STATES } from '../context/SessionContext'

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
            await getSession(code)
            setLoading(false)

            const storedName = localStorage.getItem(`xpoll_participant_${code}`)
            if(storedName){
                setParticipantName(storedName)
            }

            //Loads saved answers from localStorage for page reload.
            const savedAnswers = localStorage.getItem(`xpoll_answers_${code}`)

            if (savedAnswers){
                const parsed = JSON.parse(savedAnswers)
                setAnswers(parsed)
                answersRef.current = parsed
            }
        }
        init()
    }, [code, getSession])

    const session = currentSession

    //Debug logging for realtime updates
    useEffect(() => {
        console.log('Vote: currentSession updated', currentSession)
    }, [currentSession])

    //Updates timer and auto-submits when timer end.
    useEffect(() => {
        if(session?.state === SESSION_STATES.OPEN && !submitted){
            const interval = setInterval(() => {
                const remaining = calculateRemainingTime(session)
                setTimeLeft(remaining)

                //Auto-submit when timer ends if has answers.
                if(remaining <= 0 && !submitted && Object.keys(answersRef.current).length > 0) {
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
            }else {
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
                const results = await getParticipantResults(code, participantName)
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
    const handleSelectAnswer = (questionId, optionIndex) => {
        if (!submitted && session?.state === SESSION_STATES.OPEN) {
            let newAnswers

            //Toggle: clicking same answer deselects it.
            if (answersRef.current[questionId] === optionIndex) {
                newAnswers = { ...answersRef.current }
                delete newAnswers[questionId]
            } else {
                newAnswers = { ...answersRef.current, [questionId]: optionIndex}
            }

            answersRef.current = newAnswers
            setAnswers(newAnswers)
            //Saves answers to localStorage.
            localStorage.setItem(`xpoll_answers_${code}`, JSON.stringify(newAnswers))
        }
    }

    //Submits answers with confirmation dialog.
    const handleSubmit = async () => {
        if (!submitted && Object.keys(answersRef.current).length > 0) {
            if (confirm('Are you sure you want to submit your answers?')) {
                setSubmitted(true)
                await submitVotes(code, participantName || 'Anonymous', answersRef.current)
                localStorage.removeItem(`xpoll_answers_${code}`)
            }
        }
    }

    const getAnsweredCount = () => Object.keys(answers).length

    //Loading state.
    if(loading){
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
                    <button onClick={() => navigate('/dashboard')}
                            className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Home
                    </button>
                </div>
            </div>
        )
    }

    //Waiting state.
    if(session.state === SESSION_STATES.WAITING){
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
        if(session.resultsShown && myResults){
            return (
                <div className="min-h-screen flex flex-col">
                    { /* Header */ }
                    <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                        <span className="text-primary font-bold text-lg">XPoll</span>
                        <span className="text-primary-container text-sm">Your Results</span>
                    </div>

                    { /*Results*/ }
                    <div className="flex-1 p-5 max-w-2xl mx-auto w-full">
                        {/* Score header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-on-primary mb-2">{myResults.pollTitle}</h1>
                            <div className="flex justify-center items-center gap-4">
                                <div className="bg-primary/20 rounded-lg p-4">
                                    <p className="text-4xl font-bold text-primary">{myResults.correctCount}/{myResults.totalQuestions}</p>
                                    <p className="text-primary-container text-sm">Correct answers</p>
                                </div>
                            </div>
                        </div>

                        { /* Questions with corrections */ }
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
                                            const isSelected = question.selectedIndex === oIndex
                                            const isCorrectAnswer = question.correctAnswerIndex === oIndex
                                            let bgClass = 'border-primary-container/30'

                                            if(isCorrectAnswer){
                                                bgClass = 'border-green-500 bg-green-500/10'
                                            } else if (isSelected && !isCorrectAnswer) {
                                                bgClass = 'border-red-500 bg-red-500/10'
                                            }

                                            return (
                                                <div key={option.id || oIndex} className={`p-3 rounded-lg border-2 ${bgClass}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-primary-container'}`}>
                                                                {isSelected && <span className="w-2 h-2 bg-white rounded-full"></span>}
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

                        { /* Thank you message */ }
                        <div className="text-center mt-8 p-6 bg-surface rounded-card">
                            <p className="text-on-primary text-lg font-semibold mb-4">
                                Thanks for participating! 🎉
                            </p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                                Back to Dashboard
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
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Dashboard
                    </button>
                )}
                </div>
            </div>
        )
    }

    //Poll in progress state
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                <div>
                    <span className="text-primary font-bold text-lg">XPoll</span>
                    <span className="text-primary-container text-sm ml-4">{session.pollTitle}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-primary-container text-sm">
                        {getAnsweredCount()}/{session.questions?.length || 0} answers
                    </span>
                    <div className={`px-4 py-2 rounded-full font-mono font-bold ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-on-primary'}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            { /* Questions */ }
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
                                {question.options?.map((option, oIndex) => (
                                    <button key={option.id || oIndex} onClick={() => handleSelectAnswer(question.id, oIndex)} disabled={submitted}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${answers[question.id] === oIndex ? 'border-primary bg-primary/10 text-on-primary' : 'border-primary-container/30 hover:border-primary-container hover:bg-primary-container/5 text-on-primary'} ${submitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[question.id] === oIndex ? 'border-primary bg-primary' : 'border-primary-container'}`}>
                                                {answers[question.id] === oIndex && (
                                                    <span className="w-2 h-2 bg-white rounded-full"></span>
                                                )}
                                            </span>
                                            <span>{option.text}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                { /*Submit button*/ }
                <div className="mt-8 text-center">
                    <button onClick={handleSubmit} disabled={getAnsweredCount() === 0} className="py-3 px-8 rounded-btn font-semibold text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
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
