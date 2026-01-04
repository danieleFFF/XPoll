import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import DraftCard from '../components/DraftCard.jsx'
import NewPollCard from '../components/NewPollCard.jsx'

const drafts = [
    { id: 1, title: 'Marketing Poll', questions: 5, createdAt: '15/12/2024' },
    { id: 2, title: 'Team Building Poll', questions: 8, createdAt: '10/12/2024' },
    { id: 3, title: 'Python Knowledge Poll', questions: 12, createdAt: '08/12/2024' }
]

function Dashboard() {
    const navigate = useNavigate()
    const [code, setCode] = useState('')

    const handleJoin = () => {
        if(code.trim()){ navigate(`/lobby/${code.toUpperCase()}`) }
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[1200px] mx-auto px-5 py-10">
                { /* Drafts section */ }
                <section className="mb-12">
                    <h2 className="text-[28px] font-semibold mb-6 text-on-primary">
                        Your Drafts
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {drafts.map(draft => (
                            <DraftCard
                                key={draft.id} title={draft.title} questions={draft.questions}
                                createdAt={draft.createdAt} onStart={() => navigate(`/master/${draft.id}`)}/>
                        ))}
                        <Link to="/create">
                            <NewPollCard />
                        </Link>
                    </div>
                </section>

                { /* Join quiz section */ }
                <section className="mt-12">
                    <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] max-w-[600px]">
                        <h3 className="text-2xl font-semibold mb-3 text-on-primary">
                            Partecipate to a Poll
                        </h3>
                        <p className="text-base text-primary-container mb-5">
                            Insert code to join live session
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text" value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="flex-1 py-3 px-5 border-2 border-primary-container rounded-btn bg-primary-container/10 text-on-primary font-medium text-base text-center tracking-widest uppercase outline-none transition-all duration-200 placeholder:text-on-primary-container/60 placeholder:tracking-normal placeholder:normal-case focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                                placeholder="Inserisci codice" maxLength={6}/>
                            <button
                                onClick={handleJoin}
                                className="py-3 px-5 border-none rounded-btn font-medium text-sm text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] sm:w-auto w-full">
                                Partecipate
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
export default Dashboard
