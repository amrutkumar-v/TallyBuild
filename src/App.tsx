import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell';
import { EstimatesProvider } from './store/EstimatesProvider';
import { DashboardPage } from './pages/DashboardPage';
import { EstimatesPage } from './pages/EstimatesPage';
import { NewEstimatePage } from './pages/NewEstimatePage';
import { EstimateLayout } from './pages/EstimateLayout';
import { BreakdownPage } from './pages/BreakdownPage';
import { ResultsPage } from './pages/ResultsPage';
import { TimelinePage } from './pages/TimelinePage';
import { WhatIfPage } from './pages/WhatIfPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <EstimatesProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="estimates" element={<EstimatesPage />} />
            <Route path="estimates/new" element={<NewEstimatePage />} />
            <Route path="estimates/:estimateId" element={<EstimateLayout />}>
              <Route index element={<Navigate to="breakdown" replace />} />
              <Route path="breakdown" element={<BreakdownPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="what-if" element={<WhatIfPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </EstimatesProvider>
    </BrowserRouter>
  );
}
