import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Descriptions, Tag, Button, Spin, Tabs, Table, Statistic } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, FileProtectOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      const res = await api.get(`/employee/${id}`);
      setEmp(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <MainLayout><div style={{textAlign:'center', marginTop: 50}}><Spin size="large"/></div></MainLayout>;
  if (!emp) return <MainLayout>Employee not found.</MainLayout>;

  // Columns for Attendance Tab
  const attendanceCols = [
    { title: 'Date', dataIndex: 'date', render: (d:any) => dayjs(d).format('YYYY-MM-DD') },
    { title: 'In', dataIndex: 'clockIn', render: (t:any) => new Date(t).toLocaleTimeString() },
    { title: 'Out', dataIndex: 'clockOut', render: (t:any) => t ? new Date(t).toLocaleTimeString() : '-' },
    { title: 'Status', dataIndex: 'status', render: (s:any) => <Tag color={s==='PRESENT'?'green':'blue'}>{s}</Tag> }
  ];

  // Columns for Leaves Tab
  const leaveCols = [
    { title: 'Type', dataIndex: 'type', render: (t:any) => <Tag>{t}</Tag> },
    { title: 'Days', dataIndex: 'daysCount' },
    { title: 'Status', dataIndex: 'status', render: (s:any) => <Tag color={s==='APPROVED'?'green':(s==='REJECTED'?'red':'orange')}>{s}</Tag> },
    { title: 'Dates', render: (_:any, r:any) => `${dayjs(r.startDate).format('MM/DD')} - ${dayjs(r.endDate).format('MM/DD')}` }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin-dashboard')}>
          Back to Directory
        </Button>
      </div>

      <Row gutter={16}>
        {/* LEFT COLUMN: Profile Info */}
        <Col span={8}>
          <Card 
            title={<span><UserOutlined /> Profile Details</span>} 
            extra={emp.user ? <Tag color="green">Active Account</Tag> : <Tag color="red">No Login</Tag>}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{emp.firstName} {emp.lastName}</div>
              <div style={{ color: '#888' }}>{emp.designation}</div>
              <Tag color="blue" style={{ marginTop: 10 }}>{emp.department?.name || 'No Dept'}</Tag>
            </div>
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">{emp.email}</Descriptions.Item>
              <Descriptions.Item label="Joined">{dayjs(emp.joiningDate).format('MMM DD, YYYY')}</Descriptions.Item>
              <Descriptions.Item label="User Role">{emp.user?.role || 'N/A'}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20 }}>
               <h4>Leave Balances</h4>
               <Row gutter={8} style={{ textAlign: 'center' }}>
                 <Col span={8}><Statistic title="Sick" value={emp.sickLeaveBalance} valueStyle={{ fontSize: 16 }}/></Col>
                 <Col span={8}><Statistic title="Casual" value={emp.casualLeaveBalance} valueStyle={{ fontSize: 16 }}/></Col>
                 <Col span={8}><Statistic title="Earned" value={emp.earnedLeaveBalance} valueStyle={{ fontSize: 16 }}/></Col>
               </Row>
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN: Activity Tabs */}
        <Col span={16}>
          <Card>
            <Tabs items={[
              {
                key: '1',
                label: <span><CalendarOutlined /> Recent Attendance</span>,
                children: <Table dataSource={emp.attendanceRecords} columns={attendanceCols} rowKey="id" pagination={false} size="small"/>
              },
              {
                key: '2',
                label: <span><FileProtectOutlined /> Leave History</span>,
                children: <Table dataSource={emp.leaveRequests} columns={leaveCols} rowKey="id" pagination={false} size="small"/>
              }
            ]} />
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default EmployeeDetails;