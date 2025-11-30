import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary shadow-lg z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-white hover:bg-primary-light p-2 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-white text-xl font-bold"></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-white text-right hidden md:block">
            <p className="font-semibold">{user?.nome}</p>
            <p className="text-sm opacity-90">{user?.razao_social}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            
            <button
              onClick={handleLogout}
              className="text-white hover:bg-primary-light p-2 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};