
function Navbar() {
    return (
        <nav className="bg-surface p-5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] sticky top-0 z-[100]">
            <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold text-primary tracking-wide">
                    XPoll
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-semibold cursor-pointer transition-transform duration-200 hover:scale-105">
                        U
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar