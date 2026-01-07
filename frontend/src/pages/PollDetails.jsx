import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { getPollById, deletePoll } from '../services/PollService.js'
import { createSessionFromPoll } from '../services/SessionService.js'
import { getCurrentUser } from '../services/AuthService.js'

function PollDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [poll, setPoll] = useState(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            navigate('/login')
            return
        }
        setUser(currentUser)
        loadPoll()
    }, [id, navigate])

    const loadPoll = async () => {
        setLoading(true)
        try {
            const data = await getPollById(id)
            setPoll(data)
        } catch (err) {
            console.error('Failed to load poll:', err)
            alert('Failed to load poll')
            navigate('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this poll?')) return
        try {
            await deletePoll(id)
            alert('Poll deleted successfully')
            navigate('/dashboard')
        } catch (err) {
            alert(err.message || 'Failed to delete poll')
        }
    }

    // ... (inside component)

    const handlePublish = async () => {
        try {
            if (!user) return;
            const creatorId = user.id || user.userId; //Handle different user object structures

            //Show loading or disable button here if needed
            const session = await createSessionFromPoll(id, creatorId);

            //Navigate to master view with the generated session code
            navigate(`/master/${session.code}`);
        } catch (err) {
            console.error('Failed to publish poll:', err);
            alert('Failed to start session: ' + err.message);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <main className="max-w-[1200px] mx-auto px-5 py-10">
                    <div className="text-center text-on-primary">Loading...</div>
                </main>
            </div>
        )
    }

    if (!poll) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <main className="max-w-[1200px] mx-auto px-5 py-10">
                    <div className="text-center text-on-primary">Poll not found</div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[1200px] mx-auto px-5 py-10">
                <div className="mb-6 flex justify-between items-center">
                    <Link to="/dashboard" className="text-primary hover:underline">← Back to Dashboard</Link>
                </div>

                <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                    <h1 className="text-3xl font-bold text-on-primary mb-4">{poll.title}</h1>
                    {poll.description && (
                        <p className="text-primary-container mb-6">{poll.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-primary/10 rounded-btn">
                        <div>
                            <p className="text-xs text-primary-container mb-1">Status</p>
                            <p className="text-on-primary font-medium">{poll.status}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-container mb-1">Questions</p>
                            <p className="text-on-primary font-medium">{poll.questions?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-primary-container mb-1">Time Limit</p>
                            <p className="text-on-primary font-medium">{poll.timeLimit ? `${poll.timeLimit}s` : 'No limit'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <h2 className="text-xl font-semibold text-on-primary">Questions</h2>
                        {poll.questions?.map((question, idx) => (
                            <div key={question.id || idx} className="bg-primary/5 p-4 rounded-btn">
                                <p className="font-medium text-on-primary mb-3">{idx + 1}. {question.text}</p>
                                <div className="space-y-2 ml-4">
                                    {question.options?.map((option, optIdx) => (
                                        <div key={option.id || optIdx} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 ${question.type === 'MULTIPLE_CHOICE' ? 'rounded-md' : 'rounded-full'} border-2 border-primary`}></div>
                                            <span className="text-primary-container">{option.text}</span>
                                            {poll.hasScore && option.value != null && (
                                                <span className="text-xs text-primary ml-2">({option.value} pts)</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 flex-wrap justify-end">
                        <button
                            onClick={handlePublish}
                            className="py-3 px-6 bg-primary text-on-primary rounded-btn font-medium hover:bg-[#527d91] transition-all">
                            Start Session
                        </button>
                        <Link
                            to={`/edit-poll/${id}`}
                            className="py-3 px-6 bg-primary-container text-on-primary rounded-btn font-medium hover:bg-primary-container/80 transition-all">
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="py-3 px-6 bg-red-500 text-white rounded-btn font-medium hover:bg-red-600 transition-all">
                            Delete
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default PollDetails
