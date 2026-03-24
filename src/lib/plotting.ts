import type { Data, Layout } from 'plotly.js'

import {
  MODE_DEFINITIONS,
  evaluateExpressionAst,
  type ExpressionValidationSuccess,
} from './expression'
import type { PlotControls2D, PlotControls3D, PlotControlsByMode } from './graphControls'

export interface PlotModel {
  plotTestId: string
  title: string
  description: string
  interactionHint: string
  notice?: string
  plot: {
    data: Partial<Data>[]
    layout: Partial<Layout>
  }
}

export interface CurveSamplingResult {
  xValues: number[]
  yValues: Array<number | null>
  notice?: string
}

export function buildPlotModel<Mode extends keyof PlotControlsByMode>(
  result: ExpressionValidationSuccess & { mode: Mode },
  controls: PlotControlsByMode[Mode],
): PlotModel {
  return result.mode === '2d'
    ? buildCurvePlot(result, controls as PlotControls2D)
    : buildSurfacePlot(result, controls as PlotControls3D)
}

function buildCurvePlot(result: ExpressionValidationSuccess, controls: PlotControls2D): PlotModel {
  const curve = evaluateCurveSamples(result, controls)

  return {
    plotTestId: 'plot-2d',
    title: '2D curve',
    description: MODE_DEFINITIONS['2d'].description,
    interactionHint: 'Drag to pan and use the wheel or trackpad to zoom.',
    notice: curve.notice,
    plot: {
      data: [
        {
          type: 'scatter',
          mode: 'lines',
          x: curve.xValues,
          y: curve.yValues,
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
          range: [controls.x.min, controls.x.max],
          zeroline: true,
          zerolinecolor: '#c9cfcb',
          gridcolor: '#d9dfdb',
        },
        yaxis: {
          title: { text: 'y' },
          range: [controls.y.min, controls.y.max],
          zeroline: true,
          zerolinecolor: '#c9cfcb',
          gridcolor: '#d9dfdb',
        },
      },
    },
  }
}

function buildSurfacePlot(result: ExpressionValidationSuccess, controls: PlotControls3D): PlotModel {
  const xValues = sampleLinear(controls.x.min, controls.x.max, controls.xSamples)
  const yValues = sampleLinear(controls.y.min, controls.y.max, controls.ySamples)
  const zValues = yValues.map((y) =>
    xValues.map((x) =>
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
    title: '3D surface',
    description: MODE_DEFINITIONS['3d'].description,
    interactionHint: 'Drag to rotate and use the wheel or trackpad to zoom.',
    plot: {
      data: [
        {
          type: 'surface',
          x: xValues,
          y: yValues,
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
            range: [controls.x.min, controls.x.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          yaxis: {
            title: { text: 'y' },
            range: [controls.y.min, controls.y.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          zaxis: {
            title: { text: 'z' },
            range: [controls.z.min, controls.z.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          aspectratio: { x: 1.1, y: 1.1, z: 0.7 },
        },
      },
    },
  }
}

export function evaluateCurveSamples(
  result: ExpressionValidationSuccess,
  controls: PlotControls2D,
): CurveSamplingResult {
  const xValues = sampleLinear(controls.x.min, controls.x.max, controls.samples)

  try {
    return {
      xValues,
      yValues: xValues.map((x) =>
        sanitizeValue(
          evaluateExpressionAst(result.ast, {
            x,
            parameterValues: result.parameterValues,
          }),
        ),
      ),
    }
  } catch {
    return {
      xValues,
      yValues: xValues.map(() => null),
      notice:
        'Unable to evaluate this curve across the current x range. Adjust the expression, parameters, or viewport and try again.',
    }
  }
}

export function sampleLinear(start: number, end: number, count: number): number[] {
  if (count <= 1) {
    return [start]
  }

  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + step * index)
}

function sanitizeValue(value: number): number | null {
  return Number.isFinite(value) ? value : null
}
