import { BarChart, HeatmapChart, LineChart, PieChart, SankeyChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { useEffect, useState } from 'react'
import { SERIES_COLORS } from './chartOptions'

echarts.use([BarChart, LineChart, PieChart, SankeyChart, HeatmapChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

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
  const text = dark ? '#cbd5e1' : '#334155'
  const themed = {
    color: SERIES_COLORS,
    backgroundColor: 'transparent',
    textStyle: { color: text },
    tooltip: { trigger: 'axis', confine: true },
    legend: { textStyle: { color: text }, top: 0, type: 'scroll' },
    ...option,
  }
  return <ReactEChartsCore echarts={echarts} option={themed} notMerge theme={dark ? 'dark' : undefined} style={{ height, width: '100%' }} />
}
