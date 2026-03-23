import type { CSSProperties, ComponentType } from 'react'
import type { Config } from 'plotly.js'
import plotComponentFactoryModule from 'react-plotly.js/factory.js'
import Plotly from 'plotly.js-dist-min'

import type { GraphFixture } from '../../fixtures/graphFixtures'

const createPlotlyComponent = (
  'default' in plotComponentFactoryModule
    ? plotComponentFactoryModule.default
    : plotComponentFactoryModule
) as (plotly: object) => ComponentType<{
  className?: string
  config: Partial<Config>
  data: GraphFixture['plot']['data']
  layout: GraphFixture['plot']['layout']
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
  fixture: GraphFixture
}

export function PlotCanvas({ fixture }: PlotCanvasProps) {
  return (
    <div className="plot-shell" data-testid={fixture.plotTestId}>
      <Plot
        className="plot-canvas"
        config={plotConfig}
        data={fixture.plot.data}
        layout={fixture.plot.layout}
        style={{ height: '100%', width: '100%' }}
        useResizeHandler
      />
    </div>
  )
}
