import { BarChart, HeatmapChart, LineChart, PieChart, SankeyChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useRef, useState } from 'react'
import { SERIES_COLORS } from './chartOptions'

// SVG rather than canvas: crisp at any zoom, and it renders under jsdom so the smoke test exercises real charts.
echarts.use([BarChart, LineChart, PieChart, SankeyChart, HeatmapChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

export type ChartOption = echarts.EChartsCoreOption

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)

function useDarkMode() {
  const [dark, setDark] = useState(() => darkQuery()?.matches ?? false)
  useEffect(() => {
    const query = darkQuery()
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    query?.addEventListener('change', onChange)
    return () => query?.removeEventListener('change', onChange)
  }, [])
  return dark
}

export function Chart({ option, height = 320 }: { option: ChartOption; height?: number }) {
  const dark = useDarkMode()
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  // One chart instance per mount (and per theme, since ECharts fixes the theme at init).
  useEffect(() => {
    if (!container.current) return
    const instance = echarts.init(container.current, dark ? 'dark' : undefined, { renderer: 'svg' })
    chart.current = instance
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => instance.resize()) : null
    resize?.observe(container.current)
    return () => {
      resize?.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [dark])

  useEffect(() => {
    const text = dark ? '#cbd5e1' : '#334155'
    chart.current?.setOption(
      {
        color: SERIES_COLORS,
        backgroundColor: 'transparent',
        textStyle: { color: text },
        tooltip: { trigger: 'axis', confine: true },
        legend: { textStyle: { color: text }, top: 0, type: 'scroll' },
        ...option,
      },
      { notMerge: true },
    )
  }, [option, dark])

  return <div ref={container} style={{ height, width: '100%' }} />
}
