/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createI18nForTest } from '@/lib/i18n'
import { EntityFormSheet } from './entity-form'
import type { FieldConfig } from './field-config'

afterEach(() => cleanup())

const fields: FieldConfig[] = [
  {
    name: 'label',
    label: 'Libellé',
    type: 'text',
    required: true,
    help: 'Libellé public',
  },
  {
    name: 'zones',
    label: 'Zones',
    type: 'checklist',
    required: true,
    help: 'Choisissez au moins une zone',
    options: [
      { label: 'Douala', value: 'DLA' },
      { label: 'Yaoundé', value: 'YDE' },
    ],
  },
]

function renderForm() {
  const onSubmit = vi.fn()
  render(
    <I18nextProvider i18n={createI18nForTest('fr')}>
      <EntityFormSheet
        open
        onOpenChange={vi.fn()}
        fields={fields}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        title='Créer une zone'
      />
    </I18nextProvider>,
  )
  return { onSubmit }
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }))
}

describe('EntityForm accessibility', () => {
  it('marks a required input invalid and describes it with its help and error', async () => {
    renderForm()
    submit()

    const input = await screen.findByLabelText('Libellé')
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    expect(input.getAttribute('aria-describedby')).toBe('field-label-help field-label-error')
    expect(document.getElementById('field-label-error')).toHaveTextContent('Champ requis')
  })

  it('does not mark a valid input invalid', () => {
    renderForm()
    expect(screen.getByLabelText('Libellé')).not.toHaveAttribute('aria-invalid')
  })

  it('focuses the first invalid input once the form has re-rendered', async () => {
    renderForm()
    submit()

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Libellé'))
    })
  })

  it('exposes the checklist as a named group described by its help and error', async () => {
    renderForm()
    submit()

    const group = await screen.findByRole('group', { name: 'Zones' })
    await waitFor(() => expect(group).toHaveAttribute('aria-invalid', 'true'))
    expect(group.getAttribute('aria-describedby')).toBe('field-zones-help field-zones-error')
  })

  it('describes every checklist checkbox with the field help and error', async () => {
    renderForm()
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText('Douala')).toHaveAttribute(
        'aria-describedby',
        'field-zones-help field-zones-error',
      )
    })
    expect(screen.getByLabelText('Yaoundé').getAttribute('aria-describedby')).toBe(
      'field-zones-help field-zones-error',
    )
  })

  it('focuses the first checklist checkbox when the checklist is the only invalid field', async () => {
    render(
      <I18nextProvider i18n={createI18nForTest('fr')}>
        <EntityFormSheet
          open
          onOpenChange={vi.fn()}
          fields={[fields[1]!]}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          title='Créer une zone'
        />
      </I18nextProvider>,
    )
    submit()

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Douala'))
    })
  })

  it('does not call onSubmit while the form is invalid', async () => {
    const { onSubmit } = renderForm()
    submit()

    await waitFor(() => expect(screen.getByText('Champ requis')).toBeInTheDocument())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
