import React, { useState } from 'react'
import { TopicCategory, Topic } from '../types'
import { Star, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react'

interface TopicCatalogProps {
  categories: TopicCategory[]
  onSelectTopic: (topic: Topic) => void
}

export const TopicCatalog: React.FC<TopicCatalogProps> = ({
  categories,
  onSelectTopic
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)

  const activeCategory = categories[selectedCategoryIndex] || categories[0]

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-8 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5A45FF] to-[#7B69FF] text-white p-8 mb-8 shadow-lg shadow-[#5A45FF]/15">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI English Fluency Practice</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Practice Real Conversations with Sarah
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            Speak naturally for 60 seconds, receive instant IELTS Band scores, and get native-level feedback on grammar and pronunciation.
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none flex items-center justify-center opacity-20">
          <div className="w-96 h-96 rounded-full border-[32px] border-white/20 transform translate-x-1/3" />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat, idx) => {
          const isSelected = selectedCategoryIndex === idx
          return (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryIndex(idx)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#1E1B4B] text-white shadow-sm'
                  : 'bg-white text-[#4B5563] hover:bg-[#EFEFFD] border border-[#E8E5F8]'
              }`}
            >
              <span>{cat.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#F7F6FF] text-[#6B7280]'}`}>
                {cat.topics.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Topic Grid */}
      {activeCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeCategory.topics.map((topic) => {
            const isCompleted = topic.attempt_status === 'completed'
            return (
              <div
                key={topic.topic_id}
                onClick={() => onSelectTopic(topic)}
                className="group bg-white rounded-2xl p-5 border border-[#E8E5F8] hover:border-[#5A45FF]/50 hover:shadow-xl hover:shadow-[#5A45FF]/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#F9A834] bg-[#FFF9E6] px-2.5 py-1 rounded-full border border-[#FFE8A3]">
                      <Star className="w-3.5 h-3.5 fill-[#F9A834]" />
                      <span>{topic.max_stars_achieved ?? 0}/{topic.total_stars} Stars</span>
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[#3BBE8F]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-md">
                        {topic.attempt_counter > 1 ? `Attempt #${topic.attempt_counter}` : 'New'}
                      </span>
                    )}
                  </div>

                  {/* Topic Title */}
                  <h3 className="font-bold text-lg text-[#1E1B4B] group-hover:text-[#5A45FF] transition-colors mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                    Interactive speaking session with Sarah focusing on natural dialogue, vocabulary, and correct intonation.
                  </p>
                </div>

                {/* Card CTA Action */}
                <div className="mt-6 pt-4 border-t border-[#F7F6FF] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5A45FF] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Start Speaking &rarr;
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#F7F6FF] group-hover:bg-[#5A45FF] group-hover:text-white flex items-center justify-center text-[#5A45FF] transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
