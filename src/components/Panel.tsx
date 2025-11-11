export function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 64, width: 820, maxHeight: '70vh', overflow: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 2147483647 }}>
      <div style={{
        display: 'flex', alignItems: 'center', marginBottom: 8,
        position: 'sticky',
        top: 0,
        justifyContent: 'flex-end',
      }}>
        <button onClick={onClose} style={{ width: 'max-content', border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  )
}