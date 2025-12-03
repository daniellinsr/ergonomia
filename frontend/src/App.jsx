import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Layout } from './components/layout/Layout';
import { DashboardAvaliacoes } from './pages/DashboardAvaliacoes';
import { DashboardPlanosAcao } from './pages/DashboardPlanosAcao';
import { Empresas } from './pages/Empresas';
import { Usuarios } from './pages/Usuarios';
import { UnidadesSetores } from './pages/UnidadesSetores';
import { Avaliacoes } from './pages/Avaliacoes';
import { PreencherAvaliacao } from './pages/PreencherAvaliacao';
import { PlanosAcao } from './pages/PlanosAcao';
import { Relatorios } from './pages/Relatorios';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard-avaliacoes" />} />
            <Route path="dashboard-avaliacoes" element={<DashboardAvaliacoes />} />
            <Route path="dashboard-planos-acao" element={<DashboardPlanosAcao />} />
            <Route path="empresas" element={
              <PrivateRoute requireAdmin={true}>
                <Empresas />
              </PrivateRoute>
            } />
            <Route path="usuarios" element={
              <PrivateRoute>
                <Usuarios />
              </PrivateRoute>
            } />

            <Route path="unidades-setores" element={
              <PrivateRoute>
              <UnidadesSetores />
              </PrivateRoute>
              } />

            <Route path="avaliacoes" element={
              <PrivateRoute>
                <Avaliacoes />
              </PrivateRoute>
            } />

            <Route path="avaliacoes/:id/preencher" element={
              <PrivateRoute>
                <PreencherAvaliacao />
              </PrivateRoute>
            } />

            <Route path="planos-acao" element={
              <PrivateRoute>
                <PlanosAcao />
              </PrivateRoute>
            } />

            <Route path="relatorios" element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            } />

          </Route>

          <Route path="*" element={<Navigate to="/dashboard-avaliacoes" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;