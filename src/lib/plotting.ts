import type { Data, Layout } from 'plotly.js'

import {
  MODE_DEFINITIONS,
  evaluateExpressionAst,
  type ExpressionValidationSuccess,
} from './expression'

export interface PlotModel {
  plotTestId: string
  title: string
  description: string
  interactionHint: string
  plot: {
    data: Partial<Data>[]
    layout: Partial<Layout>
  }
}

const tau = Math.PI * 2
const curveSamples = 241
const surfaceSamples = 33

export function buildPlotModel(result: ExpressionValidationSuccess): PlotModel {
  return result.mode === '2d'
    ? buildCurvePlot(result)
    : buildSurfacePlot(result)
}

function buildCurvePlot(result: ExpressionValidationSuccess): PlotModel {
  const xValues = sampleLinear(-tau, tau, curveSamples)
  const yValues = xValues.map((x) =>
    sanitizeValue(
      evaluateExpressionAst(result.ast, {
        x,
        parameterValues: result.parameterValues,
      }),
    ),
  )
  const finiteValues = yValues.filter((value): value is number => value !== null)
  const yRange = calculateRange(finiteValues)

  return {
    plotTestId: 'plot-2d',
    title: '2D curve preview',
    description: MODE_DEFINITIONS['2d'].description,
    interactionHint: 'Drag to pan and use the wheel or trackpad to zoom.',
    plot: {
      data: [
        {
          type: 'scatter',
          mode: 'lines',
          x: xValues,
          y: yValues,
          line: {
            color: '#0a4a6f',
            width: 4,
          },
          hovertemplate: 'x=%{x:.2f}<br>y=%{y:.2f}<extra></extra>',
        },
      ],
      layout: {
        dragmode: 'pan',
        margin: { l: 56, r: 24, t: 28, b: 52 },
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        plot_bgcolor: 'rgba(255, 255, 255, 0.72)',
        xaxis: {
          title: { text: 'x' },
          range: [-tau, tau],
          zeroline: true,
          zerolinecolor: '#c9cfcb',
          gridcolor: '#d9dfdb',
        },
        yaxis: {
          title: { text: 'y' },
          zeroline: true,
          zerolinecolor: '#c9cfcb',
          gridcolor: '#d9dfdb',
          ...(yRange ? { range: yRange } : {}),
        },
      },
    },
  }
}

function buildSurfacePlot(result: ExpressionValidationSuccess): PlotModel {
  const axisValues = sampleLinear(-Math.PI, Math.PI, surfaceSamples)
  const zValues = axisValues.map((y) =>
    axisValues.map((x) =>
      sanitizeValue(
        evaluateExpressionAst(result.ast, {
          x,
          y,
          parameterValues: result.parameterValues,
        }),
      ),
    ),
  )

  return {
    plotTestId: 'plot-3d',
    title: '3D surface preview',
    description: MODE_DEFINITIONS['3d'].description,
    interactionHint: 'Drag to rotate and use the wheel or trackpad to zoom.',
    plot: {
      data: [
        {
          type: 'surface',
          x: axisValues,
          y: axisValues,
          z: zValues,
          colorscale: [
            [0, '#0a4a6f'],
            [0.45, '#5aa9e6'],
            [0.5, '#f4e8c1'],
            [1, '#ecb737'],
          ],
          hovertemplate: 'x=%{x:.2f}<br>y=%{y:.2f}<br>z=%{z:.2f}<extra></extra>',
        },
      ],
      layout: {
        margin: { l: 0, r: 0, t: 28, b: 0 },
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        scene: {
          bgcolor: 'rgba(255, 255, 255, 0.72)',
          camera: {
            eye: { x: 1.65, y: 1.5, z: 0.9 },
          },
          xaxis: {
            title: { text: 'x' },
            range: [-Math.PI, Math.PI],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          yaxis: {
            title: { text: 'y' },
            range: [-Math.PI, Math.PI],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          zaxis: {
            title: { text: 'z' },
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          aspectratio: { x: 1.1, y: 1.1, z: 0.7 },
        },
      },
    },
  }
}

function sampleLinear(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + step * index)
}

function sanitizeValue(value: number): number | null {
  return Number.isFinite(value) ? value : null
}

function calculateRange(values: number[]): [number, number] | undefined {
  if (values.length === 0) {
    return undefined
  }

  const minimum = Math.min(...values)
  const maximum = Math.max(...values)

  if (minimum === maximum) {
    return [minimum - 1, maximum + 1]
  }

  const padding = (maximum - minimum) * 0.12
  return [minimum - padding, maximum + padding]
}
