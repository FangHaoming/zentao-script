import * as XLSX from 'xlsx'
import type { ExcelInfo, ColumnMapping } from '../types'

function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}

export function parseCSV(content: string, mapping: ColumnMapping): ExcelInfo[] {
  const lines = content.trim().split('\n')
  if (lines.length === 0) {
    throw new Error('File is empty')
  }
  
  // Detect delimiter
  const delimiter = detectDelimiter(content)
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  const idIndex = headers.findIndex(h => h === mapping.idColumn)
  const deadlineIndex = headers.findIndex(h => h === mapping.deadlineColumn)
  const prefixIndices = mapping.prefixColumns.map(prefix => ({
    prefix,
    index: headers.findIndex(h => h === prefix)
  }))
  
  const missingColumns = []
  if (idIndex === -1) missingColumns.push(`ID column "${mapping.idColumn}"`)
  if (deadlineIndex === -1) missingColumns.push(`Deadline column "${mapping.deadlineColumn}"`)
  
  if (missingColumns.length > 0) {
    throw new Error(`Required columns not found: ${missingColumns.join(', ')}. Available columns: ${headers.join(', ')}`)
  }
  
  const results: ExcelInfo[] = []
  let validRows = 0
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = parseCSVLine(line)
    
    const id = parseInt(values[idIndex])
    const deadline = values[deadlineIndex]
    
    if (isNaN(id)) continue
    
    const users = prefixIndices
      .filter(({ index }) => index !== -1 && values[index])
      .map(({ prefix, index }) => ({
        prefix,
        realname: values[index],
        account: '' // Will be filled later
      }))
    
    if (users.length === 0) continue
    
    results.push({
      id,
      users,
      deadline,
      estStarted: '', // Will be filled later
      taskName: '', // Will be filled later
      execution: '' // Will be filled later
    })
    validRows++
  }
  
  if (results.length === 0) {
    throw new Error(`No valid data rows found. Processed ${lines.length - 1} data rows but none contained valid ID, deadline, and user assignments.`)
  }
  
  console.log(`Successfully parsed ${results.length} valid rows from ${lines.length - 1} data rows using delimiter "${delimiter}"`)
  return results
}

export function parseExcelFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(content)
    }
    reader.onerror = reject
    
    // Handle different file types
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // For Excel files, we need to use a different approach
      // Since we can't easily use xlsx library, we'll try to read as CSV first
      // and if that fails, suggest converting to CSV
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsText(file, 'UTF-8')
    }
  })
}

export function detectAndParseFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Handle CSV files directly
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          
          // Handle encoding and BOM
          let processedContent = content
          if (content.charCodeAt(0) === 0xFEFF) {
            processedContent = content.slice(1)
          }
          processedContent = processedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
          
          resolve(processedContent)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsText(file, 'UTF-8')
      return
    }
    
    // Handle Excel files using xlsx library
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert to CSV format
          const csvContent = XLSX.utils.sheet_to_csv(worksheet, { 
            forceQuotes: false
          })
          
          // Process line endings
          const processedContent = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
          
          resolve(processedContent)
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error}`))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read Excel file'))
      reader.readAsArrayBuffer(file)
      return
    }
    
    // Try to parse other text-based files
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        
        // Basic validation
        if (!content || content.trim().length === 0) {
          reject(new Error('File is empty or could not be read'))
          return
        }
        
        // Process content
        let processedContent = content
        if (content.charCodeAt(0) === 0xFEFF) {
          processedContent = content.slice(1)
        }
        processedContent = processedContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        
        resolve(processedContent)
      } catch (error) {
        reject(new Error(`Failed to read file: ${error}`))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'UTF-8')
  })
}

export function formatDate(dateString: string, month: string): string {
  if (!dateString) return ''
  
  // Handle different date formats
  if (dateString.includes('-')) {
    // Already has year-month or year-month-day format
    return dateString
  } else if (dateString.match(/^\d{1,2}$/)) {
    // Just a day number, add month
    return `${month}-${dateString.padStart(2, '0')}`
  } else {
    return dateString
  }
}