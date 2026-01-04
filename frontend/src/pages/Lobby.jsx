import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession, SESSION_STATES } from '../context/SessionContext'

//Lobby page for participants when joining  poll
function Lobby() {
    const { code } = useParams()
    const navigate = useNavigate()
    const { getSession, joinSession, currentSession } = useSession()
    const [nickname, setNickname] = useState('')
    const [joined, setJoined] = useState(false)
    const [myParticipantId, setMyParticipantId] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    //Fetches session
    useEffect(() => {
        const fetchSessionData = async () => {
            setLoading(true)
            await getSession(code)
            setLoading(false)
        }
        fetchSessionData()
    }, [code, getSession])

    //Use currentSession for real-time updates
    const session = currentSession

    //Watches for session state changes to redirect.
    useEffect(() => {
        if (joined && session){
            //redirects to Vote page when poll starts.
            if(session.state === SESSION_STATES.OPEN){ navigate(`/vote/${code}`) }
        }
    }, [session?.state, joined, code, navigate])

    //Handles join form submission
    const handleJoin = async (e) => {
        e.preventDefault()
        if (!nickname.trim()) return

        if (!session){
            setError('Session not found. The creator may have closed it.')

            return
        }

        if(session.state !== SESSION_STATES.WAITING) {
            setError('The poll has already started or ended.')

            return
        }

        const result = await joinSession(code, nickname.trim())

        if(result.success){
            setJoined(true)
            setMyParticipantId(result.participant?.id)
            //Saves participant name for Vote page.
            localStorage.setItem(`xpoll_participant_${code}`, nickname.trim())
        }else {
            setError(result.error || 'Error joining the session.')
        }
    }

    //Loading state.
    if (loading){
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-primary-container">Loading session...</div>
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
                    <h1 className="text-2xl font-bold text-on-primary mb-2">Session Not Available</h1>
                    <p className="text-primary-container mb-8">
                        The session doesn't exist or the creator closed it.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Home
                    </button>
                </div>
            </div>
        )
    }

    //Session closed state.
    if (session.state === SESSION_STATES.CLOSED && !joined){
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-on-primary mb-2">Poll Finished</h1>
                    <p className="text-primary-container mb-8">
                        The poll has already ended.
                    </p>
                    <button
                        onClick={() => navigate(`/view/${code}`)}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        View Results
                    </button>
                </div>
            </div>
        )
    }

    //Nickname entry form
    if(!joined) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-primary mb-2">XPoll</h1>
                    <p className="text-primary-container">
                        Code: <span className="font-mono font-bold text-on-primary">{code}</span>
                    </p>
                    <p className="text-primary-container text-sm mt-2">{session.pollTitle}</p>
                </div>

                <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                    <h2 className="text-2xl font-semibold text-center mb-6 text-on-primary">
                        Enter your name
                    </h2>

                    {error && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleJoin}>
                        <input
                            type="text" value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary text-center text-lg outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)] mb-4"
                            placeholder="Your nickname" maxLength={20} autoFocus/>

                        <button
                            type="submit"
                            disabled={!nickname.trim()}
                            className="w-full py-3 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                            Join Session
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    //Waiting room state.
    return(
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-primary mb-2">XPoll</h1>
                <p className="text-primary-container">
                    Code: <span className="font-mono font-bold text-on-primary">{code}</span>
                </p>
            </div>

            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-lg">
                <h2 className="text-2xl font-semibold text-center mb-2 text-on-primary">
                    Waiting for host...
                </h2>
                <p className="text-primary-container text-center text-sm mb-6">
                    The poll will start when the creator launches it
                </p>

                { /*Waiting animation */ }
                <div className="flex justify-center mb-6">
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>

                { /* Participants list */ }
                <div>
                    <h3 className="text-sm font-semibold text-primary-container mb-3">
                        Waiting participants ({session.participants?.length || 0})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {session.participants?.map(p =>(
                            <div key={p.id} className={`rounded-lg py-2 px-3 text-center ${p.id === myParticipantId ? 'bg-primary text-white' : 'bg-primary/20'}`}>
                                <span className={p.id === myParticipantId ? 'text-white' : 'text-on-primary'} >
                                    {p.name} {p.id === myParticipantId && '(you)'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                { /* Exit session button */ }
                <div className="mt-6 pt-6 border-t border-primary-container/20">
                    <button
                        onClick={() => {
                            localStorage.removeItem(`xpoll_participant_${code}`)
                            setJoined(false)
                            navigate('/')
                        }}
                        className="w-full py-3 px-5 rounded-btn font-medium text-danger border border-danger transition-all duration-200 hover:bg-danger/10">
                        Exit Session
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Lobby
