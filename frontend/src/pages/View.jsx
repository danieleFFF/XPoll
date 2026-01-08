import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

//Displays poll results.
function View() {
    const { code } = useParams()
    const navigate = useNavigate()
    const { getResults, getSession } = useSession()
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [results, setResults] = useState(null)

    //Fetches session and results when component is mounted.
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const sessionData = await getSession(code)
            setSession(sessionData)

            if(sessionData){
                const resultsData = await getResults(code)
                setResults(resultsData)
            }
            setLoading(false)
        }
        fetchData()
    }, [code, getSession, getResults])

    if(loading){
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-primary-container">Loading results...</div>
            </div>
        )
    }

    if (!session || !results){
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-on-primary mb-4">Results Not Available</h1>
                    <p className="text-primary-container mb-8">The session doesn't exist or hasn't finished yet.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Home
                    </button>
                </div>
            </div>
        )
    }

    //only shows results if presenter has shared them
    if(!session.resultsShown) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-on-primary mb-4">Results Not Shared Yet</h1>
                    <p className="text-primary-container mb-8">The presenter has not shared the results yet.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91]">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const getMaxVotes = (options) => Math.max(...options.map(opt => opt.votes), 1)

    return (
        <div className="min-h-screen flex flex-col">
            { /* header */ }
            <div className="bg-surface p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
                <span className="text-primary font-bold text-lg">XPoll</span>
                <span className="text-primary-container text-sm">Final Results</span>
            </div>

            {/* Results */}
            <div className="flex-1 p-5 max-w-2xl mx-auto w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-on-primary mb-2">{results.pollTitle}</h1>
                    <p className="text-primary-container">
                        {results.totalParticipants} participants • {results.questions.length} questions
                    </p>
                </div>

                <div className="space-y-6">
                    {results.questions.map((question, qIndex) => {
                        const maxVotes = getMaxVotes(question.options)
                        const totalVotes = question.options.reduce((sum, opt) => sum + opt.votes, 0)

                        return (
                            <div key={question.id} className="bg-surface rounded-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                                <div className="flex items-start gap-3 mb-4">
                                    <span className="bg-primary/20 text-primary text-sm font-bold px-3 py-1 rounded-full">
                                        {qIndex + 1}
                                    </span>
                                    <h2 className="text-lg font-semibold text-on-primary">
                                        {question.text}
                                    </h2>
                                </div>

                                <div className="space-y-3 ml-10">
                                    {question.options.map((option, oIndex) => {
                                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
                                        const barWidth = maxVotes > 0 ? (option.votes / maxVotes) * 100 : 0

                                        return (
                                            <div key={oIndex}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-on-primary">{option.text}</span>
                                                        {option.isCorrect && (
                                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                                                                ✓ Correct
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-primary-container text-sm">
                                                        {option.votes} ({percentage}%)
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-background rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${option.isCorrect ? 'bg-green-500' : 'bg-primary'
                                                        }`}
                                                        style={{ width: `${barWidth}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="text-center mt-8 p-6 bg-surface rounded-card">
                    <p className="text-on-primary text-lg font-semibold mb-2">
                        Thanks for participating! 🎉
                    </p>
                    <p className="text-primary-container text-sm">
                        Results have been saved successfully
                    </p>
                </div>

                <div className="flex justify-center gap-4 mt-8">
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
export default View