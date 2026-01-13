import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Tabs, Typography } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Track which tab is active: 'employee' or 'admin'
  const [activePortal, setActivePortal] = useState('employee');

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Send the activePortal along with email and password
      const { data } = await api.post('/auth/login', { 
        ...values, 
        portal: activePortal 
      });
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('email', data.user.email);

      message.success(`Welcome back!`);

      if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'HR_ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = ({ roleName }: { roleName: string }) => (
    <Form name={`login_${roleName.toLowerCase()}`} onFinish={onFinish} layout="vertical">
      <Form.Item 
        name="email" 
        rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Enter a valid email' }]}
      >
        <Input size="large" prefix={<UserOutlined />} placeholder={`${roleName} Email`} />
      </Form.Item>
      <Form.Item 
        name="password" 
        rules={[{ required: true, message: 'Please input your Password!' }]}
      >
        <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
          LOGIN TO {roleName.toUpperCase()} PORTAL
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #d9d9d9 100%)' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0 }}>HRMS Portal v1.0</Title>
          <Text type="secondary">Identify your role to access your dashboard</Text>
        </div>

        <Tabs
          defaultActiveKey="employee"
          centered
          onChange={(key) => setActivePortal(key)} // Update state on tab click
          items={[
            {
              key: 'employee',
              label: (<span><TeamOutlined /> Employee</span>),
              children: <LoginForm roleName="Employee" />,
            },
            {
              key: 'admin',
              label: (<span><SafetyCertificateOutlined /> Admin</span>),
              children: <LoginForm roleName="Admin" />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Login;