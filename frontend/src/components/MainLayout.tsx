import React from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { 
  UserOutlined, TeamOutlined, LogoutOutlined, 
  BankOutlined, DashboardOutlined, ClockCircleOutlined,
  FileProtectOutlined,
  DollarCircleOutlined, StarOutlined, RocketOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get current URL path
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 1. Get Role and Email from LocalStorage (Persist on Refresh)
  const userRole = localStorage.getItem('role');
  const userEmail = localStorage.getItem('email'); 

  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';
  
  // 2. Determine display email: Priority -> LocalStorage -> Store -> Fallback
  const displayEmail = userEmail || user?.email || 'USER';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- DEFINE MENUS BASED ON ROLE ---
  const adminItems = [
    {
      key: '/admin-dashboard',
      icon: <TeamOutlined />,
      label: 'EMPLOYEE DIRECTORY',
    },
    {
      key: '/departments',
      icon: <BankOutlined />,
      label: 'DEPARTMENTS',
    },
    {
      key: '/attendance-admin',
      icon: <ClockCircleOutlined />,
      label: 'ATTENDANCE',
    },
    {
      key: '/leaves-admin',
      icon: <FileProtectOutlined />,
      label: 'LEAVE REQUESTS',
    },
    {
      key: '/payroll-admin',
      icon: <DollarCircleOutlined />,
      label: 'PAYROLL',
    },
    {
      key: '/performance-admin',
      icon: <StarOutlined />,
      label: 'PERFORMANCE',
    },
  ];

  const employeeItems = [
    {
      key: '/employee-dashboard',
      icon: <DashboardOutlined />,
      label: 'MY DASHBOARD',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'MY PROFILE',
    },
    // --- NEW ITEM: MY SALARY ---
    {
      key: '/my-payroll',
      icon: <DollarCircleOutlined />,
      label: 'MY SALARY',
    },
    {
  key: '/my-performance',
  icon: <RocketOutlined />,
  label: 'PERFORMANCE',
},
  ];

  // Select the correct menu set
  const menuItems = isAdmin ? adminItems : employeeItems;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: '#004040' }}>
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          HRMS v1.0
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: '#004040' }}
          // Highlight the menu item matching the current URL
          selectedKeys={[location.pathname]} 
          // Handle Navigation
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      
      <Layout>
        <Header style={{ padding: '0 20px', background: '#c0c0c0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #fff' }}>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {isAdmin ? 'ADMINISTRATOR' : 'EMPLOYEE'}: {displayEmail}
          </div>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            danger
            style={{ fontWeight: 'bold' }}
          >
            TERMINATE SESSION
          </Button>
        </Header>
        
        <Content style={{ margin: '16px', border: '2px solid #888', background: '#e0e0e0' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;