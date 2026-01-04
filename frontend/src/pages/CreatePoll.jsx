import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

function CreatePoll() {
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [questions, setQuestions] = useState([
        { id: 1, text: '', answers: ['', '', '', ''], correctAnswer: 0 }
    ])

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now(), text: '', answers: ['', '', '', ''], correctAnswer: 0 }
        ])
    }

    const removeQuestion = (id) => {
        if (questions.length > 1){ setQuestions(questions.filter(q => q.id !== id))}
    }

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    const updateAnswer = (questionId, answerIndex, value) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newAnswers = [...q.answers]
                newAnswers[answerIndex] = value

                return { ...q, answers: newAnswers }
            }
            return q
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log({ title, questions })
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[800px] mx-auto px-5 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-on-primary">Create New Poll</h1>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        ← Back
                    </Link>
                </div>

                <form onSubmit={handleSubmit}>
                    { /* poll's title */ }
                    <div className="bg-surface rounded-card p-6 mb-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                        <label className="block text-primary-container text-sm mb-2">Poll's Title</label>
                        <input
                            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary text-lg outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            placeholder="Es. Marketing Poll" required/>
                    </div>

                    {/* questions */}
                    {questions.map((question, qIndex) => (
                        <div key={question.id} className="bg-surface rounded-card p-6 mb-4 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-primary font-semibold">Question {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"  onClick={() => removeQuestion(question.id)}
                                        className="text-danger hover:text-danger/80 text-sm">
                                        Remove
                                    </button>
                                )}
                            </div>

                            <input
                                type="text"
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary mb-4 outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                                placeholder="Write the question..."
                                required
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                { question.answers.map((answer, aIndex) => (
                                    <div key={aIndex} className="flex items-center gap-2">
                                        <input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === aIndex}
                                               onChange={() => updateQuestion(question.id, 'correctAnswer', aIndex)} className="w-4 h-4 accent-primary"/>
                                        <input
                                            type="text" value={answer} onChange={(e) => updateAnswer(question.id, aIndex, e.target.value)}
                                            className="flex-1 py-2 px-3 rounded-btn bg-primary-container/10 border border-primary-container text-on-primary text-sm outline-none transition-all duration-200 focus:border-primary"
                                            placeholder={`Risposta ${aIndex + 1}`} required/>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-primary-container mt-2">
                                Select the dot to indicate the right answer
                            </p>
                        </div>
                    ))}

                    { /* add question button */}
                    <button
                        type="button" onClick={addQuestion}
                        className="w-full py-3 mb-6 border-2 border-dashed border-primary rounded-card text-primary font-medium transition-all duration-200 hover:bg-primary/10">
                        + Add Question
                    </button>

                    { /* submit */ }
                    <button
                        type="submit"
                        className="w-full py-4 rounded-btn font-semibold text-lg text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                        Save Poll
                    </button>
                </form>
            </main>
        </div>
    )
}

export default CreatePoll