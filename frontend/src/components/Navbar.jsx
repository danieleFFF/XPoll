import { Link } from 'react-router-dom'
import UserMenu from './UserMenu'

function Navbar() {
    return (
        <nav className="bg-surface p-5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] sticky top-0 z-[100]">
            <div className="max-w-[1200px] mx-auto flex justify-between items-center">
                <Link to="/dashboard" className="text-2xl font-bold text-primary tracking-wide">
                    XPoll
                </Link>
                <div className="flex items-center gap-3">
                    <UserMenu />
                </div>
            </div>
        </nav>
    )
}

export default Navbar