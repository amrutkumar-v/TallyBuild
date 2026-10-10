import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { LineItemsEditor } from './LineItemsEditor';
import type { MaterialProduct } from '../../estimation';

type EditorProps = Parameters<typeof LineItemsEditor>[0];

const CEMENT: MaterialProduct = {
  id: 'cement-opc-53-grade',
  name: 'OPC 53 Grade Cement',
  category: 'Cement',
  unit: 'bag',
  unitPrice: 410,
  priceSource: {
    label: 'Illustrative demo data — not a verified market price',
    priceDate: '2026-09-01',
    currency: 'INR',
    isIllustrative: true,
  },
};

function render(overrides: Partial<EditorProps> = {}): string {
  const props: EditorProps = {
    status: 'online',
    products: [],
    lines: [],
    errors: {},
    disabled: false,
    onAddLine: () => {},
    onRemoveLine: () => {},
    onChangeLine: () => {},
    onRetryCatalogue: () => {},
    ...overrides,
  };
  return renderToString(createElement(LineItemsEditor, props));
}

describe('LineItemsEditor', () => {
  it('shows a loading state while the catalogue is fetched', () => {
    expect(render({ status: 'loading' })).toContain('Loading the product catalogue');
  });

  it('renders an empty state when the catalogue has no products', () => {
    expect(render({ status: 'empty' })).toContain('The catalogue is empty');
  });

  it('renders the labelled demo fallback when the service is offline', () => {
    const html = render({ status: 'offline' });

    expect(html).toContain('illustrative demo catalogue');
    expect(html).toContain('live pricing is paused');
    expect(html).not.toContain('Estimated total');
  });

  it('renders a material line with its selected product and quantity', () => {
    const html = render({
      products: [CEMENT],
      lines: [{ id: 'line-1', productId: 'cement-opc-53-grade', quantity: '320' }],
    });

    expect(html).toContain('OPC 53 Grade Cement');
    expect(html).toContain('value="320"');
    expect(html).toContain('Unit: bag');
  });

  it('renders the no-materials empty state when there are no lines', () => {
    expect(render({ products: [CEMENT], lines: [] })).toContain('No materials yet');
  });

  it('renders per-field validation messages', () => {
    const html = render({
      products: [CEMENT],
      lines: [{ id: 'line-1', productId: '', quantity: '' }],
      errors: { 'line-1': { productId: 'Choose a product.', quantity: 'Enter a quantity.' } },
    });

    expect(html).toContain('Choose a product.');
    expect(html).toContain('Enter a quantity.');
  });
});
