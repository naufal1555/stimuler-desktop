import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { PlayCircle, CheckCircle, Video, MessageSquare, Target, ChevronRight } from 'lucide-react'

export const RoadmapView: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCourses().then((data) => {
      setCourses(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading courses curriculum...
      </div>
    )
  }

  const course = courses[0]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F7F6FF] p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-1.5 sm:mb-2">Fluency Roadmap</h1>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Step-by-step English curriculum: Video lessons, grammar drills, pronunciation challenges, and roleplays.
        </p>
      </div>

      {course?.chapters?.map((chapter: any, chIdx: number) => (
        <div key={chapter.chapter_id} className="mb-6 sm:mb-8 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#E8E5F8] shadow-sm">
          {/* Chapter Header */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F7F6FF]">
            <div>
              <span className="text-xs font-bold text-[#5A45FF] uppercase tracking-wider">
                Chapter {chIdx + 1}
              </span>
              <h2 className="text-xl font-bold text-[#1E1B4B]">{chapter.chapter_title}</h2>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-[#E6F9F2] text-[#1A8B56] rounded-full">
              Free Access Unlocked
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chapter.module_previews?.map((module: any) => (
              <div
                key={module.module_id}
                className="p-4 rounded-2xl border border-[#E8E5F8] bg-[#F7F6FF] hover:bg-white hover:border-[#5A45FF] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E5F8] flex items-center justify-center text-[#5A45FF]">
                      {module.preview_icon?.includes('video') ? (
                        <Video className="w-4 h-4" />
                      ) : module.preview_icon?.includes('roleplay') ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Target className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#6B7280]">Order #{module.order}</span>
                  </div>

                  <h3 className="font-bold text-sm text-[#1E1B4B] mb-1">{module.title}</h3>
                  <div className="text-xs text-[#6B7280]">{module.cta_text || 'Start Module'}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E5F8] flex items-center justify-between text-xs font-semibold text-[#5A45FF]">
                  <span>Begin Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
