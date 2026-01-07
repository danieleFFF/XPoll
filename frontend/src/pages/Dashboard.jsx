import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import DraftCard from '../components/DraftCard.jsx'
import NewPollCard from '../components/NewPollCard.jsx'
import { getCurrentUser, getMyParticipations } from '../services/AuthService.js'
import { getUserPolls } from '../services/PollService.js'

function Dashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [code, setCode] = useState('')
    const [user, setUser] = useState(null)
    const [polls, setPolls] = useState([])
    const [participations, setParticipations] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [loadingPolls, setLoadingPolls] = useState(true)
    const [expandedParticipation, setExpandedParticipation] = useState(null)

    useEffect(() => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            navigate('/login')
            return
        }
        setUser(currentUser)
        loadPolls()
        loadParticipationHistory()

        //Scrolls to history section
        if (location.hash === '#history') {
            setTimeout(() => {
                document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        }
    }, [location, navigate])

    const loadPolls = async () => {
        setLoadingPolls(true)
        try {
            const data = await getUserPolls()
            setPolls(data)
        } catch (err) {
            console.error('Failed to load polls:', err)
        } finally {
            setLoadingPolls(false)
        }
    }

    const loadParticipationHistory = async () => {
        setLoadingHistory(true)
        try {
            const history = await getMyParticipations()
            setParticipations(history)
        } catch (err) {
            console.error('Failed to load participation history:', err)
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleJoin = () => {
        if (code.trim()) { navigate(`/lobby/${code.toUpperCase()}`) }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[1200px] mx-auto px-5 py-10">
                { /* Drafts section */}
                <section className="mb-12">
                    <h2 className="text-[28px] font-semibold mb-6 text-on-primary">
                        Your Polls
                    </h2>
                    {loadingPolls ? (
                        <div className="text-primary-container">Loading polls...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {polls.map(poll => (
                                <DraftCard
                                    key={poll.id}
                                    title={poll.title}
                                    questions={poll.questions ? poll.questions.length : 0}
                                    createdAt={poll.createdAt} // Ensure backend sends createdAt or handle undefined
                                    onStart={() => navigate(`/poll-details/${poll.id}`)}
                                    onEdit={() => navigate(`/edit-poll/${poll.id}`)}
                                />
                            ))}
                            <Link to="/create">
                                <NewPollCard />
                            </Link>
                        </div>
                    )}
                </section>

                { /* Join quiz section */}
                <section className="mt-12">
                    <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] max-w-[600px]">
                        <h3 className="text-2xl font-semibold mb-3 text-on-primary">
                            Join a Poll
                        </h3>
                        <p className="text-base text-primary-container mb-5">
                            Insert code to join live session
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text" value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="flex-1 py-3 px-5 border-2 border-primary-container rounded-btn bg-primary-container/10 text-on-primary font-medium text-base text-center tracking-widest uppercase outline-none transition-all duration-200 placeholder:text-primary-container placeholder:tracking-normal placeholder:normal-case focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                                placeholder="Enter Code" maxLength={6} />
                            <button
                                onClick={handleJoin}
                                className="py-3 px-5 border-none rounded-btn font-medium text-sm text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] sm:w-auto w-full">
                                Join
                            </button>
                        </div>
                    </div>
                </section>

                { /* Participation History section*/}
                {user && (
                    <section id="history" className="mt-12">
                        <div className="mb-6">
                            <h2 className="text-[28px] font-semibold text-on-primary">
                                Participation History
                            </h2>
                        </div>

                        {loadingHistory ? (
                            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                <div className="text-center text-primary-container">Loading history...</div>
                            </div>
                        ) : participations.length > 0 ? (
                            <div className="space-y-3">
                                {participations.map((p, index) => (
                                    <div key={index} className="bg-surface rounded-card shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden">
                                        <button onClick={() => setExpandedParticipation(expandedParticipation === index ? null : index)}
                                            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-primary/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <span className="text-on-primary font-medium">{p.pollTitle || 'Untitled Poll'}</span>
                                            </div>
                                            <svg className={`w-5 h-5 text-primary-container transition-transform ${expandedParticipation === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {expandedParticipation === index && (
                                            <div className="px-4 pb-4 pt-0 border-t border-primary-container/20">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                                    <div>
                                                        <p className="text-xs text-primary-container mb-1">Poll Name</p>
                                                        <p className="text-on-primary">{p.pollTitle || 'Untitled Poll'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-primary-container mb-1">Participation Date</p>
                                                        <p className="text-on-primary">{formatDate(p.participationDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-primary-container mb-1">Total Time</p>
                                                        <p className="text-on-primary font-semibold text-lg">
                                                            <div className="flex flex-col">
                                                                <span>
                                                                    {(() => {
                                                                        const timeToShow = p.hasParticipated && p.completionTimeSeconds ? p.completionTimeSeconds : p.totalTimeSeconds;

                                                                        if (!timeToShow) return 'N/A';

                                                                        const minutes = Math.floor(timeToShow / 60);
                                                                        const seconds = timeToShow % 60;

                                                                        return `${minutes}m ${seconds}s`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                <div className="text-center text-primary-container">
                                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>No participation history yet</p>
                                    <p className="text-sm mt-2">Join a poll to see your history here</p>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    )
}
export default Dashboard

