import { createRoot } from 'react-dom/client'
import { MonthlyConsume } from './views/monthly-consume'
import { CreateTaskPanel } from './views/create-task-panel'

function App() {
  return (
    <>
      <CreateTaskPanel />
      <MonthlyConsume />
    </>
  )
}

function mount() {
  // 只在主窗口中挂载，避免在iframe中重复挂载
  if (window.self !== window.top) {
    console.log('ZenTao userscript: Skip mounting in iframe')
    return
  }

  const containerId = 'zentao-userscript-container'

  // 清理所有已存在的容器（处理HMR重载）
  const existingContainers = document.querySelectorAll(`#${containerId}`)
  existingContainers.forEach(el => el.remove())

  const container = document.createElement('div')
  container.id = containerId
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(<App />)
}

// 确保DOM加载完成后再挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}


