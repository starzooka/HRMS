import React, { useEffect, useState } from 'react';
import { Card, Avatar, Row, Col, Tag, Spin, Alert, message, Typography, Space } from 'antd';
import { 
  UserOutlined, MailOutlined, BankOutlined, 
  CalendarOutlined, SolutionOutlined, NumberOutlined,
  CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // --- REUSABLE COMPONENT FOR DATA FIELDS ---
  const InfoBlock = ({ icon, label, value, isTag = false }: any) => (
    <div style={{ marginBottom: 24 }}>
      <Space align="center" style={{ color: '#8c8c8c', marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </Space>
      <div style={{ paddingLeft: 22 }}>
        {isTag ? value : <Text strong style={{ fontSize: '16px' }}>{value}</Text>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" tip="Loading Profile..." />
        </div>
      </MainLayout>
    );
  }

  const emp = profile?.employee;

  return (
    <MainLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 20 }}>MY PROFILE</h2>
        
        <Card variant="borderless" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
          <Row gutter={[48, 24]}>
            
            {/* --- LEFT COLUMN: IDENTITY CARD --- */}
            <Col xs={24} md={8} style={{ borderRight: '1px solid #f0f0f0', textAlign: 'center' }}>
              <div style={{ padding: '20px 0' }}>
                <Avatar 
                  size={140} 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#004040', marginBottom: 24, boxShadow: '0 4px 10px rgba(0,64,64,0.3)' }} 
                />
                
                <Title level={3} style={{ marginBottom: 5 }}>
                  {emp ? `${emp.firstName} ${emp.lastName}` : 'Administrator'}
                </Title>
                
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                  {profile?.email}
                </Text>

                <Space size="middle">
                  <Tag color="blue" style={{ padding: '4px 12px', fontSize: '12px' }}>
                    {profile?.role?.replace('_', ' ')}
                  </Tag>
                  <Tag 
                    icon={profile?.isActive ? <CheckCircleOutlined /> : <StopOutlined />} 
                    color={profile?.isActive ? 'success' : 'error'}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    {profile?.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Tag>
                </Space>
              </div>
            </Col>

            {/* --- RIGHT COLUMN: DETAILS GRID --- */}
            <Col xs={24} md={16}>
              {!emp ? (
                 <Alert 
                   message="System Admin Account" 
                   description="This profile acts as a super-user and does not have specific employee details linked to it."
                   type="info" 
                   showIcon 
                   style={{ marginTop: 20 }}
                 />
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <Title level={5} style={{ color: '#004040', marginBottom: 25, borderBottom: '2px solid #f0f0f0', paddingBottom: 10 }}>
                    JOB DETAILS
                  </Title>
                  
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <InfoBlock 
                        icon={<SolutionOutlined />} 
                        label="Designation" 
                        value={emp.designation} 
                      />
                    </Col>
                    <Col span={12}>
                      <InfoBlock 
                        icon={<BankOutlined />} 
                        label="Department" 
                        isTag={true}
                        value={
                          emp.department ? 
                          <Tag color="purple" style={{ fontSize: '14px', padding: '2px 10px' }}>{emp.department.name.toUpperCase()}</Tag> 
                          : <Tag color="red">UNASSIGNED</Tag>
                        } 
                      />
                    </Col>
                  </Row>

                  <Title level={5} style={{ color: '#004040', marginTop: 10, marginBottom: 25, borderBottom: '2px solid #f0f0f0', paddingBottom: 10 }}>
                    CONTACT & STATUS
                  </Title>

                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <InfoBlock 
                        icon={<MailOutlined />} 
                        label="Official Email" 
                        value={emp.email} 
                      />
                    </Col>
                    <Col span={12}>
                      <InfoBlock 
                        icon={<CalendarOutlined />} 
                        label="Date of Joining" 
                        value={formatDate(emp.joiningDate)} 
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: 20, padding: '15px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                     <Space>
                        <NumberOutlined style={{ color: '#bfbfbf' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>SYSTEM ID:</Text>
                        <Text code>{emp.id}</Text>
                     </Space>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;