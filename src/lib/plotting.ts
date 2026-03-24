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

export interface SurfaceSamplingResult {
  xValues: number[]
  yValues: number[]
  zValues: Array<Array<number | null>>
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
  const surface = evaluateSurfaceSamples(result, controls)

  return {
    plotTestId: 'plot-3d',
    title: '3D surface',
    description: MODE_DEFINITIONS['3d'].description,
    interactionHint: 'Drag to rotate and use the wheel or trackpad to zoom.',
    notice: surface.notice,
    plot: {
      data: [
        {
          type: 'surface',
          x: surface.xValues,
          y: surface.yValues,
          z: surface.zValues,
          colorscale: [
            [0, '#0a4a6f'],
            [0.45, '#5aa9e6'],
            [0.5, '#f4e8c1'],
            [1, '#ecb737'],
          ],
          hovertemplate: 'x=%{x:.2f}<br>y=%{y:.2f}<br>z=%{z:.2f}<extra></extra>',
        },
        createOrientationTrace('x', controls),
        createOrientationTrace('y', controls),
        createOrientationTrace('z', controls),
        createOriginTrace(controls),
      ],
      layout: {
        margin: { l: 0, r: 0, t: 28, b: 0 },
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        uirevision: `${controls.x.min}:${controls.x.max}:${controls.y.min}:${controls.y.max}:${controls.z.min}:${controls.z.max}`,
        scene: {
          bgcolor: 'rgba(255, 255, 255, 0.72)',
          dragmode: 'orbit',
          camera: {
            eye: { x: 1.65, y: 1.5, z: 0.9 },
          },
          xaxis: {
            title: { text: 'x' },
            range: [controls.x.min, controls.x.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
            showspikes: false,
            zerolinecolor: '#0a4a6f',
          },
          yaxis: {
            title: { text: 'y' },
            range: [controls.y.min, controls.y.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
            showspikes: false,
            zerolinecolor: '#2f6f4f',
          },
          zaxis: {
            title: { text: 'z' },
            range: [controls.z.min, controls.z.max],
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
            showspikes: false,
            zerolinecolor: '#b67611',
          },
          aspectratio: { x: 1.1, y: 1.1, z: 0.7 },
        },
      },
    },
  }
}

export function evaluateSurfaceSamples(
  result: ExpressionValidationSuccess,
  controls: PlotControls3D,
): SurfaceSamplingResult {
  const xValues = sampleLinear(controls.x.min, controls.x.max, controls.xSamples)
  const yValues = sampleLinear(controls.y.min, controls.y.max, controls.ySamples)

  try {
    return {
      xValues,
      yValues,
      zValues: yValues.map((y) =>
        xValues.map((x) =>
          sanitizeValue(
            evaluateExpressionAst(result.ast, {
              x,
              y,
              parameterValues: result.parameterValues,
            }),
          ),
        ),
      ),
    }
  } catch {
    return {
      xValues,
      yValues,
      zValues: yValues.map(() => xValues.map(() => null)),
      notice:
        'Unable to evaluate this surface across the current x/y ranges. Adjust the expression, parameters, or viewport and try again.',
    }
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

function createOrientationTrace(axis: 'x' | 'y' | 'z', controls: PlotControls3D): Partial<Data> {
  const anchorX = clampToRange(0, controls.x.min, controls.x.max)
  const anchorY = clampToRange(0, controls.y.min, controls.y.max)
  const anchorZ = clampToRange(0, controls.z.min, controls.z.max)

  if (axis === 'x') {
    return {
      type: 'scatter3d',
      mode: 'lines',
      x: [controls.x.min, controls.x.max],
      y: [anchorY, anchorY],
      z: [anchorZ, anchorZ],
      line: { color: '#0a4a6f', width: 7 },
      hoverinfo: 'skip',
      showlegend: false,
    }
  }

  if (axis === 'y') {
    return {
      type: 'scatter3d',
      mode: 'lines',
      x: [anchorX, anchorX],
      y: [controls.y.min, controls.y.max],
      z: [anchorZ, anchorZ],
      line: { color: '#2f6f4f', width: 7 },
      hoverinfo: 'skip',
      showlegend: false,
    }
  }

  return {
    type: 'scatter3d',
    mode: 'lines',
    x: [anchorX, anchorX],
    y: [anchorY, anchorY],
    z: [controls.z.min, controls.z.max],
    line: { color: '#b67611', width: 7 },
    hoverinfo: 'skip',
    showlegend: false,
  }
}

function createOriginTrace(controls: PlotControls3D): Partial<Data> {
  return {
    type: 'scatter3d',
    mode: 'markers',
    x: [clampToRange(0, controls.x.min, controls.x.max)],
    y: [clampToRange(0, controls.y.min, controls.y.max)],
    z: [clampToRange(0, controls.z.min, controls.z.max)],
    marker: {
      color: '#1f2a30',
      size: 4,
    },
    hovertemplate: 'orientation origin<extra></extra>',
    showlegend: false,
  }
}

function clampToRange(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}
