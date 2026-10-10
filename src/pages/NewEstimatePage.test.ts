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
    expect(html).toContain('Location');
    expect(html).toContain('Project type');
    expect(html).toContain('Scope notes');
  });

  it('shows the catalogue loading state before the service responds', () => {
    expect(render()).toContain('Loading the product catalogue');
  });

  it('disables calculation and fabricates no total while the catalogue loads', () => {
    const html = render();
    expect(html).toContain('Calculate estimate');
    expect(html).toContain('disabled');
    expect(html).not.toContain('Estimated total');
  });
});
