import React, { useState } from 'react'
import { TopicCategory, Topic } from '../types'
import { Star, MessageCircle, Sparkles, CheckCircle2, Plus, X } from 'lucide-react'

interface TopicCatalogProps {
  categories: TopicCategory[]
  onSelectTopic: (topic: Topic) => void
}

export const TopicCatalog: React.FC<TopicCatalogProps> = ({
  categories,
  onSelectTopic
}) => {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [customRole, setCustomRole] = useState('Job Interviewer')

  const activeCategory = categories[selectedCategoryIndex] || categories[0]

  const handleCreateCustomTopic = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) return

    const customTopic: Topic = {
      topic_id: `custom_${Date.now()}`,
      topic_order: 999,
      title: customTitle.trim(),
      image_url: '',
      image_border_color: '#5A45FF',
      total_stars: 3,
      max_stars_achieved: null,
      attempt_counter: 1,
      attempt_status: 'available',
      open_mode: 'new',
      meta: {
        context: customContext.trim() || `Context: Professional discussion on ${customTitle.trim()}`,
        role: customRole
      }
    }

    setShowCustomModal(false)
    setCustomTitle('')
    setCustomContext('')
    onSelectTopic(customTopic)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden p-3.5 sm:p-8 max-w-6xl mx-auto w-full">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#5A45FF] to-[#7B69FF] text-white p-5 sm:p-8 mb-4 sm:mb-8 shadow-lg shadow-[#5A45FF]/15 shrink-0">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI English Fluency Practice</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-1.5 sm:mb-2 leading-tight">
            Practice Real Conversations with Sarah
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4">
            Speak naturally for 60 seconds, receive instant IELTS Band scores, and get native-level feedback on grammar and pronunciation.
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute right-0 top-0 bottom-0 w-60 sm:w-80 pointer-events-none flex items-center justify-center opacity-20">
          <div className="w-72 sm:w-96 h-72 sm:h-96 rounded-full border-[24px] sm:border-[32px] border-white/20 transform translate-x-1/3" />
        </div>
      </div>

      {/* Category Filter Tabs with Custom Scenario Trigger */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1.5 scrollbar-none shrink-0">
        {categories.map((cat, idx) => {
          const isSelected = selectedCategoryIndex === idx
          return (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategoryIndex(idx)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center gap-1.5 sm:gap-2 ${
                isSelected
                  ? 'bg-[#1E1B4B] text-white shadow-sm'
                  : 'bg-white text-[#4B5563] hover:bg-[#EFEFFD] border border-[#E8E5F8]'
              }`}
            >
              <span>{cat.title}</span>
              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#F7F6FF] text-[#6B7280]'}`}>
                {cat.topics.length}
              </span>
            </button>
          )
        })}

        {/* Custom Scenario Button */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#5A45FF] text-white hover:bg-[#4B36F0] shadow-sm shrink-0 flex items-center gap-1.5 transition-all"
          title="Create your own roleplay scenario"
        >
          <Plus className="w-4 h-4" />
          <span>Custom Scenario</span>
        </button>
      </div>

      {/* Topic Grid */}
      {activeCategory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 pb-6">
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

      {/* Custom Scenario Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E5F8] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F0EDFC]">
              <div>
                <h3 className="font-extrabold text-lg text-[#1E1B4B]">Create Custom Scenario</h3>
                <p className="text-xs text-[#6B7280]">Tailor Sarah's role and conversation context</p>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-xl text-[#6B7280] hover:bg-[#F7F6FF] hover:text-[#1E1B4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-1.5">
                  Scenario Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Software Engineer Interview"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-1.5">
                  Sarah's Persona / Role
                </label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF]"
                >
                  <option value="Job Interviewer">Job Interviewer (Technical / Behavioral)</option>
                  <option value="Colleague / Manager">Colleague / Manager (Workplace Sync)</option>
                  <option value="Debate Partner">Debate Partner (Intellectual Discourse)</option>
                  <option value="Friend">Casual Friend (Everyday English)</option>
                  <option value="Customer / Client">Customer / Client (Business Negotiation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E1B4B] mb-1.5">
                  Context & Focus Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ask me about system design trade-offs, my leadership experience, and evaluate my grammar and conciseness strictly."
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E5F8] text-sm text-[#1E1B4B] focus:outline-none focus:border-[#5A45FF] resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E5F8] text-sm font-semibold text-[#4B5563] hover:bg-[#F7F6FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5A45FF] hover:bg-[#4B36F0] text-white text-sm font-bold shadow-md shadow-[#5A45FF]/20"
                >
                  Start Speaking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
