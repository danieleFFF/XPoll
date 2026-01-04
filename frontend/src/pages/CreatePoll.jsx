import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { createPoll, generatePollFromAI, generateAnswersFromAI } from '../services/PollService.js'
import { getCurrentUser } from '../services/AuthService.js'

function CreatePoll() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Poll metadata
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(20)
    const [hasScore, setHasScore] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [showResults, setShowResults] = useState(true)

    // AI Generation
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGeneratingAll, setIsGeneratingAll] = useState(false)
    const [generatingQuestionId, setGeneratingQuestionId] = useState(null)

    // Questions
    const [questions, setQuestions] = useState([
        {
            id: 1,
            text: '',
            type: 'SINGLE_CHOICE',
            options: [
                { text: '', value: 0 },
                { text: '', value: 0 }
            ],
            correctAnswer: 0
        }
    ])

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: Date.now(),
                text: '',
                type: 'SINGLE_CHOICE',
                options: [
                    { text: '', value: 0 },
                    { text: '', value: 0 }
                ],
                correctAnswer: 0
            }
        ])
    }

    const removeQuestion = (id) => {
        if (questions.length > 1) {
            setQuestions(questions.filter(q => q.id !== id))
        }
    }

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    const addOption = (questionId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, { text: '', value: 0 }]
                }
            }
            return q
        }))
    }

    const removeOption = (questionId, optionIndex) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options.length > 2) {
                const newOptions = q.options.filter((_, idx) => idx !== optionIndex)
                let newCorrectAnswer = q.correctAnswer
                if (optionIndex <= q.correctAnswer && q.correctAnswer > 0) {
                    newCorrectAnswer = q.correctAnswer - 1
                }
                return { ...q, options: newOptions, correctAnswer: newCorrectAnswer }
            }
            return q
        }))
    }

    const updateOption = (questionId, optionIndex, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options]
                newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value }
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    // AI Generation handlers
    const handleGenerateAll = async () => {
        if (!aiPrompt.trim()) return
        setIsGeneratingAll(true)
        setError('')
        try {
            const generatedPoll = await generatePollFromAI(aiPrompt)

            if (generatedPoll.title) setTitle(generatedPoll.title)
            if (generatedPoll.description) setDescription(generatedPoll.description)

            // Map generated questions to our state format
            if (generatedPoll.questions && Array.isArray(generatedPoll.questions)) {
                const mappedQuestions = generatedPoll.questions.map((q, index) => ({
                    id: Date.now() + index,
                    text: q.text,
                    type: q.type || 'SINGLE_CHOICE',
                    correctAnswer: q.correctAnswer || 0,
                    options: q.options ? q.options.map(opt => ({
                        text: opt.text,
                        value: opt.value || 0
                    })) : [{ text: '', value: 0 }, { text: '', value: 0 }]
                }))
                setQuestions(mappedQuestions)
            }
        } catch (err) {
            setError('AI Generation Failed: ' + err.message)
        } finally {
            setIsGeneratingAll(false)
        }
    }

    const handleGenerateAnswers = async (questionId) => {
        const question = questions.find(q => q.id === questionId)
        if (!question?.text.trim()) return

        setGeneratingQuestionId(questionId)
        setError('')
        try {
            const response = await generateAnswersFromAI(question.text)

            // Backend returns { options: [...] }
            if (response && response.options && Array.isArray(response.options)) {
                const mappedOptions = response.options.map(ans => ({
                    text: ans.text,
                    value: ans.value || 0
                }))

                setQuestions(prevQuestions => prevQuestions.map(q => {
                    if (q.id === questionId) {
                        return { ...q, options: mappedOptions }
                    }
                    return q
                }))
            }
        } catch (err) {
            setError('AI Answer Generation Failed: ' + err.message)
        } finally {
            setGeneratingQuestionId(null)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const user = getCurrentUser()
            if (!user) {
                throw new Error('You must be logged in to create a poll')
            }

            // Convert hours:minutes to seconds
            const timeLimit = (hours * 3600) + (minutes * 60)

            const pollData = {
                creatorId: user.id || user.userId,
                title,
                description,
                timeLimit,
                hasScore,
                isAnonymous,
                showResults,
                questions: questions.map((q, qIndex) => ({
                    text: q.text,
                    type: q.type,
                    correctAnswer: q.correctAnswer,
                    orderIndex: qIndex,
                    options: q.options.map((opt, oIndex) => ({
                        text: opt.text,
                        value: hasScore ? opt.value : 0,
                        orderIndex: oIndex
                    }))
                }))
            }

            await createPoll(pollData)
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Failed to create poll')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[900px] mx-auto px-5 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-on-primary">Create New Poll</h1>
                    <Link to="/dashboard" className="text-primary hover:underline">
                        ← Back
                    </Link>
                </div>

                {error && (
                    <div className="bg-danger/20 border border-danger text-danger px-4 py-3 rounded-card mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Poll Metadata Section */}
                    <div className="bg-surface rounded-card p-6 mb-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                        {/* Title */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary text-lg outline-none transition-all duration-200 focus:border-primary text-center mb-4"
                            placeholder="Title of the Quiz"
                            required
                        />

                        {/* Description */}
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary text-center mb-6"
                            placeholder="Descriptions"
                        />

                        {/* Timer Row */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-on-primary font-medium">Timer</span>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={hours}
                                        onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                        min={0}
                                        max={23}
                                        className="w-16 py-2 px-2 rounded bg-primary-container/30 border border-primary-container text-on-primary text-center text-xl font-bold outline-none focus:border-primary"
                                    />
                                    <span className="text-on-primary text-xl font-bold">:</span>
                                    <input
                                        type="number"
                                        value={minutes}
                                        onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                        min={0}
                                        max={59}
                                        className="w-16 py-2 px-2 rounded bg-primary-container/30 border border-primary-container text-on-primary text-center text-xl font-bold outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="flex flex-col text-xs text-primary-container ml-2">
                                    <span>Hour</span>
                                    <span>Minute</span>
                                </div>
                            </div>
                        </div>

                        {/* Points Toggle */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-on-primary font-medium">Points</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasScore}
                                    onChange={(e) => setHasScore(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-primary-container/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Results Toggle */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-on-primary font-medium">Results</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showResults}
                                    onChange={(e) => setShowResults(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-primary-container/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Anonymous Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-on-primary font-medium">Anonymous mode</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-primary-container/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    {/* AI Generation Card */}
                    <div className="bg-surface rounded-card p-6 mb-6 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                        <h2 className="text-lg font-semibold text-primary mb-3">✨ Generate with AI</h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="flex-1 py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary"
                                placeholder="Describe your quiz topic (e.g., 'A quiz about Italian Renaissance art')"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateAll}
                                disabled={!aiPrompt.trim() || isGeneratingAll}
                                className="px-6 py-3 rounded-btn bg-primary text-on-primary font-medium transition-all hover:bg-[#527d91] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingAll ? 'Generating...' : 'Generate All'}
                            </button>
                        </div>
                        <p className="text-xs text-primary-container mt-2">
                            This will generate all questions and answers based on your prompt
                        </p>
                    </div>

                    {/* Questions Section */}
                    <h2 className="text-xl font-semibold text-primary mb-4">Questions</h2>

                    {questions.map((question, qIndex) => (
                        <div key={question.id} className="bg-surface rounded-card p-6 mb-4 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-primary font-semibold">Question {qIndex + 1}</span>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={question.type}
                                        onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                                        className="py-2 px-3 rounded-btn bg-primary-container/10 border border-primary-container text-on-primary text-sm outline-none focus:border-primary"
                                    >
                                        <option value="SINGLE_CHOICE">Single Choice</option>
                                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                    </select>

                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(question.id)}
                                            className="text-danger hover:text-danger/80 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Question Text with Generate Button */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={question.text}
                                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                    className="flex-1 py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary"
                                    placeholder="Write your question..."
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => handleGenerateAnswers(question.id)}
                                    disabled={!question.text.trim() || generatingQuestionId === question.id}
                                    className="px-4 py-2 rounded-btn bg-primary/80 text-on-primary text-sm font-medium transition-all hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    title="Generate answers with AI"
                                >
                                    {generatingQuestionId === question.id ? '...' : '✨ Generate'}
                                </button>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={question.correctAnswer === oIndex}
                                            onChange={() => updateQuestion(question.id, 'correctAnswer', oIndex)}
                                            className="w-4 h-4 accent-primary flex-shrink-0"
                                            title="Mark as correct answer"
                                        />

                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateOption(question.id, oIndex, 'text', e.target.value)}
                                            className="flex-1 py-2 px-3 rounded-btn bg-primary-container/10 border border-primary-container text-on-primary text-sm outline-none transition-all duration-200 focus:border-primary"
                                            placeholder={`Option ${oIndex + 1}`}
                                            required
                                        />

                                        {hasScore && (
                                            <input
                                                type="number"
                                                value={option.value}
                                                onChange={(e) => updateOption(question.id, oIndex, 'value', parseInt(e.target.value) || 0)}
                                                className="w-16 py-2 px-2 rounded-btn bg-primary-container/10 border border-primary-container text-on-primary text-sm outline-none focus:border-primary text-center"
                                                placeholder="Pts"
                                                title="Points"
                                            />
                                        )}

                                        {question.options.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(question.id, oIndex)}
                                                className="text-danger hover:text-danger/80 p-1"
                                                title="Remove option"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => addOption(question.id)}
                                className="mt-3 text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                + Add Option
                            </button>

                            <p className="text-xs text-primary-container mt-3">
                                Select the radio button to indicate the correct answer
                            </p>
                        </div>
                    ))}

                    {/* Add Question Button */}
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full py-3 mb-6 border-2 border-dashed border-primary rounded-card text-primary font-medium transition-all duration-200 hover:bg-primary/10"
                    >
                        + Add Question
                    </button>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-btn font-semibold text-lg text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSubmitting ? 'Creating Poll...' : 'Save Poll'}
                    </button>
                </form>
            </main>
        </div>
    )
}

export default CreatePoll