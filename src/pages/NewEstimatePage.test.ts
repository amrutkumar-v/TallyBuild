import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import NewEstimatePage from './NewEstimatePage';
import { EstimatesProvider } from '../store/EstimatesProvider';

function render(): string {
  return renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(EstimatesProvider, null, createElement(NewEstimatePage)),
    ),
  );
}

describe('NewEstimatePage — initial render', () => {
  it('renders exactly one page heading', () => {
    expect(render().match(/<h1/g) ?? []).toHaveLength(1);
  });

  it('renders the required project fields', () => {
    const html = render();
    expect(html).toContain('Project name');
    expect(html).toContain('Scope');
    expect(html).toContain('Category');
    expect(html).toContain('Complexity');
    expect(html).toContain('Currency');
  });

  it('renders the cost-line editors', () => {
    const html = render();
    expect(html).toContain('Personnel');
    expect(html).toContain('Tooling');
    expect(html).toContain('Infrastructure');
    expect(html).toContain('Other costs');
  });

  it('shows the service-check state before the health probe resolves', () => {
    expect(render()).toContain('Checking the estimation service');
  });

  it('disables calculation and fabricates no total while the service is unchecked', () => {
    const html = render();
    expect(html).toContain('Calculate estimate');
    expect(html).toContain('disabled');
    expect(html).not.toContain('Estimated total');
  });
});
