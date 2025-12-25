import { useEffect, useRef } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

export interface ShepherdStepConfig {
  id: string
  title: string
  text: string
  attachTo: {
    element: string
    on: 'top' | 'bottom' | 'left' | 'right'
  }
  buttons?: Array<{
    text: string
    action: (tour: InstanceType<typeof Shepherd.Tour>) => void
  }>
}

export interface UseShepherdTourOptions {
  steps: ShepherdStepConfig[]
  zIndex?: number
  fontSize?: number
  titleFontSize?: number
  showArrow?: boolean
}

export function useShepherdTour(options: UseShepherdTourOptions) {
  const { 
    steps, 
    zIndex = 2147483647, 
    fontSize = 14, 
    titleFontSize = 16,
    showArrow = false
  } = options
  
  const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null)

  const startTour = () => {
    if (tourRef.current) {
      tourRef.current.cancel()
    }

    // 设置 shepherd.js 的 z-index 高于面板
    // 先移除可能存在的旧样式
    const existingStyle = document.getElementById('shepherd-z-index-override')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    const style = document.createElement('style')
    style.id = 'shepherd-z-index-override'
    style.textContent = `
      .shepherd-element,
      .shepherd-modal-overlay-container,
      .shepherd-element[data-shepherd-step] {
        z-index: ${zIndex} !important;
      }
      .shepherd-element {
        font-size: ${fontSize}px !important;
      }
      .shepherd-element .shepherd-text {
        font-size: ${fontSize}px !important;
        line-height: 1.5 !important;
      }
      .shepherd-element .shepherd-title {
        font-size: ${titleFontSize}px !important;
        font-weight: 600 !important;
      }
    `
    // 确保样式在最后加载，覆盖其他样式
    document.head.appendChild(style)

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true
        },
        classes: 'shepherd-theme-arrows',
        scrollTo: { behavior: 'smooth', block: 'center' },
        arrow: showArrow
      },
      useModalOverlay: true
    })

    // 当 tour 完成或取消时，移除样式
    tour.on('complete', () => {
      const styleEl = document.getElementById('shepherd-z-index-override')
      if (styleEl) styleEl.remove()
    })
    tour.on('cancel', () => {
      const styleEl = document.getElementById('shepherd-z-index-override')
      if (styleEl) styleEl.remove()
    })

    // 添加所有步骤
    steps.forEach((stepConfig) => {
      tour.addStep({
        id: stepConfig.id,
        title: stepConfig.title,
        text: stepConfig.text,
        attachTo: stepConfig.attachTo,
        buttons: (stepConfig.buttons || []).map(btn => ({
          ...btn,
          // shepherd.js 的 action 函数会自动绑定 this 为 tour 实例
          // 所以我们需要将传入的函数转换为使用 this 的函数
          action: btn.action ? function(this: InstanceType<typeof Shepherd.Tour>) {
            // 调用原始函数，传入 this（即 tour 实例）
            btn.action(this)
          } : undefined
        }))
      })
    })

    tourRef.current = tour
    tour.start()
  }

  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.cancel()
      }
      const styleEl = document.getElementById('shepherd-z-index-override')
      if (styleEl) styleEl.remove()
    }
  }, [])

  return { startTour }
}

