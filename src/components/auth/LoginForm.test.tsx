import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LoginForm from './LoginForm'

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}))

vi.mock("next-auth/react", () => ({
  signIn: vi.fn()
}))

describe('LoginForm', () => {
  it('renders correctly', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/Email/i)).toBeDefined()
    expect(screen.getByLabelText(/Password/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Login/i })).toBeDefined()
  })
})
