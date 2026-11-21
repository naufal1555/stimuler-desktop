import React, { useState, useEffect } from 'react'
import { AppView, Topic, TopicCategory, SessionResult, ConversationMessage, TurnAnalysis, UserSettings } from './types'
import { Sidebar } from './components/Sidebar'
import { TopicCatalog } from './components/TopicCatalog'
import { ChatRoom } from './components/ChatRoom'
import { MistakesDrawer } from './components/MistakesDrawer'
import { AnalysisResult } from './components/AnalysisResult'
import { RoadmapView } from './components/RoadmapView'
import { PronunciationDrill } from './components/PronunciationDrill'
import { SettingsModal } from './components/SettingsModal'
import { OnboardingFlow } from './components/OnboardingFlow'
import { IPhone18ProFrame } from './components/IPhone18ProFrame'
import { api } from './services/api'

const DEFAULT_SETTINGS: UserSettings = {
  geminiApiKey: '',
  engineMode: 'hybrid',
  ollamaModel: 'qwen2.5:3b',
  nativeLanguage: 'id',
  dailyGoalMinutes: 10,
  streakCount: 3
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('topics')
  const [categories, setCategories] = useState<TopicCategory[]>([])
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [activeMistakes, setActiveMistakes] = useState<TurnAnalysis | null>(null)
  const [sessionMessages, setSessionMessages] = useState<ConversationMessage[]>([])
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(() => {
    return (localStorage.getItem('stimuler_view_mode') as 'desktop' | 'mobile') || 'desktop'
  })
  
  // First-run user onboarding check
  const [userProfile, setUserProfile] = useState<{ name: string; goal: string; baselineBand: number } | null>(() => {
    try {
      const saved = localStorage.getItem('stimuler_user_profile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Settings in localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('stimuler_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (!parsed.geminiApiKey) {
          parsed.geminiApiKey = DEFAULT_SETTINGS.geminiApiKey
        }
        return parsed
      }
      return DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Load Topics on mount
  useEffect(() => {
    api.getTopics().then((res) => {
      setCategories(res.categories)
      if (res.categories[0]?.topics[0]) {
        setActiveTopic(res.categories[0].topics[0])
      }
    })
  }, [])

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
    localStorage.setItem('stimuler_settings', JSON.stringify(newSettings))
  }

  const handleSelectTopic = (topic: Topic) => {
    setActiveTopic(topic)
    setCurrentView('chat')
  }

  const handleFinishSession = async (messages: ConversationMessage[]) => {
    setSessionMessages(messages)
    try {
      const defaultAnalysis = await api.getDefaultAnalysis()
      setSessionResult(defaultAnalysis)
    } catch (e) {
      console.warn('Analysis fetch failed:', e)
    }
    setCurrentView('analysis')
  }

  const handleCompleteOnboarding = (profile: { name: string; goal: string; baselineBand: number }) => {
    setUserProfile(profile)
    localStorage.setItem('stimuler_user_profile', JSON.stringify(profile))
    setCurrentView('topics')
  }

  const handleToggleViewMode = (mode: 'desktop' | 'mobile') => {
    setViewMode(mode)
    localStorage.setItem('stimuler_view_mode', mode)
  }

  const renderViewContent = () => (
    <>
      {currentView === 'topics' && (
        <TopicCatalog
          categories={categories}
          onSelectTopic={handleSelectTopic}
        />
      )}

      {currentView === 'chat' && activeTopic && (
        <ChatRoom
          topic={activeTopic}
          onBack={() => setCurrentView('topics')}
          onFinishSession={handleFinishSession}
          onOpenMistakes={(analysis) => setActiveMistakes(analysis)}
          onOpenSettings={() => setCurrentView('settings')}
          apiKey={settings.geminiApiKey}
        />
      )}

      {currentView === 'analysis' && sessionResult && (
        <AnalysisResult
          result={sessionResult}
          messages={sessionMessages}
          onBackToTopics={() => setCurrentView('topics')}
          onPracticeDrill={() => setCurrentView('drills')}
        />
      )}

      {currentView === 'roadmap' && <RoadmapView />}

      {currentView === 'drills' && <PronunciationDrill />}

      {currentView === 'settings' && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </>
  )

  // If new user, show Onboarding placement test
  if (!userProfile) {
    return <OnboardingFlow onComplete={handleCompleteOnboarding} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F6FF]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          if (view !== 'chat' || activeTopic) {
            setCurrentView(view)
          }
        }}
        streakCount={settings.streakCount}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
      />

      {/* Main Workspace Area */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-200 ${
        viewMode === 'mobile' ? 'bg-[#EAE7F6] items-center justify-center p-2 sm:p-4 overflow-y-auto' : 'bg-[#F7F6FF]'
      }`}>
        {viewMode === 'mobile' ? (
          <IPhone18ProFrame>
            {renderViewContent()}
          </IPhone18ProFrame>
        ) : (
          renderViewContent()
        )}
      </main>

      {/* Mistakes Slide-over Drawer */}
      {activeMistakes && (
        <MistakesDrawer
          analysis={activeMistakes}
          onClose={() => setActiveMistakes(null)}
        />
      )}
    </div>
  )
}

export default App
