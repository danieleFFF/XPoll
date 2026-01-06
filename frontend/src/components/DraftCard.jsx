function DraftCard({ title, questions, createdAt, onStart }) {
    return (
        <div className="bg-surface rounded-card p-6 transition-all duration-200 cursor-pointer shadow-[0_4px_6px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
            <h3 className="text-lg font-semibold mb-2 text-on-primary">
                {title}
            </h3>
            <p className="text-sm text-primary-container mb-4">
                {questions} questions • Created on {createdAt}
            </p>
            <div className="flex gap-3">
                <button className="flex-1 py-2.5 px-5 border border-primary-container rounded-btn font-medium text-sm text-primary-container bg-transparent cursor-pointer transition-all duration-200 hover:bg-primary-container/10 hover:-translate-y-0.5">
                    Edit
                </button>
                <button onClick={onStart} className="flex-1 py-2.5 px-5 border-none rounded-btn font-medium text-sm text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                    Start
                </button>
            </div>
        </div>
    )
}

export default DraftCard
