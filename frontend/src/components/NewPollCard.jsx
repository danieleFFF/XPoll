function NewPollCard() {
    return (
        <div className="group bg-transparent border-2 border-dashed border-primary rounded-card p-6 min-h-[180px] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
            <div className="w-[60px] h-[60px] rounded-full bg-primary flex items-center justify-center text-[32px] font-light mb-3 transition-transform duration-200 group-hover:rotate-90">
                +
            </div>
            <h3 className="text-lg font-semibold text-on-primary">
                Create New Poll
            </h3>
        </div>
    )
}
export default NewPollCard