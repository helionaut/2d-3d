import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/PlotCanvas', () => ({
  PlotCanvas: ({
    plot,
    plotTestId,
    onViewportChange,
  }: {
    plot: { data: Array<{ x?: unknown[]; y?: unknown[] }> }
    plotTestId: string
    onViewportChange?: (event: Record<string, unknown>) => void
  }) => (
    <div data-testid={`mock-${plotTestId}`}>
      <span data-testid={`${plotTestId}-series-length`}>
        {Array.isArray(plot.data[0]?.x) ? plot.data[0].x.length : 0}
      </span>
      <button
        type="button"
        onClick={() =>
          onViewportChange?.({
            'xaxis.range[0]': -3,
            'xaxis.range[1]': 3,
            'yaxis.range[0]': -2,
            'yaxis.range[1]': 2,
          })
        }
      >
        Relayout 2D viewport
      </button>
      <button
        type="button"
        onClick={() =>
          onViewportChange?.({
            'xaxis.autorange': true,
            'yaxis.autorange': true,
          })
        }
      >
        Reset 2D viewport
      </button>
    </div>
  ),
}))

let App: typeof import('../../src/App').default

beforeAll(async () => {
  App = (await import('../../src/App')).default
})

describe('App', () => {
  it('shows 2D controls by default and swaps to 3D-specific controls on mode change', () => {
    render(<App />)

    expect(screen.getByRole('textbox', { name: 'Expression' })).toHaveValue('y = sin(x)')
    expect(screen.getByLabelText('X minimum')).toHaveValue(-6.28)
    expect(screen.getByLabelText('Y maximum')).toHaveValue(1.5)
    expect(screen.getByLabelText('Samples')).toHaveValue(241)
    expect(screen.queryByLabelText('Z minimum')).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-plot-2d')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /3D surface/i }))

    expect(screen.getByRole('textbox', { name: 'Expression' })).toHaveValue('z = sin(x) * cos(y)')
    expect(screen.getByLabelText('Z minimum')).toHaveValue(-1.5)
    expect(screen.getByLabelText('X samples')).toHaveValue(96)
    expect(screen.getByLabelText('Y samples')).toHaveValue(96)
    expect(screen.queryByLabelText('Samples')).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-plot-3d')).toBeInTheDocument()
  })

  it('applies formula and shared control changes only after render', () => {
    render(<App />)

    const expressionInput = screen.getByRole('textbox', { name: 'Expression' })
    fireEvent.change(expressionInput, { target: { value: 'x ^ 2' } })
    fireEvent.change(screen.getByLabelText('X minimum'), { target: { value: '-4' } })
    fireEvent.change(screen.getByLabelText('Y maximum'), { target: { value: '20' } })
    fireEvent.change(screen.getByLabelText('Samples'), { target: { value: '101' } })

    expect(screen.getByTestId('rendered-expression-value')).toHaveTextContent('y = sin(x)')
    expect(screen.getByTestId('rendered-x-range')).toHaveTextContent('-6.28 to 6.28')
    expect(screen.getByTestId('rendered-y-range')).toHaveTextContent('-1.50 to 1.50')
    expect(screen.getByTestId('rendered-samples')).toHaveTextContent('241')
    expect(screen.getByTestId('plot-2d-series-length')).toHaveTextContent('241')

    fireEvent.click(screen.getByRole('button', { name: 'Render graph' }))

    expect(screen.getByTestId('rendered-expression-value')).toHaveTextContent('y = x ^ 2')
    expect(screen.getByTestId('rendered-x-range')).toHaveTextContent('-4 to 6.28')
    expect(screen.getByTestId('rendered-y-range')).toHaveTextContent('-1.50 to 20')
    expect(screen.getByTestId('rendered-samples')).toHaveTextContent('101')
    expect(screen.getByTestId('plot-2d-series-length')).toHaveTextContent('101')
  })

  it('resets the active mode back to its default formula and controls', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /3D surface/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Expression' }), {
      target: { value: 'z = x * y' },
    })
    fireEvent.change(screen.getByLabelText('Z minimum'), { target: { value: '-5' } })
    fireEvent.change(screen.getByLabelText('X samples'), { target: { value: '21' } })
    fireEvent.click(screen.getByRole('button', { name: 'Render graph' }))

    fireEvent.click(screen.getByRole('button', { name: 'Reset mode' }))

    expect(screen.getByRole('textbox', { name: 'Expression' })).toHaveValue('z = sin(x) * cos(y)')
    expect(screen.getByTestId('rendered-expression-value')).toHaveTextContent('z = sin(x) * cos(y)')
    expect(screen.getByLabelText('Z minimum')).toHaveValue(-1.5)
    expect(screen.getByLabelText('X samples')).toHaveValue(96)
    expect(screen.getByTestId('rendered-z-range')).toHaveTextContent('-1.50 to 1.50')
    expect(screen.getByTestId('rendered-x-samples')).toHaveTextContent('96')
  })

  it('syncs the 2D controls with viewport relayout and plot reset events', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Relayout 2D viewport' }))

    expect(screen.getByLabelText('X minimum')).toHaveValue(-3)
    expect(screen.getByLabelText('X maximum')).toHaveValue(3)
    expect(screen.getByLabelText('Y minimum')).toHaveValue(-2)
    expect(screen.getByLabelText('Y maximum')).toHaveValue(2)
    expect(screen.getByTestId('rendered-x-range')).toHaveTextContent('-3 to 3')
    expect(screen.getByTestId('rendered-y-range')).toHaveTextContent('-2 to 2')

    fireEvent.click(screen.getByRole('button', { name: 'Reset 2D viewport' }))

    expect(screen.getByLabelText('X minimum')).toHaveValue(-6.28)
    expect(screen.getByLabelText('X maximum')).toHaveValue(6.28)
    expect(screen.getByLabelText('Y minimum')).toHaveValue(-1.5)
    expect(screen.getByLabelText('Y maximum')).toHaveValue(1.5)
    expect(screen.getByTestId('rendered-x-range')).toHaveTextContent('-6.28 to 6.28')
    expect(screen.getByTestId('rendered-y-range')).toHaveTextContent('-1.50 to 1.50')
  })

  it('keeps the last rendered 3D surface active when density settings are invalid', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /3D surface/i }))
    fireEvent.change(screen.getByLabelText('X samples'), { target: { value: '121' } })
    fireEvent.change(screen.getByLabelText('Y samples'), { target: { value: '121' } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Review the highlighted graph controls before rendering.',
    )
    expect(screen.getAllByText(/Combined surface density must stay at or below/i)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Render graph' }))

    expect(screen.getByTestId('rendered-x-samples')).toHaveTextContent('96')
    expect(screen.getByTestId('rendered-y-samples')).toHaveTextContent('96')
  })
})
