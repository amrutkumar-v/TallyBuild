import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/layout/AppShell';
import { EstimatesProvider } from './store/EstimatesProvider';
import ComparisonPage from './pages/ComparisonPage';
import DashboardPage from './pages/DashboardPage';
import EstimatesPage from './pages/EstimatesPage';
import NewEstimatePage from './pages/NewEstimatePage';
import NotFoundPage from './pages/NotFoundPage';
import WhatIfPage from './pages/WhatIfPage';

export default function App() {
  return (
    <EstimatesProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="estimates" element={<EstimatesPage />} />
            <Route path="comparison" element={<ComparisonPage />} />
            <Route path="what-if" element={<WhatIfPage />} />
            <Route path="new-estimate" element={<NewEstimatePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EstimatesProvider>
  );
}
