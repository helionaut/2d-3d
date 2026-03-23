import type { Data, Layout } from 'plotly.js'

export interface GraphFixture {
  id: string
  mode: '2D' | '3D'
  title: string
  expression: string
  summary: string
  interactionNote: string
  samplingNote: string
  plotTestId: string
  plot: {
    data: Partial<Data>[]
    layout: Partial<Layout>
  }
}

const tau = Math.PI * 2

function sampleLinear(start: number, end: number, count: number) {
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, index) => start + step * index)
}

const lineX = sampleLinear(-tau, tau, 241)
const lineY = lineX.map((x) => Math.sin(x))

const surfaceAxis = sampleLinear(-Math.PI, Math.PI, 33)
const surfaceZ = surfaceAxis.map((y) =>
  surfaceAxis.map((x) => Math.sin(x) * Math.cos(y)),
)

export const graphFixtures: GraphFixture[] = [
  {
    id: 'canonical-2d',
    mode: '2D',
    title: 'Sinusoidal curve baseline',
    expression: 'y = sin(x)',
    summary:
      'The spike confirms the chosen stack can render a smooth interactive curve against visible axes.',
    interactionNote: 'Drag to pan, then zoom with wheel or trackpad pinch.',
    samplingNote: '241 line samples over x ∈ [-2π, 2π].',
    plotTestId: 'plot-2d',
    plot: {
      data: [
        {
          type: 'scatter',
          mode: 'lines',
          x: lineX,
          y: lineY,
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
          range: [-1.5, 1.5],
          zeroline: true,
          zerolinecolor: '#c9cfcb',
          gridcolor: '#d9dfdb',
        },
      },
    },
  },
  {
    id: 'canonical-3d',
    mode: '3D',
    title: 'Surface rendering baseline',
    expression: 'z = sin(x) * cos(y)',
    summary:
      'The same frontend stack also renders a manipulable WebGL surface with distinct peaks and valleys.',
    interactionNote: 'Drag to rotate the camera, then zoom with wheel or trackpad pinch.',
    samplingNote: '33 × 33 surface samples over x,y ∈ [-π, π].',
    plotTestId: 'plot-3d',
    plot: {
      data: [
        {
          type: 'surface',
          x: surfaceAxis,
          y: surfaceAxis,
          z: surfaceZ,
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
            backgroundcolor: 'rgba(10, 74, 111, 0.02)',
            gridcolor: '#cfd8dd',
          },
          yaxis: {
            title: { text: 'y' },
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
  },
]

export const invalidExpressionFixture = {
  expression: 'sin()',
  summary:
    'Reserved invalid-input placeholder for future parser tickets and validation UX tests.',
}
