import React, { useState, useEffect } from 'react'
import { audioService } from '../services/audioService'

interface IPhone18ProFrameProps {
  children: React.ReactNode
  isRecording?: boolean
}

export const IPhone18ProFrame: React.FC<IPhone18ProFrameProps> = ({
  children,
  isRecording = false
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    const unsubscribe = audioService.subscribePlayback((playing) => {
      setIsSpeaking(playing)
    })
    return () => unsubscribe()
  }, [])
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Device Info Tag */}
      <div className="mb-3.5 flex items-center gap-2 px-3 py-1 bg-white/70 backdrop-blur-md rounded-full border border-[#E2DEF4] shadow-xs text-[11px] font-semibold text-[#4B4869]">
        <span className="w-2 h-2 rounded-full bg-[#3BBE8F]" />
        <span>iPhone 18 Pro Max</span>
        <span className="text-[#8E8AAB]">|</span>
        <span className="text-[#6D6890]">Natural Titanium</span>
        <span className="text-[#8E8AAB]">|</span>
        <span className="text-[#6D6890]">19.5 : 9 OLED</span>
      </div>

      {/* Main iPhone 18 Pro Hardware Chassis */}
      <div className="relative w-[408px] h-[93vh] max-h-[880px] min-h-[720px] rounded-[55px] p-[3.5px] bg-gradient-to-b from-[#3D3C42] via-[#212025] to-[#3D3C42] shadow-[0_25px_70px_-15px_rgba(20,18,35,0.6),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-300">
        
        {/* Left Hardware Buttons (Action Button & Volume Keys) */}
        <div 
          className="absolute top-28 -left-[4.5px] w-[4px] h-8 rounded-l-[3px] bg-gradient-to-r from-[#2B2A30] to-[#484650] shadow-xs cursor-pointer active:translate-x-[1px]" 
          title="Action Button"
        />
        <div 
          className="absolute top-40 -left-[4.5px] w-[4px] h-12 rounded-l-[3px] bg-gradient-to-r from-[#2B2A30] to-[#484650] shadow-xs cursor-pointer active:translate-x-[1px]" 
          title="Volume Up"
        />
        <div 
          className="absolute top-56 -left-[4.5px] w-[4px] h-12 rounded-l-[3px] bg-gradient-to-r from-[#2B2A30] to-[#484650] shadow-xs cursor-pointer active:translate-x-[1px]" 
          title="Volume Down"
        />

        {/* Right Hardware Button (Power / Siri Lock Button) */}
        <div 
          className="absolute top-42 -right-[4.5px] w-[4px] h-16 rounded-r-[3px] bg-gradient-to-l from-[#2B2A30] to-[#484650] shadow-xs cursor-pointer active:-translate-x-[1px]" 
          title="Power / Lock Key"
        />

        {/* Top Micro Speaker Ear-Piece Slit */}
        <div className="w-14 h-[3px] bg-[#121116] rounded-full mx-auto absolute top-[3.5px] left-1/2 -translate-x-1/2 z-50 pointer-events-none" />

        {/* Ultra-Slim 1.2mm Black OLED Matrix Bezel */}
        <div className="w-full h-full rounded-[51px] p-[2.5px] bg-[#0A0A0E] flex flex-col overflow-hidden">
          
          {/* OLED Retina Screen Viewport */}
          <div className="w-full h-full rounded-[47px] overflow-hidden bg-[#F7F6FF] relative flex flex-col select-none">
            
            {/* iOS Status Bar + Dynamic Island Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 h-11 px-7 flex items-center justify-between pointer-events-none select-none">
              
              {/* Left: iOS Digital Clock */}
              <div className="w-16 flex items-center">
                <span className="text-[13px] font-bold text-[#1E1B4B] tracking-tight">9:41</span>
              </div>

              {/* Center: Interactive Dynamic Island Live Activity */}
              <div className={`group pointer-events-auto h-[28px] px-2.5 bg-black rounded-full flex items-center justify-between shadow-md shadow-black/40 transition-all duration-300 ease-out cursor-pointer ${
                isSpeaking ? 'w-[148px] ring-1 ring-[#5A45FF]/40' : isRecording ? 'w-[136px] ring-1 ring-[#F35252]/40' : 'w-[112px] hover:w-[132px]'
              }`}>
                {/* Front Camera Aperture */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#0D1525] ring-1 ring-[#1E293B]/70 flex items-center justify-center relative shrink-0">
                  <div className="w-1 h-1 rounded-full bg-[#182A48]" />
                </div>

                {/* Live Activity State Displays */}
                {isRecording ? (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#F35252]" />
                    <span className="text-[10px] font-bold text-[#F35252] font-mono tracking-wider">REC</span>
                  </div>
                ) : isSpeaking ? (
                  <div className="flex items-center gap-1.5 px-1">
                    <div className="flex items-center gap-[2.5px] h-3">
                      <div className="w-[2px] h-2.5 bg-[#3BBE8F] rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-[2px] h-3.5 bg-[#5A45FF] rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-[2px] h-2 bg-[#3BBE8F] rounded-full animate-bounce [animation-delay:300ms]" />
                      <div className="w-[2px] h-3 bg-[#A599FF] rounded-full animate-bounce [animation-delay:450ms]" />
                    </div>
                    <span className="text-[9px] font-semibold text-white/90">Sarah</span>
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3BBE8F]/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {/* FaceID Sensor Slot */}
                <div className="w-2 h-2 rounded-full bg-[#08080C] shrink-0" />
              </div>

              {/* Right: Cellular, Wi-Fi, and Battery Status Icons */}
              <div className="w-16 flex items-center justify-end gap-1.5 text-[#1E1B4B]">
                {/* Cellular Signal (4 bars) */}
                <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="currentColor">
                  <rect x="0.5" y="9" width="2.5" height="3" rx="0.6" />
                  <rect x="4.5" y="6" width="2.5" height="6" rx="0.6" />
                  <rect x="8.5" y="3" width="2.5" height="9" rx="0.6" />
                  <rect x="12.5" y="0" width="2.5" height="12" rx="0.6" />
                </svg>

                {/* Wi-Fi Icon */}
                <svg className="w-3.5 h-3" viewBox="0 0 16 12" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.2-2.8a6 6 0 0 1 8.4 0 .8.8 0 0 1-.6 1.3.8.8 0 0 1-.6-.2 4.4 4.4 0 0 0-6 0 .8.8 0 0 1-1.2-1.1zm-2.8-2.8a10 10 0 0 1 14 0 .8.8 0 0 1-.6 1.4.8.8 0 0 1-.6-.3 8.4 8.4 0 0 0-11.6 0 .8.8 0 0 1-1.2-1.1z" />
                </svg>

                {/* Battery Icon with 100% Fill */}
                <div className="flex items-center">
                  <div className="w-5 h-2.5 rounded-[3px] border border-[#1E1B4B] p-[1px] flex items-center">
                    <div className="w-full h-full bg-[#3BBE8F] rounded-[1.5px]" />
                  </div>
                  <div className="w-[1.5px] h-1 bg-[#1E1B4B] rounded-r-xs -ml-[0.5px]" />
                </div>
              </div>
            </div>

            {/* Screen Content Viewport (Padded top so Dynamic Island doesn't obscure content) */}
            <div className="flex-1 flex flex-col overflow-hidden pt-10 pb-3 relative">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <div className="w-32 h-[4px] bg-[#1E1B4B]/35 rounded-full backdrop-blur-xs" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
