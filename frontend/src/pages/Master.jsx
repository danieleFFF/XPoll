import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useSession, SESSION_STATES } from '../context/SessionContext'

//Default poll data for testing
const defaultPollData = {
    title: 'Marketing Quiz',
    timeLimit: 300,
    questions: [
        {
            id: 1,
            text: 'What is the capital of France?',
            options: ['London', 'Paris', 'Berlin', 'Madrid'],
            correctAnswer: 1
        },
        {
            id: 2,
            text: 'Which language is used for frontend web development?',
            options: ['Python', 'Java', 'JavaScript', 'C++'],
            correctAnswer: 2
        },
        {
            id: 3,
            text: 'In which year was Google founded?',
            options: ['1996', '1998', '2000', '2002'],
            correctAnswer: 1
        },
        {
            id: 4,
            text: 'Who wrote "The Divine Comedy"?',
            options: ['Petrarca', 'Boccaccio', 'Dante Alighieri', 'Manzoni'],
            correctAnswer: 2
        },
        {
            id: 5,
            text: 'Which planet is known as the "Red Planet"?',
            options: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
            correctAnswer: 2
        }
    ]
}

//Master page for poll creators.
function Master() {
    const { code } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const {
        getMySession, createSession, launchPoll, closePoll,
        showResults, exitWithoutResults, deleteSession,
        calculateRemainingTime, currentSession, setCurrentSession
    } = useSession()

    const [showShareModal, setShowShareModal] = useState(false)
    const [copiedPin, setCopiedPin] = useState(false)
    const [copiedLink, setCopiedLink] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)
    const [loading, setLoading] = useState(true)
    const joinUrl = `${window.location.origin}/lobby/${code}`

    //Creates/fetches session when mounted.
    useEffect(() => {
        const initSession = async () => {
            setLoading(true)
            //Tries to get existing session first
            let existingSession = await getMySession(code)

            if(!existingSession){
                //Uses draft data from navigation state if available
                const pollData = location.state?.draft ? {
                    ...defaultPollData,
                    title: location.state.draft.title
                } : defaultPollData

                //Creates new session with poll data.
                existingSession = await createSession(pollData)
            }
            setLoading(false)
        }
        initSession()
    }, [code, getMySession, createSession, location.state])

    const session = currentSession

    //Debug logging for real-time updates
    useEffect(() => {
        console.log('Master: currentSession updated', currentSession)
    }, [currentSession])

    //Updates timer every second.
    useEffect(() => {
        if (session?.state === SESSION_STATES.OPEN) {
            const interval = setInterval(async () => {
                const remaining = calculateRemainingTime(session)
                setTimeLeft(remaining)

                //Auto-closes when timer ends.
                if (remaining <= 0) { await closePoll(session.code) }
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [session?.state, session?.timerStartedAt, calculateRemainingTime, closePoll])

    //Handles page unload to close session.
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (session?.state === SESSION_STATES.WAITING || session?.state === SESSION_STATES.OPEN) {
                deleteSession(session.code)
                e.preventDefault()
                e.returnValue = 'Leaving this page will close the session for all participants.'

                return e.returnValue
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [session?.state, session?.code, deleteSession])

    //Formats time .
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleLaunchPoll = async () => {
        await launchPoll(session.code)
    }

    const handleTerminatePoll = async () => {
        if(confirm('Are you sure you want to end the poll?')){
            await closePoll(session.code)
        }
    }

    const handleShowResults = async () => {
        await showResults(session.code)
    }

    const handleExitWithoutResults = async () => {
        if (confirm('Are you sure? Participants will not see corrections.')) {
            await exitWithoutResults(session.code)
        }
    }

    const handleCloseSession = async () => {
        if(confirm('Are you sure you want to close the session? All participants will be disconnected.')) {
            await deleteSession(session.code)
            navigate('/dashboard')
        }
    }

    const copyPinToClipboard = () => {
        navigator.clipboard.writeText(session.code)
        setCopiedPin(true)
        setTimeout(() => setCopiedPin(false), 2000)
    }

    const copyLinkToClipboard = () => {
        navigator.clipboard.writeText(joinUrl)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    if (loading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-primary-container">Loading session...</div>
            </div>
        )
    }

    const participantCount = session.participants?.length || 0

    return (
        <div className="min-h-screen flex flex-col">
            { /* Share modal/Popup */ }
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
                    <div className="bg-surface rounded-card p-8 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-on-primary text-center mb-6">Share Poll</h2>

                        <div className="flex justify-center mb-6">
                            <div className="bg-white p-4 rounded-lg">
                                <QRCodeSVG value={joinUrl} size={180} />
                            </div>
                        </div>

                        <div className="bg-background rounded-lg p-4 mb-4">
                            <p className="text-primary-container text-sm mb-1">PIN Code</p>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-mono font-bold text-on-primary tracking-wider">{session.code}</span>
                                <button
                                    onClick={copyPinToClipboard}
                                    className="text-primary hover:text-primary/80 text-sm">
                                    {copiedPin ? '✓ Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-background rounded-lg p-4 mb-6">
                            <p className="text-primary-container text-sm mb-1">Direct Link</p>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-on-primary text-sm truncate">{joinUrl}</span>
                                <button
                                    onClick={copyLinkToClipboard}
                                    className="text-primary hover:text-primary/80 text-sm whitespace-nowrap">
                                    {copiedLink ? '✓ Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full py-3 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                            Close
                        </button>
                    </div>
                </div>
            )}

            { /*Header */ }
            <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                <div className="flex items-center gap-4">
                    <span className="text-primary font-bold text-lg">XPoll Master</span>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>
                    <span className={`text-xs px-2 py-1 rounded-full ${session.state === SESSION_STATES.WAITING ? 'bg-yellow-500/20 text-yellow-400' :
                        session.state === SESSION_STATES.OPEN ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {session.state === SESSION_STATES.WAITING ? 'Waiting' : session.state === SESSION_STATES.OPEN ? 'In Progress' : 'Finished'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-primary-container text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {participantCount} participants
                    </span>
                    {session.state === SESSION_STATES.OPEN && (
                        <> <div className={`px-4 py-2 rounded-full font-mono font-bold ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-on-primary'
                            }`}>
                            {formatTime(timeLeft)}
                        </div>
                            <button
                                onClick={handleTerminatePoll}
                                className="bg-red-500 text-white rounded-btn px-4 py-2 hover:bg-red-600 transition-colors text-sm font-medium">
                                End Poll
                            </button>
                        </>
                    )}
                    {session.state === SESSION_STATES.WAITING && (
                        <button
                            onClick={handleCloseSession}
                            className="bg-red-500 text-white rounded-btn px-4 py-2 hover:bg-red-600 transition-colors text-sm font-medium">
                            Close Session
                        </button>
                    )}
                </div>
            </div>

            { /* Main content*/ }
            <div className="flex-1 p-5 max-w-2xl mx-auto w-full">
                { /* waiting state */ }
                {session.state === SESSION_STATES.WAITING && (
                    <div>
                        <div className="text-center py-6 mb-8">
                            <h2 className="text-2xl font-bold text-on-primary mb-4">
                                {session.pollTitle}
                            </h2>
                            <p className="text-primary-container mb-2">
                                Code: <span className="font-mono font-bold text-on-primary text-2xl">{session.code}</span>
                            </p>
                            <p className="text-primary-container mb-8">
                                Share the code or QR code with participants
                            </p>

                            {participantCount > 0 ? (
                                <button
                                    onClick={handleLaunchPoll}
                                    className="py-4 px-8 rounded-btn font-semibold text-lg text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                                    Start Poll ({participantCount} {participantCount === 1 ? 'participant' : 'participants'})
                                </button>
                            ) : (
                                <div className="text-primary-container">
                                    <p className="mb-4">Waiting for participants...</p>
                                    <div className="flex justify-center">
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {participantCount > 0 && (
                            <div className="bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                <h3 className="text-sm font-semibold text-primary-container mb-4">
                                    Waiting participants ({participantCount})
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {session.participants.map(p => (
                                        <div key={p.id} className="bg-primary/20 rounded-lg py-2 px-3 text-center">
                                            <span className="text-on-primary text-sm">{p.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                { /*open state*/ }
                {session.state === SESSION_STATES.OPEN && (
                    <div>
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-bold text-on-primary">{session.pollTitle}</h2>
                            <p className="text-primary-container text-sm">
                                Poll in progress - {participantCount} participants answering
                            </p>
                        </div>

                        <div className="space-y-6">
                            {session.questions.map((question, qIndex) => (
                                <div key={question.id} className="bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="bg-primary/20 text-primary text-sm font-bold px-3 py-1 rounded-full">
                                            {qIndex + 1}
                                        </span>
                                        <h3 className="text-lg font-semibold text-on-primary">
                                            {question.text}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 ml-10">
                                        {question.options.map((option, oIndex) => (
                                            <div key={option.id} //Use option.id
                                                className="p-3 rounded-lg border-2 border-primary-container/30 text-on-primary">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-5 h-5 rounded-full border-2 border-primary-container"></span>
                                                    <span>{option.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                { /* closed state */}
                {session.state === SESSION_STATES.CLOSED && (
                    <div className="py-10">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-on-primary mb-4">
                                Poll Finished!
                            </h2>
                            <p className="text-primary-container mb-6">
                                {participantCount} participants • {session.voteCount || 0} responses submitted
                            </p>

                            { /* Show both options if results haven't been shown yet */}
                            {!session.resultsShown && !session.exitedWithoutResults && (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                    <button onClick={handleShowResults}
                                        className="py-4 px-8 rounded-btn font-semibold text-lg text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                                        Show Results
                                    </button>
                                    <button onClick={handleExitWithoutResults}
                                        className="py-4 px-8 rounded-btn font-semibold text-lg text-on-primary border-2 border-primary-container hover:border-primary transition-all duration-200">
                                        Exit without showing
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Participant Ranking Section */}
                        {session.participants && session.participants.length > 0 && (
                            <div className="mt-8 bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                <h3 className="text-lg font-semibold text-on-primary mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                    Participant Ranking
                                </h3>
                                <div className="space-y-2">
                                    {[...session.participants].sort((a, b) => {
                                        //Sorts by score descending first
                                        const scoreDiff = (b.score || 0) - (a.score || 0)

                                        if (scoreDiff !== 0) return scoreDiff
                                        //Sorts by completion time ascending (faster is better)
                                        const aTime = a.completionTimeSeconds ?? Infinity
                                        const bTime = b.completionTimeSeconds ?? Infinity

                                        return aTime - bTime
                                    }).map((participant, index) => (
                                        <div
                                            key={participant.id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                                index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                                                    index === 2 ? 'bg-amber-700/20 border border-amber-700/30' :
                                                        'bg-primary/10'
                                                }`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-primary/30 text-on-primary'}`}>
                                                    {index + 1}
                                                </span>
                                                { /* Google icon/person icon */}
                                                {participant.isGoogleUser ? (
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-primary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )}
                                                <span className="text-on-primary font-medium">{participant.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Completion time */}
                                                {participant.completionTimeSeconds != null && (
                                                    <span className="text-primary-container text-sm flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {Math.floor(participant.completionTimeSeconds / 60)}:{(participant.completionTimeSeconds % 60).toString().padStart(2, '0')}
                                                    </span>
                                                )}

                                                { /* Score*/}
                                                <span className={`font-bold text-lg ${index === 0 ? 'text-yellow-400' :
                                                    index === 1 ? 'text-gray-300' :
                                                        index === 2 ? 'text-amber-600' :
                                                            'text-primary'
                                                    }`}>
                                                    {participant.score ?? 0} pts
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                    }
                                </div>
                            </div>
                        )}

                        { /* Already showed results/exited */ }
                        {(session.resultsShown || session.exitedWithoutResults) && (
                            <div className="text-center mt-8">
                                <p className="text-primary-container mb-4">
                                    {session.resultsShown ? 'Results have been shown to participants' : 'Session closed without showing results'}
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                                    Back to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
export default Master
