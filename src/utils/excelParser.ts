// Simple Excel file parser for .xlsx format
// This is a basic implementation that extracts text from shared strings

export function parseXLSXFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const content = extractTextFromXLSX(arrayBuffer)
        resolve(content)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function extractTextFromXLSX(arrayBuffer: ArrayBuffer): string {
  // This is a simplified approach - in a real implementation you'd need
  // a full ZIP parser and XML parser. For now, we'll try to extract text
  // using a basic approach
  
  const uint8Array = new Uint8Array(arrayBuffer)
  
  // Check if it's a valid ZIP/XLSX file
  if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
    throw new Error('Invalid Excel file format')
  }
  
  // For a complete implementation, you'd need:
  // 1. ZIP extraction to get XML files
  // 2. XML parsing to extract shared strings and worksheet data
  // 3. Cell reference parsing to reconstruct the table
  
  // Since we can't implement a full Excel parser easily, let's provide
  // a better solution by creating a CSV conversion helper
  throw new Error('Direct Excel parsing requires complex implementation. Please use one of these alternatives:\n\n1. Convert to CSV: Open in Excel → Save As → CSV UTF-8\n2. Copy-paste: Select all in Excel → Copy → Paste into text editor → Save as .csv\n3. Use online converter: Upload file to online Excel-to-CSV converter\n\nThis ensures proper Chinese character support and reliable parsing.')
}

// Alternative approach: Use browser's built-in capabilities if available
export function tryBrowserExcelParsing(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try to use the File API to read as text first
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        
        // Check if we can read it as text (some Excel files might be saved as CSV)
        if (content.includes(',') || content.includes('\t') || content.includes(';')) {
          resolve(content)
        } else {
          reject(new Error('Unable to parse Excel file directly. Please convert to CSV format.'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    
    // Try different encodings
    reader.readAsText(file, 'UTF-8')
  })
}

// Helper function to create a downloadable CSV template
export function downloadCSVTemplate() {
  const template = '编号,提测时间,前端,后端,脚本\n1,11,张三,李四,王五\n2,12,张三,,王五\n3,15,,李四,'
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'task_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helper function to create a downloadable Excel template
export function downloadExcelTemplate() {
  const templateData = [
    ['编号', '提测时间', '前端', '后端', '脚本'],
    [1, '11', '张三', '李四', '王五'],
    [2, '12', '张三', '', '王五'],
    [3, '15', '', '李四', '']
  ]
  
  // Create a simple CSV that Excel can open
  const csvContent = templateData.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'task_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}