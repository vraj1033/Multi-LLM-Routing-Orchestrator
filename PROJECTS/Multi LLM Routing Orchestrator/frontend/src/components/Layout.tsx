import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import UpgradeButton from './UpgradeButton'

const Layout = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Upgrade Button - Top Center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <UpgradeButton />
        </div>
        
        <Outlet />
      </main>
    </div>
  )
}

export default Layout




