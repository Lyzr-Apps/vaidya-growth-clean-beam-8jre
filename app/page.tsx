'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent, extractText } from '@/lib/aiAgent'
import { copyToClipboard } from '@/lib/clipboard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  FiSend,
  FiCopy,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMessageCircle,
  FiX,
  FiMenu,
  FiCheck,
  FiChevronRight,
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiMapPin,
  FiClock,
} from 'react-icons/fi'
import { RiDashboardLine, RiHeart2Line, RiRocketLine } from 'react-icons/ri'
import { HiOutlineUsers } from 'react-icons/hi2'
import { GiHerbsBundle } from 'react-icons/gi'

// ============ CONSTANTS ============

const VAIDYA_HEALER_ID = '699b48d0458d38ce831d29de'
const OUTREACH_GENERATOR_ID = '699b48d0af75b1f63da5ff1d'

const PRODUCT_IMAGE_1 = 'https://asset.lyzr.app/9gDMQX1e'
const PRODUCT_IMAGE_2 = 'https://asset.lyzr.app/XHwtCVA4'

const PARTNER_TYPES = ['Yoga Teacher', 'Gym Trainer', 'Physiotherapist']
const CITIES = ['Ludhiana', 'Delhi', 'Mumbai', 'Indore']
const CHANNELS = ['WhatsApp', 'Email', 'Instagram DM', 'Phone']
const PARTNER_STATUSES = ['New', 'Contacted', 'Interested', 'Onboarded']

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800 border-blue-200',
  Contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  Interested: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Onboarded: 'bg-purple-100 text-purple-800 border-purple-200',
}

// ============ TYPES ============

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  stage?: string
}

interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
}

interface Partner {
  id: string
  name: string
  type: string
  city: string
  channels: string[]
  status: string
  dateAdded: string
}

interface OutreachChannel {
  channel_name: string
  subject_line?: string
  message_body: string
  word_count?: number
}

interface Lead {
  name: string
  professional_type: string
  city: string
  contact_info: string
  verified: boolean
}

interface OutreachResult {
  partner_type: string
  city: string
  leads: Lead[]
  channels: OutreachChannel[]
  personalization_notes: string
}

interface ActivityItem {
  id: string
  type: 'chat' | 'outreach' | 'partner'
  description: string
  timestamp: string
}

// ============ SAMPLE DATA ============

const SAMPLE_CHAT_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: 'Meri kamar mein bahut dard hai, subah se uth nahi pa raha',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    role: 'assistant',
    content: 'Namaste! Main Vaidya hoon, aapka apna Ayurvedic health consultant. Kamar dard bahut takleef deta hai, main samajh sakta hoon. Batayein, yeh dard kab se hai? Kya koi specific jagah hai ya poori kamar mein hai? Aur kya jhukne ya uthne mein zyada takleef hoti hai?',
    timestamp: new Date(Date.now() - 280000).toISOString(),
    stage: 'diagnosis',
  },
  {
    role: 'user',
    content: 'Pichle 3-4 din se hai, lower back mein. Jhukne mein bahut takleef hoti hai.',
    timestamp: new Date(Date.now() - 260000).toISOString(),
  },
  {
    role: 'assistant',
    content: 'Samajh gaya. Lower back pain ke liye main aapko 2-step remedy deta hoon:\n\n**Step 1: Garam Paani ki Sikai** -- Ek towel ko garam paani mein bheego kar, nichod kar lower back pe 10 minute rakhein. Yeh muscles ko relax karega.\n\n**Step 2: Cat-Cow Stretch** -- Haathon aur ghutno ke bal aayein, pehle peeth ko upar karein (cat), phir neeche (cow). Dheere dheere 10 baar karein.\n\nAur agar aap chahein toh ek bahut effective cheez hai -- **SVEDAN Pain Amrut Oil**. Yeh 100% natural Ayurvedic spray hai -- Mahanarayan Oil, Dashmool Oil, Nilgiri aur Pudina se bana hai. Bas spray karein aur halke haathon se massage karein, 15 minute mein relief milega. Chemical-free hai, greasy nahi hai, aur safe hai regular use ke liye.',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    stage: 'remedy',
  },
]

const SAMPLE_OUTREACH_RESULT: OutreachResult = {
  partner_type: 'Yoga Teacher',
  city: 'Delhi',
  leads: [
    { name: 'Yoga House Delhi', professional_type: 'Yoga Teacher', city: 'Delhi', contact_info: '@yogahousedelhi on Instagram | Hauz Khas Village', verified: true },
    { name: 'Priya Yoga Studio', professional_type: 'Yoga Teacher', city: 'Delhi', contact_info: '@priyayogastudio | Lajpat Nagar', verified: true },
    { name: 'ArtOfLiving Yoga Center', professional_type: 'Yoga Teacher', city: 'Delhi', contact_info: 'South Extension, Part 2', verified: false },
    { name: 'Moksha Yoga Shala', professional_type: 'Yoga Teacher', city: 'Delhi', contact_info: '@mokshayogashala | Connaught Place', verified: true },
  ],
  channels: [
    {
      channel_name: 'WhatsApp',
      subject_line: '',
      message_body: 'Namaste! Aapka yoga studio Delhi mein dekha, bahut impressed hue aapke holistic approach se. Hum Shudh Veda Naturals se hain -- humara product SVEDAN Pain Amrut Oil hai jo 100% natural, chemical-free hai aur yoga ke baad muscle recovery mein bahut kaam aata hai. Mahanarayan Oil aur Dashmool Oil se bana hai, spray karo aur massage karo -- 15 min mein relief. Hum Brand Partner model offer karte hain -- 20% commission har sale pe, free samples, aur exclusive city territory. Kya aap interested hain? Hum aapko free samples bhej sakte hain, bas shipping cost lagega! WhatsApp: +918168239200',
      word_count: 95,
    },
    {
      channel_name: 'Email',
      subject_line: 'Brand Partner Opportunity: SVEDAN Pain Amrut Oil x Your Yoga Studio',
      message_body: 'Dear Yoga Teacher,\n\nI hope this message finds you well. I am reaching out from Shudh Veda Naturals, makers of SVEDAN Pain Amrut Oil -- a 100% natural, Ayurvedic, chemical-free pain relief spray.\n\nSVEDAN is crafted with Mahanarayan Oil, Dashmool Oil, Til Oil, Gandhpura, Eucalyptus, and Mentha Piperita. It provides fast relief from muscle and joint pain -- perfect for your yoga students post-practice recovery.\n\nOur Brand Partner Program offers:\n- 20% commission on every sale\n- Free product samples for personal use\n- Exclusive city territory rights\n- Marketing materials provided\n- Monthly bonus for top performers\n\nThe product is cruelty-free, fast-absorbing with no greasy residue, and safe for regular use -- values that align perfectly with the yogic lifestyle.\n\nI would love to send you complimentary samples to try. Contact us: +918168239200 (WhatsApp)\n\nWarm regards,\nShudh Veda Naturals Team, Karnal',
      word_count: 155,
    },
  ],
  personalization_notes: 'Emphasized yoga-Ayurveda synergy. Delhi is a premium market -- highlighted product quality, cruelty-free credentials, and the free sample strategy to lower barrier for first engagement.',
}

const SAMPLE_PARTNERS: Partner[] = [
  { id: '1', name: 'Priya Sharma', type: 'Yoga Teacher', city: 'Delhi', channels: ['WhatsApp', 'Email'], status: 'Interested', dateAdded: '2026-02-18' },
  { id: '2', name: 'Rajesh Patel', type: 'Gym Trainer', city: 'Mumbai', channels: ['Phone'], status: 'Contacted', dateAdded: '2026-02-15' },
  { id: '3', name: 'Dr. Anita Gupta', type: 'Physiotherapist', city: 'Ludhiana', channels: ['Email', 'Phone'], status: 'Onboarded', dateAdded: '2026-02-10' },
  { id: '4', name: 'Vikram Singh', type: 'Yoga Teacher', city: 'Indore', channels: ['Instagram DM'], status: 'New', dateAdded: '2026-02-20' },
  { id: '5', name: 'Meera Joshi', type: 'Gym Trainer', city: 'Delhi', channels: ['WhatsApp', 'Instagram DM'], status: 'Contacted', dateAdded: '2026-02-12' },
]

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: 's1', type: 'chat', description: 'Vaidya responded at diagnosis stage', timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: 's2', type: 'outreach', description: 'Generated outreach for Yoga Teacher in Delhi', timestamp: new Date(Date.now() - 360000).toISOString() },
  { id: 's3', type: 'partner', description: 'Added partner: Priya Sharma', timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 's4', type: 'chat', description: 'Vaidya responded at remedy stage', timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 's5', type: 'partner', description: 'Updated partner: Dr. Anita Gupta', timestamp: new Date(Date.now() - 1200000).toISOString() },
]

// ============ HELPER FUNCTIONS ============

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(ts: string): string {
  try {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ts
  }
}

// ============ ERROR BOUNDARY ============

class InlineErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============ INLINE COMPONENTS ============

function StatCard({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: string | number; sublabel?: string }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1 font-serif">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground mt-1 font-sans">{sublabel}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function ChannelChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-all duration-200 border ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}
    >
      {label}
    </button>
  )
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4 font-sans">{description}</p>
      {action}
    </div>
  )
}

// ============ MAIN PAGE COMPONENT ============

export default function Page() {
  // ---- Navigation ----
  const [activeTab, setActiveTab] = useState<'dashboard' | 'healer' | 'growth' | 'tracker'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ---- Sample data toggle ----
  const [showSample, setShowSample] = useState(false)

  // ---- Chat state ----
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const chatSessionId = useRef('session_' + Date.now())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [showConversations, setShowConversations] = useState(false)

  // ---- Growth Engine state ----
  const [growthForm, setGrowthForm] = useState({
    partnerType: '',
    city: '',
    channels: [] as string[],
    partnerName: '',
  })
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null)
  const [outreachLoading, setOutreachLoading] = useState(false)
  const [outreachError, setOutreachError] = useState('')
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null)

  // ---- Partner Tracker state ----
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerSearch, setPartnerSearch] = useState('')
  const [partnerFilterCity, setPartnerFilterCity] = useState('all')
  const [partnerFilterType, setPartnerFilterType] = useState('all')
  const [partnerFilterStatus, setPartnerFilterStatus] = useState('all')
  const [showAddPartner, setShowAddPartner] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    type: '',
    city: '',
    channels: [] as string[],
    status: 'New',
  })

  // ---- Activity log ----
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // ---- Agent status ----
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ---- Mounted ref for safe state updates ----
  const [mounted, setMounted] = useState(false)

  // ---- LocalStorage sync ----
  useEffect(() => {
    setMounted(true)
    try {
      const storedPartners = localStorage.getItem('vaidya_partners')
      if (storedPartners) setPartners(JSON.parse(storedPartners))
      const storedConversations = localStorage.getItem('vaidya_conversations')
      if (storedConversations) setConversations(JSON.parse(storedConversations))
      const storedActivities = localStorage.getItem('vaidya_activities')
      if (storedActivities) setActivities(JSON.parse(storedActivities))
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('vaidya_partners', JSON.stringify(partners)) } catch {}
    }
  }, [partners, mounted])

  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('vaidya_conversations', JSON.stringify(conversations)) } catch {}
    }
  }, [conversations, mounted])

  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem('vaidya_activities', JSON.stringify(activities)) } catch {}
    }
  }, [activities, mounted])

  // ---- Auto-scroll chat ----
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  // ---- Activity logger ----
  const addActivity = useCallback((type: ActivityItem['type'], description: string) => {
    const item: ActivityItem = {
      id: generateId(),
      type,
      description,
      timestamp: new Date().toISOString(),
    }
    setActivities(prev => [item, ...prev].slice(0, 50))
  }, [])

  // ---- Chat handlers ----
  const handleSendChat = useCallback(async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return

    setChatError('')
    const userMessage: ChatMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)
    setActiveAgentId(VAIDYA_HEALER_ID)

    try {
      const result = await callAIAgent(msg, VAIDYA_HEALER_ID, { session_id: chatSessionId.current })
      if (result.success) {
        const data = result?.response?.result
        let messageText = ''
        if (typeof data === 'object' && data !== null) {
          messageText = data?.message || data?.text || data?.response || ''
        } else if (typeof data === 'string') {
          messageText = data
        }
        if (!messageText) {
          messageText = result?.response?.message || extractText(result.response) || 'I could not process that request.'
        }

        const stage = typeof data === 'object' && data !== null ? (data?.conversation_stage || '') : ''

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: messageText,
          timestamp: new Date().toISOString(),
          stage,
        }
        setChatMessages(prev => [...prev, assistantMessage])
        addActivity('chat', `Vaidya responded at ${stage || 'general'} stage`)
      } else {
        setChatError(result?.error || 'Failed to get a response. Please try again.')
      }
    } catch {
      setChatError('Network error. Please check your connection and try again.')
    } finally {
      setChatLoading(false)
      setActiveAgentId(null)
    }
  }, [chatInput, chatLoading, addActivity])

  const handleNewConversation = useCallback(() => {
    if (chatMessages.length > 0) {
      const conv: ChatConversation = {
        id: generateId(),
        title: chatMessages[0]?.content?.slice(0, 40) || 'Conversation',
        messages: chatMessages,
        createdAt: new Date().toISOString(),
      }
      setConversations(prev => [conv, ...prev])
    }
    setChatMessages([])
    setChatError('')
    chatSessionId.current = 'session_' + Date.now()
  }, [chatMessages])

  const handleLoadConversation = useCallback((conv: ChatConversation) => {
    if (chatMessages.length > 0) {
      const currentConv: ChatConversation = {
        id: activeConversationId || generateId(),
        title: chatMessages[0]?.content?.slice(0, 40) || 'Conversation',
        messages: chatMessages,
        createdAt: new Date().toISOString(),
      }
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== currentConv.id)
        return [currentConv, ...filtered]
      })
    }
    setChatMessages(conv.messages)
    setActiveConversationId(conv.id)
    setShowConversations(false)
  }, [chatMessages, activeConversationId])

  // ---- Growth Engine handlers ----
  const handleGenerateOutreach = useCallback(async () => {
    const { partnerType, city, channels, partnerName } = growthForm

    if (!partnerType || !city.trim() || channels.length === 0) {
      setOutreachError('Please select a partner type, city, and at least one channel.')
      return
    }

    setOutreachError('')
    setOutreachResult(null)
    setOutreachLoading(true)
    setActiveAgentId(OUTREACH_GENERATOR_ID)

    const prompt = `Find real ${partnerType}s in ${city.trim()} via web search. Provide a lead table with their names, business names, Instagram handles, and contact info. Then generate outreach messages for channels: ${channels.join(', ')}.${partnerName ? ' Personalize for partner name: ' + partnerName : ''} Include SVEDAN Brand Partner details (20% commission, free samples, exclusive territory). Contact: WhatsApp +918168239200.`

    try {
      const result = await callAIAgent(prompt, OUTREACH_GENERATOR_ID)

      if (result.success) {
        const data = result?.response?.result
        let outreach: OutreachResult | null = null

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const resChannels = Array.isArray(data?.channels) ? data.channels : []
          const resLeads = Array.isArray(data?.leads) ? data.leads : []
          outreach = {
            partner_type: data?.partner_type || partnerType,
            city: data?.city || city.trim(),
            leads: resLeads,
            channels: resChannels,
            personalization_notes: data?.personalization_notes || '',
          }
        }

        if (outreach && (outreach.channels.length > 0 || outreach.leads.length > 0)) {
          setOutreachResult(outreach)
          addActivity('outreach', `Found ${outreach.leads.length} leads and generated outreach for ${partnerType} in ${city.trim()}`)
        } else {
          const fallbackText = result?.response?.message || extractText(result.response) || ''
          if (fallbackText) {
            setOutreachResult({
              partner_type: partnerType,
              city: city.trim(),
              leads: [],
              channels: channels.map(ch => ({
                channel_name: ch,
                message_body: fallbackText,
                word_count: fallbackText.split(/\s+/).length,
              })),
              personalization_notes: '',
            })
            addActivity('outreach', `Generated outreach for ${partnerType} in ${city.trim()}`)
          } else {
            setOutreachError('Could not generate outreach messages. Please try again.')
          }
        }
      } else {
        setOutreachError(result?.error || 'Failed to generate outreach. Please try again.')
      }
    } catch {
      setOutreachError('Network error. Please check your connection and try again.')
    } finally {
      setOutreachLoading(false)
      setActiveAgentId(null)
    }
  }, [growthForm, addActivity])

  const handleCopyMessage = useCallback(async (text: string, channelName: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedChannel(channelName)
      setTimeout(() => setCopiedChannel(null), 2000)
    }
  }, [])

  const toggleChannel = useCallback((channel: string) => {
    setGrowthForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }))
  }, [])

  // ---- Partner tracker handlers ----
  const handleSavePartner = useCallback(() => {
    if (!partnerForm.name || !partnerForm.type || !partnerForm.city) return

    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? {
        ...p,
        name: partnerForm.name,
        type: partnerForm.type,
        city: partnerForm.city,
        channels: partnerForm.channels,
        status: partnerForm.status,
      } : p))
      addActivity('partner', `Updated partner: ${partnerForm.name}`)
    } else {
      const newPartner: Partner = {
        id: generateId(),
        name: partnerForm.name,
        type: partnerForm.type,
        city: partnerForm.city,
        channels: partnerForm.channels,
        status: partnerForm.status,
        dateAdded: new Date().toISOString().split('T')[0] || '',
      }
      setPartners(prev => [newPartner, ...prev])
      addActivity('partner', `Added partner: ${partnerForm.name}`)
    }

    setPartnerForm({ name: '', type: '', city: '', channels: [], status: 'New' })
    setEditingPartner(null)
    setShowAddPartner(false)
  }, [partnerForm, editingPartner, addActivity])

  const handleEditPartner = useCallback((partner: Partner) => {
    setEditingPartner(partner)
    setPartnerForm({
      name: partner.name,
      type: partner.type,
      city: partner.city,
      channels: partner.channels,
      status: partner.status,
    })
    setShowAddPartner(true)
  }, [])

  const handleDeletePartner = useCallback((id: string) => {
    const partner = partners.find(p => p.id === id)
    setPartners(prev => prev.filter(p => p.id !== id))
    if (partner) addActivity('partner', `Removed partner: ${partner.name}`)
  }, [partners, addActivity])

  const togglePartnerChannel = useCallback((channel: string) => {
    setPartnerForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }))
  }, [])

  // ---- Derived data ----
  const displayPartners = showSample && partners.length === 0 ? SAMPLE_PARTNERS : partners
  const displayChatMessages = showSample && chatMessages.length === 0 ? SAMPLE_CHAT_MESSAGES : chatMessages
  const displayOutreach = showSample && !outreachResult ? SAMPLE_OUTREACH_RESULT : outreachResult
  const displayActivities = showSample && activities.length === 0 ? SAMPLE_ACTIVITIES : activities

  const filteredPartners = displayPartners.filter(p => {
    const matchesSearch = !partnerSearch || p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.city.toLowerCase().includes(partnerSearch.toLowerCase())
    const matchesCity = partnerFilterCity === 'all' || p.city === partnerFilterCity
    const matchesType = partnerFilterType === 'all' || p.type === partnerFilterType
    const matchesStatus = partnerFilterStatus === 'all' || p.status === partnerFilterStatus
    return matchesSearch && matchesCity && matchesType && matchesStatus
  })

  const uniqueCities = Array.from(new Set(displayPartners.map(p => p.city)))

  const totalConversations = conversations.length + (chatMessages.length > 0 ? 1 : 0) + (showSample ? 3 : 0)
  const onboardedCount = displayPartners.filter(p => p.status === 'Onboarded').length
  const conversionRate = displayPartners.length > 0 ? Math.round((onboardedCount / displayPartners.length) * 100) + '%' : (showSample ? '20%' : '0%')

  // ---- Navigation items ----
  const navItems = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: <RiDashboardLine size={20} /> },
    { key: 'healer' as const, label: 'Vaidya Healer', icon: <RiHeart2Line size={20} /> },
    { key: 'growth' as const, label: 'Growth Engine', icon: <RiRocketLine size={20} /> },
    { key: 'tracker' as const, label: 'Partner Tracker', icon: <HiOutlineUsers size={20} /> },
  ]

  return (
    <InlineErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-serif">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-md hover:bg-secondary transition-colors"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <GiHerbsBundle size={24} className="text-primary" />
            <span className="text-lg font-bold font-serif">SVEDAN AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-toggle-mobile" className="text-xs font-sans text-muted-foreground">Sample</Label>
            <Switch
              id="sample-toggle-mobile"
              checked={showSample}
              onCheckedChange={setShowSample}
            />
          </div>
        </div>

        <div className="flex min-h-screen lg:h-screen">
          {/* Sidebar Overlay (mobile) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GiHerbsBundle size={22} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold font-serif tracking-tight">SVEDAN AI</h1>
                  <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest">Pain Amrut Oil</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-secondary"
                aria-label="Close menu"
              >
                <FiX size={18} />
              </button>
            </div>

            <Separator />

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { setActiveTab(item.key); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-200 ${activeTab === item.key ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-secondary'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <Separator />

            {/* Agent Status */}
            <div className="p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans font-medium">Agent Status</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeAgentId === VAIDYA_HEALER_ID ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="text-xs font-sans text-muted-foreground">Vaidya Healer</span>
                  {activeAgentId === VAIDYA_HEALER_ID && <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 font-sans">Active</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeAgentId === OUTREACH_GENERATOR_ID ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="text-xs font-sans text-muted-foreground">Outreach Generator</span>
                  {activeAgentId === OUTREACH_GENERATOR_ID && <Badge variant="outline" className="text-[9px] py-0 px-1 h-4 font-sans">Active</Badge>}
                </div>
              </div>
            </div>

            {/* Sample Data Toggle (Desktop) */}
            <div className="hidden lg:block p-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="sample-toggle-desktop" className="text-xs font-sans text-muted-foreground">Sample Data</Label>
                <Switch
                  id="sample-toggle-desktop"
                  checked={showSample}
                  onCheckedChange={setShowSample}
                />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 lg:p-6">

              {/* ============ DASHBOARD ============ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Dashboard</h2>
                    <p className="text-sm text-muted-foreground font-sans mt-1">SVEDAN Pain Amrut Oil -- Pure Herbs. Fast Relief. Trusted Growth.</p>
                  </div>

                  {/* Product Showcase */}
                  <Card className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      <div className="relative h-48 md:h-auto md:col-span-1 bg-gradient-to-br from-[#1a2b4a] to-[#2a3f5f] flex items-center justify-center p-4">
                        <img
                          src={PRODUCT_IMAGE_1}
                          alt="SVEDAN Pain Amrut Oil Product Display"
                          className="w-full h-full object-contain max-h-48 drop-shadow-xl"
                        />
                      </div>
                      <div className="md:col-span-2 p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20 font-sans text-xs">By Shudh Veda Naturals</Badge>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-sans text-xs">100% Natural</Badge>
                        </div>
                        <h3 className="text-xl font-bold font-serif mb-1">SVEDAN Pain Amrut Oil</h3>
                        <p className="text-sm text-muted-foreground font-sans mb-3">Fast relief and long-lasting comfort from muscle, joint, and nerve pain. Crafted with Care and Made at Home.</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {['Mahanarayan Oil', 'Dashmool Oil', 'Til Oil', 'Gandhpura', 'Eucalyptus', 'Pudina'].map(ing => (
                            <span key={ing} className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border">{ing}</span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs font-sans text-muted-foreground">
                          <span className="flex items-center gap-1"><FiCheck size={12} className="text-emerald-600" /> Chemical-Free</span>
                          <span className="flex items-center gap-1"><FiCheck size={12} className="text-emerald-600" /> Cruelty-Free</span>
                          <span className="flex items-center gap-1"><FiCheck size={12} className="text-emerald-600" /> Fast-Absorbing</span>
                          <span className="flex items-center gap-1"><FiCheck size={12} className="text-emerald-600" /> No Greasy Residue</span>
                          <span className="flex items-center gap-1"><FiCheck size={12} className="text-emerald-600" /> Safe for Regular Use</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      icon={<FiMessageCircle size={20} />}
                      label="Conversations"
                      value={totalConversations}
                      sublabel="Total healing chats"
                    />
                    <StatCard
                      icon={<FiTrendingUp size={20} />}
                      label="Conversion Rate"
                      value={conversionRate}
                      sublabel="Partners onboarded"
                    />
                    <StatCard
                      icon={<FiUsers size={20} />}
                      label="Partners"
                      value={displayPartners.length}
                      sublabel="In pipeline"
                    />
                    <StatCard
                      icon={<FiMapPin size={20} />}
                      label="Cities Covered"
                      value={uniqueCities.length || (showSample ? 4 : 0)}
                      sublabel="Active markets"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="transition-all duration-300 hover:shadow-lg cursor-pointer group" onClick={() => setActiveTab('healer')}>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <RiHeart2Line size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold font-serif">Start Healing Chat</h3>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">Engage customers with Ayurvedic remedies and SVEDAN Pain Amrut Oil</p>
                        </div>
                        <FiChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                    <Card className="transition-all duration-300 hover:shadow-lg cursor-pointer group" onClick={() => setActiveTab('growth')}>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <RiRocketLine size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold font-serif">Generate Outreach</h3>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">Find real leads via web search and generate SVEDAN Brand Partner outreach</p>
                        </div>
                        <FiChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
                      <CardDescription className="font-sans">Your latest interactions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {displayActivities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8 font-sans">No activity yet. Start a chat or generate outreach to see activity here.</p>
                      ) : (
                        <div className="space-y-3">
                          {displayActivities.slice(0, 5).map(activity => (
                            <div key={activity.id} className="flex items-start gap-3 py-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'chat' ? 'bg-blue-100 text-blue-700' : activity.type === 'outreach' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {activity.type === 'chat' && <FiMessageCircle size={14} />}
                                {activity.type === 'outreach' && <RiRocketLine size={14} />}
                                {activity.type === 'partner' && <FiUsers size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-sans">{activity.description}</p>
                                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                                  <FiClock size={10} className="inline mr-1" />
                                  {formatTimestamp(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ============ VAIDYA HEALER CHAT ============ */}
              {activeTab === 'healer' && (
                <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)] flex flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <GiHerbsBundle size={20} className="text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-serif">Vaidya Healer</h2>
                        <p className="text-xs text-muted-foreground font-sans">
                          {chatLoading ? 'Preparing remedy...' : 'SVEDAN Ayurvedic Pain Relief Consultant'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConversations(!showConversations)}
                        className="font-sans text-xs"
                      >
                        <FiClock size={14} className="mr-1" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewConversation}
                        className="font-sans text-xs"
                      >
                        <FiPlus size={14} className="mr-1" />
                        New Chat
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                    {/* Conversation History Sidebar */}
                    {showConversations && (
                      <Card className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-3 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-serif">Conversations</CardTitle>
                            <button type="button" onClick={() => setShowConversations(false)} className="p-1 hover:bg-secondary rounded" aria-label="Close conversations">
                              <FiX size={14} />
                            </button>
                          </div>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                          <div className="px-3 pb-3 space-y-1">
                            {conversations.length === 0 ? (
                              <p className="text-xs text-muted-foreground font-sans py-4 text-center">No saved conversations</p>
                            ) : (
                              conversations.map(conv => (
                                <button
                                  key={conv.id}
                                  type="button"
                                  onClick={() => handleLoadConversation(conv)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-sans hover:bg-secondary transition-colors ${activeConversationId === conv.id ? 'bg-secondary' : ''}`}
                                >
                                  <p className="truncate font-medium">{conv.title}</p>
                                  <p className="text-muted-foreground mt-0.5">{formatDate(conv.createdAt)}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </Card>
                    )}

                    {/* Chat Area */}
                    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                          {displayChatMessages.length === 0 && !chatLoading ? (
                            <EmptyState
                              icon={<GiHerbsBundle size={28} />}
                              title="Welcome to Vaidya Healer"
                              description="Share your pain concerns and receive personalized Ayurvedic guidance. The Vaidya will understand your pain, suggest home remedies, and recommend SVEDAN Pain Amrut Oil for fast natural relief."
                              action={
                                <div className="space-y-3">
                                  <div className="flex justify-center">
                                    <img src={PRODUCT_IMAGE_2} alt="SVEDAN Pain Amrut Oil" className="h-24 object-contain rounded-lg shadow-md" />
                                  </div>
                                  <div className="flex flex-wrap gap-2 justify-center">
                                    {['Meri kamar mein dard hai', 'Ghutno mein bahut dard hota hai', 'Neck pain se pareshaan hoon', 'Main ek Yoga Teacher hoon'].map(q => (
                                      <Button
                                        key={q}
                                        variant="outline"
                                        size="sm"
                                        className="font-sans text-xs"
                                        onClick={() => setChatInput(q)}
                                      >
                                        {q}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              }
                            />
                          ) : (
                            displayChatMessages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                  {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                      <GiHerbsBundle size={14} className="text-primary" />
                                    </div>
                                  )}
                                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
                                    {msg.role === 'assistant' ? (
                                      <div className="font-sans text-sm">{renderMarkdown(msg.content)}</div>
                                    ) : (
                                      <p className="font-sans text-sm">{msg.content}</p>
                                    )}
                                    <div className={`flex items-center gap-2 mt-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <span className="text-[10px] opacity-60 font-sans">{formatTimestamp(msg.timestamp)}</span>
                                      {msg.stage && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 font-sans capitalize">
                                          {msg.stage}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}

                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <GiHerbsBundle size={14} className="text-primary" />
                                </div>
                                <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3">
                                  <TypingIndicator />
                                </div>
                              </div>
                            </div>
                          )}

                          {chatError && (
                            <div className="flex justify-center">
                              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm font-sans max-w-md text-center">
                                {chatError}
                              </div>
                            </div>
                          )}

                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Chat Input */}
                      <div className="border-t p-4 flex-shrink-0">
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleSendChat() }}
                          className="flex items-end gap-2"
                        >
                          <Textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Apna dard batayein... (Describe your pain)"
                            className="flex-1 min-h-[44px] max-h-32 resize-none font-sans text-sm"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendChat()
                              }
                            }}
                          />
                          <Button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="h-11 w-11 p-0 flex-shrink-0"
                            aria-label="Send message"
                          >
                            {chatLoading ? (
                              <FiRefreshCw size={18} className="animate-spin" />
                            ) : (
                              <FiSend size={18} />
                            )}
                          </Button>
                        </form>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* ============ GROWTH ENGINE ============ */}
              {activeTab === 'growth' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-serif">Growth Engine</h2>
                    <p className="text-sm text-muted-foreground font-sans mt-1">Find real leads via web search and generate personalized SVEDAN Brand Partner outreach for any city in India</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Input Form */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base font-serif">Outreach Setup</CardTitle>
                        <CardDescription className="font-sans">Search any Indian city for real leads and generate outreach</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Partner Type */}
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Partner Type *</Label>
                          <Select
                            value={growthForm.partnerType}
                            onValueChange={(val) => setGrowthForm(prev => ({ ...prev, partnerType: val }))}
                          >
                            <SelectTrigger className="font-sans">
                              <SelectValue placeholder="Select partner type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PARTNER_TYPES.map(pt => (
                                <SelectItem key={pt} value={pt} className="font-sans">{pt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">City *</Label>
                          <Input
                            placeholder="Type any Indian city (e.g. Karnal, Delhi, Mumbai...)"
                            value={growthForm.city}
                            onChange={(e) => setGrowthForm(prev => ({ ...prev, city: e.target.value }))}
                            className="font-sans"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {CITIES.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setGrowthForm(prev => ({ ...prev, city: c }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-sans transition-colors border ${growthForm.city === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}
                              >
                                {c}
                              </button>
                            ))}
                            <button
                              key="Karnal"
                              type="button"
                              onClick={() => setGrowthForm(prev => ({ ...prev, city: 'Karnal' }))}
                              className={`px-2 py-0.5 rounded text-[10px] font-sans transition-colors border ${growthForm.city === 'Karnal' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}
                            >
                              Karnal
                            </button>
                          </div>
                        </div>

                        {/* Channels */}
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Channels *</Label>
                          <div className="flex flex-wrap gap-2">
                            {CHANNELS.map(ch => (
                              <ChannelChip
                                key={ch}
                                label={ch}
                                selected={growthForm.channels.includes(ch)}
                                onClick={() => toggleChannel(ch)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Partner Name (optional) */}
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Partner Name (Optional)</Label>
                          <Input
                            placeholder="e.g. Priya Sharma"
                            value={growthForm.partnerName}
                            onChange={(e) => setGrowthForm(prev => ({ ...prev, partnerName: e.target.value }))}
                            className="font-sans"
                          />
                        </div>

                        {/* Product Info Card */}
                        <div className="rounded-lg border bg-secondary/30 p-3 flex items-center gap-3">
                          <img src={PRODUCT_IMAGE_2} alt="SVEDAN" className="h-12 w-12 rounded object-contain" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-sans font-medium">SVEDAN Pain Amrut Oil</p>
                            <p className="text-[10px] font-sans text-muted-foreground">20% commission | Free samples | Exclusive territory</p>
                          </div>
                        </div>

                        {outreachError && (
                          <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs font-sans">
                            {outreachError}
                          </div>
                        )}

                        <Button
                          onClick={handleGenerateOutreach}
                          disabled={outreachLoading}
                          className="w-full font-sans"
                        >
                          {outreachLoading ? (
                            <>
                              <FiRefreshCw size={16} className="mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RiRocketLine size={16} className="mr-2" />
                              Generate Outreach
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Output Panel */}
                    <div className="lg:col-span-3">
                      {outreachLoading ? (
                        <Card>
                          <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-3 w-56" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-sans text-muted-foreground animate-pulse">Searching the web for leads...</p>
                              <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-8 w-full" />
                              <Skeleton className="h-8 w-full" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-sans text-muted-foreground animate-pulse">Generating personalized messages...</p>
                              <Skeleton className="h-32 w-full" />
                            </div>
                          </CardContent>
                        </Card>
                      ) : displayOutreach ? (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <CardTitle className="text-base font-serif">Generated Outreach</CardTitle>
                                <CardDescription className="font-sans">
                                  {displayOutreach.partner_type} in {displayOutreach.city}
                                </CardDescription>
                              </div>
                              {displayOutreach.personalization_notes && (
                                <Badge variant="secondary" className="font-sans text-xs">
                                  <FiActivity size={10} className="mr-1" />
                                  Personalized
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Leads Table */}
                            {Array.isArray(displayOutreach.leads) && displayOutreach.leads.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="text-sm font-semibold font-serif">Leads Found</h4>
                                    <p className="text-xs text-muted-foreground font-sans">{displayOutreach.leads.length} professionals discovered via web search</p>
                                  </div>
                                  <Badge variant="secondary" className="font-sans text-xs">
                                    <FiSearch size={10} className="mr-1" />
                                    Web Search
                                  </Badge>
                                </div>
                                <div className="overflow-x-auto rounded-lg border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-secondary/30">
                                        <TableHead className="font-sans text-xs uppercase tracking-wider">Name</TableHead>
                                        <TableHead className="font-sans text-xs uppercase tracking-wider">Type</TableHead>
                                        <TableHead className="font-sans text-xs uppercase tracking-wider">City</TableHead>
                                        <TableHead className="font-sans text-xs uppercase tracking-wider">Contact / Social</TableHead>
                                        <TableHead className="font-sans text-xs uppercase tracking-wider w-20">Status</TableHead>
                                        <TableHead className="font-sans text-xs uppercase tracking-wider w-16">Save</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {displayOutreach.leads.map((lead, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="font-sans text-sm font-medium">{lead?.name || 'Unknown'}</TableCell>
                                          <TableCell className="font-sans text-xs text-muted-foreground">{lead?.professional_type || ''}</TableCell>
                                          <TableCell className="font-sans text-xs">
                                            <div className="flex items-center gap-1">
                                              <FiMapPin size={10} className="text-muted-foreground" />
                                              {lead?.city || ''}
                                            </div>
                                          </TableCell>
                                          <TableCell className="font-sans text-xs">
                                            <span className="text-primary break-all">{lead?.contact_info || 'N/A'}</span>
                                          </TableCell>
                                          <TableCell>
                                            {lead?.verified ? (
                                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-sans text-[9px]">
                                                <FiCheck size={8} className="mr-0.5" /> Verified
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="font-sans text-[9px] text-muted-foreground">
                                                Unverified
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                              aria-label={`Save ${lead?.name} as partner`}
                                              onClick={() => {
                                                const newPartner: Partner = {
                                                  id: generateId(),
                                                  name: lead?.name || 'Unknown',
                                                  type: lead?.professional_type || displayOutreach.partner_type,
                                                  city: lead?.city || displayOutreach.city,
                                                  channels: [],
                                                  status: 'New',
                                                  dateAdded: new Date().toISOString().split('T')[0] || '',
                                                }
                                                setPartners(prev => {
                                                  if (prev.some(p => p.name === newPartner.name && p.city === newPartner.city)) return prev
                                                  return [newPartner, ...prev]
                                                })
                                                addActivity('partner', `Saved lead: ${lead?.name} from ${lead?.city}`)
                                              }}
                                            >
                                              <FiPlus size={14} />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}

                            {/* Channel Messages */}
                            {Array.isArray(displayOutreach.channels) && displayOutreach.channels.length > 0 ? (
                              <Tabs defaultValue={displayOutreach.channels[0]?.channel_name || 'tab-0'}>
                                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-secondary/50 p-1">
                                  {displayOutreach.channels.map((ch, idx) => (
                                    <TabsTrigger
                                      key={ch?.channel_name || `tab-${idx}`}
                                      value={ch?.channel_name || `tab-${idx}`}
                                      className="font-sans text-xs"
                                    >
                                      {ch?.channel_name || `Channel ${idx + 1}`}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>
                                {displayOutreach.channels.map((ch, idx) => (
                                  <TabsContent key={ch?.channel_name || `tab-${idx}`} value={ch?.channel_name || `tab-${idx}`}>
                                    <div className="mt-4 space-y-3">
                                      {ch?.subject_line && (
                                        <div>
                                          <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Subject Line</Label>
                                          <p className="text-sm font-sans font-medium mt-1">{ch.subject_line}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
                                        <div className="mt-2 bg-secondary/30 rounded-lg p-4 border">
                                          <div className="font-sans text-sm whitespace-pre-wrap leading-relaxed">
                                            {renderMarkdown(ch?.message_body || '')}
                                          </div>
                                        </div>
                                      </div>
                                      {(ch?.word_count ?? 0) > 0 && (
                                        <p className="text-xs text-muted-foreground font-sans">{ch?.word_count} words</p>
                                      )}
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="font-sans text-xs"
                                          onClick={() => handleCopyMessage(ch?.message_body || '', ch?.channel_name || '')}
                                        >
                                          {copiedChannel === ch?.channel_name ? (
                                            <><FiCheck size={14} className="mr-1" /> Copied</>
                                          ) : (
                                            <><FiCopy size={14} className="mr-1" /> Copy Message</>
                                          )}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="font-sans text-xs"
                                          onClick={handleGenerateOutreach}
                                          disabled={outreachLoading}
                                        >
                                          <FiRefreshCw size={14} className="mr-1" />
                                          Regenerate
                                        </Button>
                                      </div>
                                    </div>
                                  </TabsContent>
                                ))}
                              </Tabs>
                            ) : (
                              <p className="text-sm text-muted-foreground font-sans">No channel messages generated.</p>
                            )}

                            {displayOutreach.personalization_notes && (
                              <div className="mt-6 pt-4 border-t">
                                <Label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Personalization Notes</Label>
                                <p className="text-sm font-sans mt-1 text-muted-foreground italic">{displayOutreach.personalization_notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="p-0">
                            <EmptyState
                              icon={<RiRocketLine size={28} />}
                              title="Ready to Generate"
                              description="Enter any Indian city and partner type to search the web for real leads. The engine will find actual professionals with contact details and generate hyper-personalized outreach messages."
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============ PARTNER TRACKER ============ */}
              {activeTab === 'tracker' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-2xl font-bold font-serif">Partner Tracker</h2>
                      <p className="text-sm text-muted-foreground font-sans mt-1">Manage and track your SVEDAN Brand Partner pipeline</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingPartner(null)
                        setPartnerForm({ name: '', type: '', city: '', channels: [], status: 'New' })
                        setShowAddPartner(true)
                      }}
                      className="font-sans"
                    >
                      <FiPlus size={16} className="mr-2" />
                      Add Partner
                    </Button>
                  </div>

                  {/* Filters */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <div className="relative">
                            <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search partners..."
                              value={partnerSearch}
                              onChange={(e) => setPartnerSearch(e.target.value)}
                              className="pl-9 font-sans"
                            />
                          </div>
                        </div>
                        <Select value={partnerFilterCity} onValueChange={setPartnerFilterCity}>
                          <SelectTrigger className="w-[140px] font-sans">
                            <SelectValue placeholder="City" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-sans">All Cities</SelectItem>
                            {uniqueCities.map(c => (
                              <SelectItem key={c} value={c} className="font-sans">{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={partnerFilterType} onValueChange={setPartnerFilterType}>
                          <SelectTrigger className="w-[160px] font-sans">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-sans">All Types</SelectItem>
                            {PARTNER_TYPES.map(pt => (
                              <SelectItem key={pt} value={pt} className="font-sans">{pt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={partnerFilterStatus} onValueChange={setPartnerFilterStatus}>
                          <SelectTrigger className="w-[150px] font-sans">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="font-sans">All Statuses</SelectItem>
                            {PARTNER_STATUSES.map(s => (
                              <SelectItem key={s} value={s} className="font-sans">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Partners Table */}
                  <Card>
                    {filteredPartners.length === 0 ? (
                      <CardContent className="p-0">
                        <EmptyState
                          icon={<HiOutlineUsers size={28} />}
                          title={displayPartners.length === 0 ? 'No Partners Yet' : 'No Partners Match Filters'}
                          description={displayPartners.length === 0 ? 'Add your first SVEDAN Brand Partner to start tracking your pipeline. Use the Growth Engine to generate outreach first.' : 'Try adjusting your search or filter criteria.'}
                          action={displayPartners.length === 0 ? (
                            <Button
                              onClick={() => {
                                setEditingPartner(null)
                                setPartnerForm({ name: '', type: '', city: '', channels: [], status: 'New' })
                                setShowAddPartner(true)
                              }}
                              className="font-sans"
                            >
                              <FiPlus size={16} className="mr-2" />
                              Add First Partner
                            </Button>
                          ) : undefined}
                        />
                      </CardContent>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">Name</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">Type</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">City</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">Channels</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">Status</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider">Added</TableHead>
                              <TableHead className="font-sans text-xs uppercase tracking-wider text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPartners.map(partner => (
                              <TableRow key={partner.id}>
                                <TableCell className="font-sans font-medium">{partner.name}</TableCell>
                                <TableCell className="font-sans text-sm text-muted-foreground">{partner.type}</TableCell>
                                <TableCell className="font-sans text-sm">
                                  <div className="flex items-center gap-1">
                                    <FiMapPin size={12} className="text-muted-foreground" />
                                    {partner.city}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {Array.isArray(partner.channels) && partner.channels.map(ch => (
                                      <Badge key={ch} variant="secondary" className="text-[10px] font-sans px-1.5 py-0">{ch}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-[10px] font-sans border ${STATUS_COLORS[partner.status] || 'bg-secondary text-secondary-foreground'}`}>
                                    {partner.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-sans text-sm text-muted-foreground">{formatDate(partner.dateAdded)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditPartner(partner)}
                                      aria-label={`Edit ${partner.name}`}
                                    >
                                      <FiEdit2 size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDeletePartner(partner.id)}
                                      aria-label={`Delete ${partner.name}`}
                                    >
                                      <FiTrash2 size={14} />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>

                  {/* Add/Edit Partner Dialog */}
                  <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-serif">{editingPartner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
                        <DialogDescription className="font-sans">
                          {editingPartner ? 'Update the partner details below.' : 'Fill in the partner details to add them to your tracker.'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Name *</Label>
                          <Input
                            placeholder="Full name"
                            value={partnerForm.name}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                            className="font-sans"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Partner Type *</Label>
                          <Select
                            value={partnerForm.type}
                            onValueChange={(val) => setPartnerForm(prev => ({ ...prev, type: val }))}
                          >
                            <SelectTrigger className="font-sans">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PARTNER_TYPES.map(pt => (
                                <SelectItem key={pt} value={pt} className="font-sans">{pt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">City *</Label>
                          <Input
                            placeholder="City name"
                            value={partnerForm.city}
                            onChange={(e) => setPartnerForm(prev => ({ ...prev, city: e.target.value }))}
                            className="font-sans"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Channels Contacted</Label>
                          <div className="flex flex-wrap gap-2">
                            {CHANNELS.map(ch => (
                              <ChannelChip
                                key={ch}
                                label={ch}
                                selected={partnerForm.channels.includes(ch)}
                                onClick={() => togglePartnerChannel(ch)}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-xs uppercase tracking-wider">Status</Label>
                          <Select
                            value={partnerForm.status}
                            onValueChange={(val) => setPartnerForm(prev => ({ ...prev, status: val }))}
                          >
                            <SelectTrigger className="font-sans">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {PARTNER_STATUSES.map(s => (
                                <SelectItem key={s} value={s} className="font-sans">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => { setShowAddPartner(false); setEditingPartner(null) }}
                          className="font-sans"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSavePartner}
                          disabled={!partnerForm.name || !partnerForm.type || !partnerForm.city}
                          className="font-sans"
                        >
                          {editingPartner ? 'Save Changes' : 'Add Partner'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </InlineErrorBoundary>
  )
}
