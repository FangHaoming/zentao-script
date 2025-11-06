import { formatHours, toDays } from '../utils'

const thStyle: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #eee', padding: '8px 6px', background: '#fafafa' }
const tdStyle: React.CSSProperties = { borderBottom: '1px solid #f3f3f3', padding: '8px 6px' }

export function ResultsTable({ rows }: { rows: Array<{ realname: string; hours: number }> }) {
  const total = rows.reduce((s, r) => s + r.hours, 0)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>用户名称</th>
          <th style={thStyle}>消耗工时（小时）</th>
          <th style={thStyle}>消耗工时（天，8小时/天）</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td style={tdStyle}>{r.realname}</td>
            <td style={tdStyle}>{formatHours(r.hours)}</td>
            <td style={tdStyle}>{toDays(r.hours)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td style={tdStyle}>合计</td>
          <td style={tdStyle}>{formatHours(total)}</td>
          <td style={tdStyle}>{toDays(total)}</td>
        </tr>
      </tfoot>
    </table>
  )
}