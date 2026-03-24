import type { CSSProperties, ComponentType } from 'react'
import type { Config } from 'plotly.js'
import plotComponentFactoryModule from 'react-plotly.js/factory.js'
import Plotly from 'plotly.js-dist-min'

const createPlotlyComponent = (
  'default' in plotComponentFactoryModule
    ? plotComponentFactoryModule.default
    : plotComponentFactoryModule
) as (plotly: object) => ComponentType<{
  className?: string
  config: Partial<Config>
  data: object[]
  layout: object
  style: CSSProperties
  useResizeHandler?: boolean
}>

const Plot = createPlotlyComponent(Plotly as object)

const plotConfig: Partial<Config> = {
  displayModeBar: false,
  displaylogo: false,
  responsive: true,
  scrollZoom: true,
}

interface PlotCanvasProps {
  plot: {
    data: object[]
    layout: object
  }
  plotTestId: string
}

export function PlotCanvas({ plot, plotTestId }: PlotCanvasProps) {
  return (
    <div className="plot-shell" data-testid={plotTestId}>
      <Plot
        className="plot-canvas"
        config={plotConfig}
        data={plot.data}
        layout={plot.layout}
        style={{ height: '100%', width: '100%' }}
        useResizeHandler
      />
    </div>
  )
}
