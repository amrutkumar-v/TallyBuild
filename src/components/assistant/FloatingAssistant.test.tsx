import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FloatingAssistant } from './FloatingAssistant';
import { makeContext, makeEstimate, makeResult, renderWithEstimates } from '../../test/estimates';

async function fillOverview(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: /Estimate a food delivery app/i }));
  await user.type(screen.getByLabelText(/What should I call this estimate/i), 'Delivery app');
  await user.click(screen.getByRole('button', { name: /^Send$/ }));
  await user.click(screen.getByRole('button', { name: /Web application/i }));
}

async function reachRateStep(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await fillOverview(user);
  await user.type(screen.getByLabelText(/How many people will deliver it/i), '4');
  await user.click(screen.getByRole('button', { name: /^Send$/ }));
  await user.click(screen.getByRole('button', { name: /In-house team, India/i }));
  await user.click(screen.getByRole('button', { name: /well understood/i }));
}

async function fillInputs(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await reachRateStep(user);
  await user.type(screen.getByLabelText(/What blended cost per person-day/i), '9000');
  await user.click(screen.getByRole('button', { name: /^Send$/ }));
}

async function reachReview(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await fillInputs(user);
  await user.click(screen.getByRole('button', { name: /^Skip$/ }));
}

describe('FloatingAssistant launcher', () => {
  it('renders a labelled launcher and opens the dialog with welcome + suggestions', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);

    const launcher = screen.getByRole('button', {
      name: /open the tallybuild estimation assistant/i,
    });
    expect(launcher).toBeInTheDocument();

    await user.click(launcher);

    expect(screen.getByRole('dialog', { name: /tallybuild estimation assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estimate a food delivery app/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plan a college management system/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estimate a SaaS dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Help me define my project requirements/i })).toBeInTheDocument();
  });

  it('closes via the close button and Escape, restoring the launcher', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await user.click(screen.getByRole('button', { name: /close assistant/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('FloatingAssistant guided flow', () => {
  it('a suggested prompt starts the same guided workflow', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));

    await user.click(screen.getByRole('button', { name: /Estimate a SaaS dashboard/i }));

    expect(screen.getByLabelText(/What should I call this estimate/i)).toBeInTheDocument();
  });

  it('shows a validation error and does not advance for an incomplete brief', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));

    await user.type(screen.getByLabelText(/Tell me about the software/i), 'too short');
    await user.click(screen.getByRole('button', { name: /^Send$/ }));

    expect(screen.getByRole('alert')).toHaveTextContent(/more detail/i);
    expect(screen.getByLabelText(/Tell me about the software/i)).toBeInTheDocument();
  });

  it('sends a text field with the Enter key', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await user.click(screen.getByRole('button', { name: /Estimate a SaaS dashboard/i }));

    const nameInput = screen.getByLabelText(/What should I call this estimate/i);
    await user.type(nameInput, 'SaaS dashboard{Enter}');

    expect(screen.getByRole('button', { name: /Web application/i })).toBeInTheDocument();
  });

  it('offers the supported currencies at the rate step', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await reachRateStep(user);

    const currency = screen.getByLabelText('Currency');
    for (const code of ['INR', 'USD', 'EUR', 'AED']) {
      expect(within(currency).getByRole('option', { name: code })).toBeInTheDocument();
    }
  });

  it('can navigate back to a previous question', async () => {
    const user = userEvent.setup();
    renderWithEstimates(<FloatingAssistant />);
    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await user.click(screen.getByRole('button', { name: /Estimate a SaaS dashboard/i }));

    await user.click(screen.getByRole('button', { name: /^Back$/ }));

    expect(screen.getByLabelText(/Tell me about the software/i)).toBeInTheDocument();
  });
});

describe('FloatingAssistant calculation', () => {
  it('renders the values returned by the estimation service', async () => {
    const user = userEvent.setup();
    const createEstimate = vi.fn(async () => makeEstimate({ id: 'est-9' }));
    renderWithEstimates(<FloatingAssistant />, makeContext({ createEstimate }));

    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await reachReview(user);
    await user.click(screen.getByRole('button', { name: /Calculate estimate/i }));

    expect(await screen.findByText('Likely total')).toBeInTheDocument();
    expect(screen.getAllByText('₹4,50,000').length).toBeGreaterThan(0);
    expect(createEstimate).toHaveBeenCalledTimes(1);
  });

  it('renders live API results when the source is the API', async () => {
    const user = userEvent.setup();
    const runEstimate = vi.fn(async () =>
      makeEstimate({
        id: 'est-api',
        result: makeResult({ source: 'api', currency: 'USD', cost: { low: 1000, likely: 2000, high: 3000 } }),
      }),
    );
    renderWithEstimates(<FloatingAssistant />, makeContext({ runEstimate }));

    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await reachReview(user);
    await user.click(screen.getByRole('button', { name: /Calculate estimate/i }));

    expect(await screen.findByText('Live API')).toBeInTheDocument();
    expect(screen.getAllByText('$2,000').length).toBeGreaterThan(0);
  });

  it('surfaces a backend-unavailable error and offers a retry', async () => {
    const user = userEvent.setup();
    const createEstimate = vi.fn(async () => {
      throw new Error('Estimation service unavailable');
    });
    renderWithEstimates(<FloatingAssistant />, makeContext({ createEstimate }));

    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await reachReview(user);
    await user.click(screen.getByRole('button', { name: /Calculate estimate/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Estimation service unavailable/i);
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to review/i })).toBeInTheDocument();
  });

  it('does not submit twice when Calculate is clicked repeatedly', async () => {
    const user = userEvent.setup();
    let resolveCreate: ((value: ReturnType<typeof makeEstimate>) => void) | undefined;
    const createEstimate = vi.fn(
      () =>
        new Promise<ReturnType<typeof makeEstimate>>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderWithEstimates(<FloatingAssistant />, makeContext({ createEstimate }));

    await user.click(screen.getByRole('button', { name: /open the tallybuild/i }));
    await reachReview(user);

    const calculate = screen.getByRole('button', { name: /Calculate estimate/i });
    await user.click(calculate);
    await user.click(calculate);

    expect(createEstimate).toHaveBeenCalledTimes(1);
    resolveCreate?.(makeEstimate({ id: 'est-once' }));
    expect(await screen.findByText('Likely total')).toBeInTheDocument();
  });
});
