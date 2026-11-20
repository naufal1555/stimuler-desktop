import React from 'react'
import { AppView } from '../types'
import { 
  MessageSquare, 
  Map, 
  Target, 
  BarChart3, 
  Settings, 
  Volume2,
  Compass
} from 'lucide-react'
import { LottiePlayer } from './LottiePlayer'

interface SidebarProps {
  currentView: AppView
  onSelectView: (view: AppView) => void
  streakCount: number
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  streakCount
}) => {
  const menuItems = [
    { id: 'topics', label: 'Explore Topics', icon: MessageSquare },
    { id: 'roadmap', label: 'Roadmap Courses', icon: Map },
    { id: 'drills', label: 'Pronunciation Drills', icon: Target },
    { id: 'analysis', label: 'Report & History', icon: BarChart3 }
  ] as const

  return (
    <aside className="w-64 bg-white border-r border-[#E8E5F8] flex flex-col justify-between p-4 select-none shrink-0">
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-4 border-b border-[#F0EDFC]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5A45FF] to-[#8C7DFF] flex items-center justify-center text-white shadow-md shadow-[#5A45FF]/20 font-bold text-xl tracking-tighter">
            S
          </div>
          <div>
            <div className="font-bold text-lg leading-tight text-[#1E1B4B]">Stimuler</div>
            <div className="text-xs text-[#6B7280] font-medium">Desktop AI Coach</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#5A45FF] text-white shadow-sm shadow-[#5A45FF]/30 font-semibold'
                    : 'text-[#4B5563] hover:bg-[#F7F6FF] hover:text-[#1E1B4B]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#6B7280]'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Widgets */}
      <div className="space-y-3 pt-4 border-t border-[#F0EDFC]">
        {/* Streak Counter Widget with Extracted Lottie Flame */}
        <div className="bg-gradient-to-r from-[#FFF5EA] to-[#FFEEDB] border border-[#FDE0C5] p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-10 h-10 shrink-0">
            <LottiePlayer src="/assets/lottie/yellow_fire.json" className="w-full h-full" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#8C4A00] uppercase tracking-wider">Daily Streak</div>
            <div className="text-sm font-black text-[#1E1B4B]">{streakCount} Days Active</div>
          </div>
        </div>

        {/* Audio Engine Status */}
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[#6B7280] bg-[#F7F6FF] rounded-xl border border-[#E8E5F8]">
          <span className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#5A45FF]" />
            <span>Sarah Neural Voice</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#3BBE8F]" title="Ready" />
        </div>

        {/* Settings Button */}
        <button
          onClick={() => onSelectView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-[#EFEFFD] text-[#5A45FF]'
              : 'text-[#6B7280] hover:bg-[#F7F6FF] hover:text-[#1E1B4B]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings & AI Engine</span>
        </button>
      </div>
    </aside>
  )
}
