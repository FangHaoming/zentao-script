import { useEffect, useMemo, useRef, useState } from 'react'

export function CheckboxMultiSelect({ options, values, onChange }: { options: Array<{ value: any; label: string }>; values: any[]; onChange: (v: any[]) => void }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return options
    const k = keyword.trim().toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(k) || String(o.value).toLowerCase().includes(k))
  }, [options, keyword])

  const toggle = (val: any) => {
    const set = new Set(values)
    if (set.has(val)) set.delete(val)
    else set.add(val)
    onChange(Array.from(set))
  }

  const clearAll = () => onChange([])
  const selectAllFiltered = () => onChange(Array.from(new Set([...values, ...filtered.map(f => f.value)])))

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }} style={{ minWidth: 240 }}>
        {values.length ? `Selected (${values.length})` : 'Select...'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: 320, background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 2147483647 }} onClick={e => e.stopPropagation()}>
          <input placeholder="Search..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={selectAllFiltered}>Select filtered</button>
            <button type="button" onClick={clearAll}>Clear</button>
          </div>
          <div style={{ maxHeight: 220, overflow: 'auto', paddingRight: 4 }}>
            {filtered.map(o => (
              <label key={String(o.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <input type="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} />
                <span title={o.label} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</span>
              </label>
            ))}
            {!filtered.length && <div style={{ color: '#999' }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}