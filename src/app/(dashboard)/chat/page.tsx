'use client'

import { useState } from 'react'
import { useFinance } from '@/contexts/FinanceContext'
import { AIAssistant } from '@/components/features/ai-chat/AIAssistant'
import { Sparkles, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENTS = [
  {
    id: 'sage',
    name: 'Sage',
    role: 'Quest Guide',
    tier: 'Tier 11',
    emoji: '🧙',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.4)',
    desc: "Crafts your daily quest. Reads your streaks, energy, and gaps in the Codex.",
    active: true,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Wealth Oracle',
    tier: 'Tier 22',
    emoji: '📊',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.4)',
    desc: "Plans your lifts. Suggests deloads when fatigue spikes.",
    active: true,
  },
  {
    id: 'mint',
    name: 'Mint',
    role: 'Finance',
    tier: 'Tier 8',
    emoji: '💰',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    desc: "Watches your vault. Flags drift from savings goals before the week ends.",
    active: true,
  },
  {
    id: 'lumen',
    name: 'Lumen',
    role: 'Codex',
    tier: 'Tier 5',
    emoji: '📖',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    desc: "Curates your reading queue and quizzes you on retention.",
    active: true,
  },
]

const FORGE_QUESTS = [
  'A 30-min reading sprint',
  'A challenging lift today',
  'A no-spend afternoon',
  'A 10-min meditation',
]

function AgentCard({ agent, selected, onSelect }: {
  agent: typeof AGENTS[0]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="glass p-4 flex flex-col gap-3 text-left transition-all hover:scale-[1.01]"
      style={{
        borderRadius: 16,
        boxShadow: selected ? `0 0 20px ${agent.glow}, 0 0 0 1px ${agent.color}` : 'none',
        borderColor: selected ? agent.color : undefined,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
            style={{ background: `${agent.color}18`, boxShadow: selected ? `0 0 12px ${agent.glow}` : 'none' }}>
            {agent.emoji}
          </div>
          <div>
            <div className="text-[14px] font-bold display" style={{ color: 'var(--text-0)' }}>{agent.name}</div>
            <div className="text-[10px] num uppercase tracking-[0.15em]" style={{ color: agent.color }}>
              {agent.role} · {agent.tier}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
          <span className="text-[10px] num" style={{ color: '#34d399' }}>Active</span>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{agent.desc}</p>
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
        style={{ background: `${agent.color}10`, border: `1px solid ${agent.color}25` }}>
        <Sparkles size={10} style={{ color: agent.color }} />
        <span className="text-[11px] num" style={{ color: agent.color }}>Brief</span>
        <span className="ml-auto text-[10px] num" style={{ color: agent.color }}>●Live</span>
      </div>
    </button>
  )
}

export default function ChatPage() {
  const { aiContext } = useFinance()
  const [selectedAgent, setSelectedAgent] = useState('sage')
  const [forgedQuests, setForgedQuests] = useState<string[]>([])

  const agent = AGENTS.find(a => a.id === selectedAgent) ?? AGENTS[0]

  return (
    <div className="flex flex-col h-full">
      {/* ── Section header ── */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>AI Arena</div>
            <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>AI Agent Arena</h1>
          </div>
        </div>
        <span className="text-[11px] num px-2.5 py-1.5 rounded-xl flex items-center gap-1.5"
          style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          4 active
        </span>
      </div>

      {/* ── Agent cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {AGENTS.map(ag => (
          <AgentCard key={ag.id} agent={ag} selected={selectedAgent === ag.id} onSelect={() => setSelectedAgent(ag.id)} />
        ))}
      </div>

      {/* ── Chat + Forge panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Chat area */}
        <div className="lg:col-span-2 glass flex flex-col" style={{ borderRadius: 18, minHeight: 420 }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
              style={{ background: `${agent.color}18` }}>
              {agent.emoji}
            </div>
            <div>
              <div className="text-[14px] font-bold display" style={{ color: 'var(--text-0)' }}>
                {agent.name} · {agent.role}
              </div>
              <div className="text-[11px] num" style={{ color: 'var(--text-2)' }}>
                {agent.tier} · Reads your 8 active quests
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              <span className="text-[11px] num" style={{ color: '#34d399' }}>Live</span>
            </div>
          </div>

          {/* Assistant */}
          <div className="flex-1 min-h-0">
            <AIAssistant context={aiContext} mode="embedded" />
          </div>
        </div>

        {/* Forge panel */}
        <div className="glass p-5 flex flex-col gap-4" style={{ borderRadius: 18 }}>
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Forge</div>
            <h3 className="text-[15px] font-bold display" style={{ color: 'var(--text-0)' }}>Forge a quest</h3>
          </div>

          <ul className="space-y-2">
            {FORGE_QUESTS.map(q => {
              const done = forgedQuests.includes(q)
              return (
                <li key={q}>
                  <button
                    onClick={() => setForgedQuests(prev =>
                      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
                    )}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all quest-row"
                    style={{
                      background: done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : 'var(--line)'}`,
                    }}>
                    <div className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all',
                      done ? 'bg-emerald-400/20' : 'border border-white/20'
                    )}>
                      {done && <Check size={12} style={{ color: '#34d399' }} />}
                    </div>
                    <span className="text-[13px] flex-1" style={{ color: done ? 'var(--text-2)' : 'var(--text-1)' }}>
                      {q}
                    </span>
                    <Plus size={13} style={{ color: 'var(--text-2)' }} />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-auto">
            <div className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                Ask {agent.name} to generate custom quests for your goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
