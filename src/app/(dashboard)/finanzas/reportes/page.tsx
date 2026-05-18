'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ChevronRight } from 'lucide-react'
import { formatCurrency, formatMonth } from '@/lib/utils/formatters'
import { getReports, generateReport } from '@/services/reports.service'
import type { MonthlyReport } from '@/types/database.types'

const MONTHS_ES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function monthLabel(year: number, month: number) {
  return `${MONTHS_ES[month]} ${year}`
}

function SavingsBar({ rate }: { rate: number }) {
  const color = rate >= 30 ? '#34d399' : rate >= 15 ? '#fbbf24' : '#f87171'
  return (
    <div className="xp-track mt-2" style={{ height: 4 }}>
      <div style={{ width: `${Math.min(100, rate)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 700ms ease' }} />
    </div>
  )
}

function ReportCard({
  report,
  prevReport,
  selected,
  onClick,
}: {
  report: MonthlyReport
  prevReport: MonthlyReport | undefined
  selected: boolean
  onClick: () => void
}) {
  const balance = report.balance
  const incomeDiff = prevReport ? report.total_income - prevReport.total_income : null
  const color = balance >= 0 ? '#34d399' : '#f87171'

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass lift p-4 flex flex-col gap-3 transition-all"
      style={{
        borderRadius: 16,
        outline: selected ? `1.5px solid #34d399` : undefined,
        background: selected ? 'rgba(52,211,153,0.04)' : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>
            {report.year}
          </div>
          <div className="text-[15px] font-bold display" style={{ color: 'var(--text-0)' }}>
            {MONTHS_ES[report.month]}
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
          <span className="text-[10px] num">{report.transaction_count} txns</span>
          <ChevronRight size={12} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-left">
        <div>
          <div className="text-[9px] num uppercase tracking-[0.14em] mb-0.5" style={{ color: 'var(--text-2)' }}>Ingresos</div>
          <div className="text-[13px] font-semibold num" style={{ color: '#34d399' }}>
            {formatCurrency(report.total_income)}
          </div>
          {incomeDiff !== null && (
            <div className="text-[10px] num mt-0.5" style={{ color: incomeDiff >= 0 ? '#34d399' : '#f87171' }}>
              {incomeDiff >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(incomeDiff))}
            </div>
          )}
        </div>
        <div>
          <div className="text-[9px] num uppercase tracking-[0.14em] mb-0.5" style={{ color: 'var(--text-2)' }}>Gastos</div>
          <div className="text-[13px] font-semibold num" style={{ color: '#f87171' }}>
            {formatCurrency(report.total_expenses)}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] num uppercase tracking-[0.14em]" style={{ color: 'var(--text-2)' }}>
            Tasa de ahorro
          </span>
          <span className="text-[11px] num font-bold" style={{ color }}>
            {report.savings_rate}%
          </span>
        </div>
        <SavingsBar rate={report.savings_rate} />
      </div>
    </button>
  )
}

function ReportDetail({ report, prevReport, onRegenerate }: {
  report: MonthlyReport
  prevReport: MonthlyReport | undefined
  onRegenerate: () => void
}) {
  const balance = report.balance
  const balanceColor = balance >= 0 ? '#34d399' : '#f87171'

  return (
    <div className="space-y-4">
      {/* Key stats */}
      <div className="glass p-5" style={{ borderRadius: 18 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>
              Resumen
            </div>
            <h2 className="text-[17px] font-bold display" style={{ color: 'var(--text-0)' }}>
              {monthLabel(report.year, report.month)}
            </h2>
          </div>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors hover:bg-white/[0.06]"
            style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}
          >
            <RefreshCw size={11} />
            Regenerar
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ingresos', value: formatCurrency(report.total_income), color: '#34d399', icon: <ArrowUpRight size={13} /> },
            { label: 'Gastos', value: formatCurrency(report.total_expenses), color: '#f87171', icon: <ArrowDownRight size={13} /> },
            { label: 'Balance', value: formatCurrency(balance), color: balanceColor, icon: <Wallet size={13} /> },
            { label: 'Ahorro', value: `${report.savings_rate}%`, color: report.savings_rate >= 20 ? '#34d399' : '#fbbf24', icon: <TrendingUp size={13} /> },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: s.color }}>
                {s.icon}
                <span className="text-[9px] num uppercase tracking-[0.14em]">{s.label}</span>
              </div>
              <div className="text-[15px] font-bold num" style={{ color: s.color }}>{s.value}</div>
              {prevReport && s.label !== 'Ahorro' && (() => {
                const prev = s.label === 'Ingresos' ? prevReport.total_income
                  : s.label === 'Gastos' ? prevReport.total_expenses
                  : prevReport.balance
                const curr = s.label === 'Ingresos' ? report.total_income
                  : s.label === 'Gastos' ? report.total_expenses
                  : report.balance
                const diff = curr - prev
                if (diff === 0) return null
                return (
                  <div className="text-[10px] num mt-1" style={{ color: diff > 0 ? '#34d399' : '#f87171' }}>
                    {diff > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(diff))} vs anterior
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Top categories */}
      {report.top_categories.length > 0 && (
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Gastos por categoría</div>
          <h3 className="text-[15px] font-semibold display mb-4" style={{ color: 'var(--text-0)' }}>Top categorías</h3>
          <div className="space-y-3">
            {report.top_categories.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-0)' }}>{cat.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] num font-semibold" style={{ color: 'var(--text-0)' }}>{formatCurrency(cat.amount)}</span>
                      <span className="text-[10px] num" style={{ color: 'var(--text-2)' }}>{cat.percentage}%</span>
                    </div>
                  </div>
                  <div className="xp-track" style={{ height: 4 }}>
                    <div style={{ width: `${cat.percentage}%`, height: '100%', background: cat.color, borderRadius: 999, transition: 'width 600ms ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallet breakdown */}
      {report.wallet_breakdown.length > 0 && (
        <div className="glass p-5" style={{ borderRadius: 18 }}>
          <div className="text-[10px] num uppercase tracking-[0.18em] mb-0.5" style={{ color: 'var(--text-2)' }}>Por wallet</div>
          <h3 className="text-[15px] font-semibold display mb-4" style={{ color: 'var(--text-0)' }}>Desglose de wallets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.wallet_breakdown.map(w => {
              const wBalance = w.income - w.expenses
              return (
                <div key={w.wallet_id} className="rounded-xl p-4" style={{ background: `${w.color}08`, border: `1px solid ${w.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold"
                      style={{ background: `${w.color}20`, color: w.color }}>
                      {w.name[0]}
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-0)' }}>{w.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[9px] num uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--text-2)' }}>In</div>
                      <div className="text-[12px] num font-semibold" style={{ color: '#34d399' }}>{formatCurrency(w.income)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] num uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--text-2)' }}>Out</div>
                      <div className="text-[12px] num font-semibold" style={{ color: '#f87171' }}>{formatCurrency(w.expenses)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] num uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--text-2)' }}>Net</div>
                      <div className="text-[12px] num font-bold" style={{ color: wBalance >= 0 ? '#34d399' : '#f87171' }}>
                        {wBalance >= 0 ? '+' : ''}{formatCurrency(wBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] num text-right pb-1" style={{ color: 'var(--text-2)' }}>
        Generado {new Date(report.generated_at).toLocaleString('es-AR')}
      </div>
    </div>
  )
}

export default function ReportesPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const now = new Date()
  const [genYear, setGenYear] = useState(now.getFullYear())
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReports()
      setReports(data)
      if (data.length > 0 && !selected) setSelected(`${data[0].year}-${data[0].month}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  async function handleGenerate(year: number, month: number) {
    setGenerating(true)
    setError(null)
    try {
      const r = await generateReport(year, month)
      setReports(prev => {
        const filtered = prev.filter(x => !(x.year === year && x.month === month))
        return [r, ...filtered].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
      })
      setSelected(`${year}-${month}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  const selectedReport = selected
    ? reports.find(r => `${r.year}-${r.month}` === selected)
    : undefined

  const selectedIdx = selectedReport ? reports.indexOf(selectedReport) : -1
  const prevReport = selectedIdx >= 0 ? reports[selectedIdx + 1] : undefined

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/finanzas"
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-white/[0.06]"
            style={{ border: '1px solid var(--line)', color: 'var(--text-2)' }}>
            <ArrowLeft size={14} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
              <FileText size={17} />
            </div>
            <div>
              <div className="text-[10px] num uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>Vault</div>
              <h1 className="text-[20px] font-bold display tracking-tight" style={{ color: 'var(--text-0)' }}>Reportes</h1>
            </div>
          </div>
        </div>

        {/* Generator controls */}
        <div className="flex items-center gap-2">
          <select
            value={genMonth}
            onChange={e => setGenMonth(Number(e.target.value))}
            className="rounded-xl px-3 py-1.5 text-[12px] num"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-1)', outline: 'none' }}
          >
            {MONTHS_ES.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={genYear}
            onChange={e => setGenYear(Number(e.target.value))}
            className="rounded-xl px-3 py-1.5 text-[12px] num"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: 'var(--text-1)', outline: 'none' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => void handleGenerate(genYear, genMonth)}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            {generating
              ? <><RefreshCw size={12} className="animate-spin" /> Generando…</>
              : <><FileText size={12} /> Generar reporte</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl px-4 py-3" style={{ border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.1)' }}>
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-2xl animate-shimmer" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <FileText size={24} style={{ color: '#34d399' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-0)' }}>Sin reportes todavía</p>
          <p className="text-[13px] mb-6" style={{ color: 'var(--text-2)' }}>
            Generá el reporte de este mes para ver tu resumen financiero.
          </p>
          <button
            onClick={() => void handleGenerate(now.getFullYear(), now.getMonth() + 1)}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            <FileText size={14} />
            {generating ? 'Generando…' : `Generar ${formatMonth()}`}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Report cards list */}
          <div className="lg:col-span-1 space-y-3">
            {reports.map((r, i) => (
              <ReportCard
                key={r.id}
                report={r}
                prevReport={reports[i + 1]}
                selected={selected === `${r.year}-${r.month}`}
                onClick={() => setSelected(`${r.year}-${r.month}`)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <ReportDetail
                report={selectedReport}
                prevReport={prevReport}
                onRegenerate={() => void handleGenerate(selectedReport.year, selectedReport.month)}
              />
            ) : (
              <div className="flex items-center justify-center h-40 glass rounded-2xl" style={{ color: 'var(--text-2)' }}>
                <span className="text-[13px]">Seleccioná un reporte para ver el detalle</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
