

export function FloatingButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', right: 16, bottom: 16, padding: '10px 14px', borderRadius: 20,
        background: '#1677ff', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 2147483647
      }}
      title="ZenTao Monthly Consumed Report"
    >
      {loading ? 'Loading…' : 'Report'}
    </button>
  )
}