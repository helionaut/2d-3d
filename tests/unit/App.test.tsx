import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/components/PlotCanvas', () => ({
  PlotCanvas: ({ plotTestId }: { plotTestId: string }) => (
    <div data-testid={`mock-${plotTestId}`} />
  ),
}))

let App: typeof import('../../src/App').default

beforeAll(async () => {
  App = (await import('../../src/App')).default
})

describe('App', () => {
  it('stores only the normalized right-hand side for valid 2D input', () => {
    render(<App />)

    expect(screen.getByRole('textbox', { name: 'Formula' })).toHaveValue('y = sin(x)')
    expect(screen.getByTestId('stored-expression-value')).toHaveTextContent('sin(x)')
    expect(screen.getByText(/valid formula/i)).toBeInTheDocument()
    expect(screen.getByTestId('mock-plot-2d')).toBeInTheDocument()
  })

  it('renders inline validation errors and keeps the last valid graph until recovery', () => {
    render(<App />)

    const formulaInput = screen.getByRole('textbox', { name: 'Formula' })
    fireEvent.change(formulaInput, { target: { value: '2x' } })

    expect(screen.getByRole('alert')).toHaveTextContent(/implicit multiplication/i)
    expect(screen.getByText(/showing the last valid graph while you edit/i)).toBeInTheDocument()
    expect(screen.getByTestId('stored-expression-value')).toHaveTextContent('sin(x)')
    expect(screen.getByTestId('mock-plot-2d')).toBeInTheDocument()

    fireEvent.change(formulaInput, { target: { value: 'x ^ 2' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('stored-expression-value')).toHaveTextContent('x ^ 2')
  })

  it('surfaces prefix mismatch errors in 3D mode and recovers after correction', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /3D surface/i }))

    const formulaInput = screen.getByRole('textbox', { name: 'Formula' })
    expect(formulaInput).toHaveValue('z = sin(x) * cos(y)')
    expect(screen.getByTestId('mock-plot-3d')).toBeInTheDocument()

    fireEvent.change(formulaInput, { target: { value: 'y = sin(x) * cos(y)' } })

    expect(screen.getByRole('alert')).toHaveTextContent(/use `z =` in 3D mode/i)
    expect(screen.getByTestId('stored-expression-value')).toHaveTextContent('sin(x) * cos(y)')

    fireEvent.change(formulaInput, { target: { value: 'sin(x) * cos(y)' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('stored-expression-value')).toHaveTextContent('sin(x) * cos(y)')
  })
})
