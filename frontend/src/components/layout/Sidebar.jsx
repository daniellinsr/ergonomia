import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ClipboardCheck, 
  FileText,
  Settings,
  Building,
  UserCheck,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/avaliacoes', icon: ClipboardCheck, label: 'Avaliações' },
    { path: '/planos-acao', icon: Target, label: 'Planos de Ação' },
    { path: '/unidades-setores', icon: Building, label: 'Unidades e Setores' },
    { path: '/trabalhadores', icon: UserCheck, label: 'Trabalhadores' }, // ADICIONAR ESTA LINHA
    { path: '/relatorios', icon: FileText, label: 'Relatórios' },
  ];

  // Items apenas para admin
  if (user?.perfil === 'administrador') {
    menuItems.push(
      { path: '/empresas', icon: Building2, label: 'Empresas' },
      { path: '/usuarios', icon: Users, label: 'Usuários' },
      { path: '/configuracoes', icon: Settings, label: 'Configurações' }
    );
  }

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } w-64 z-40`}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-secondary-light'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};