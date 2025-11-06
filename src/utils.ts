export function formatHours(h: number): string { 
  return (Math.round(h * 100) / 100).toFixed(2) 
}

export function toDays(h: number): string { 
  return formatHours(h / 8) 
}

export function getCookieValue(name: string): string {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : ''
}

export function pad2(n: number): string { 
  return n < 10 ? '0' + n : String(n) 
}

export function formatMonth(d: Date): string { 
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}` 
}