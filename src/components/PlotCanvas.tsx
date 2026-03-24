import type { CSSProperties, ComponentType } from 'react'
import type { Config } from 'plotly.js'
import plotComponentFactoryModule from 'react-plotly.js/factory.js'
import Plotly from 'plotly.js-dist-min'

import type { PlotViewportRelayoutEvent } from '../lib/graphControls'

const createPlotlyComponent = (
  'default' in plotComponentFactoryModule
    ? plotComponentFactoryModule.default
    : plotComponentFactoryModule
) as (plotly: object) => ComponentType<{
  className?: string
  config: Partial<Config>
  data: object[]
  layout: object
  onRelayout?: (event: PlotViewportRelayoutEvent) => void
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
  onViewportChange?: (event: PlotViewportRelayoutEvent) => void
}

export function PlotCanvas({ plot, plotTestId, onViewportChange }: PlotCanvasProps) {
  return (
    <div className="plot-shell" data-testid={plotTestId}>
      <Plot
        className="plot-canvas"
        config={plotConfig}
        data={plot.data}
        layout={plot.layout}
        onRelayout={onViewportChange}
        style={{ height: '100%', width: '100%' }}
        useResizeHandler
      />
    </div>
  )
}
