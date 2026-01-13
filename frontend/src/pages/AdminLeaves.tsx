import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, Modal, Input, message, Space, Tooltip, Avatar } from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  ReloadOutlined, UserOutlined 
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AdminLeaves: React.FC = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves/pending');
      setRequests(res.data);
    } catch (error) {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/leaves/action/${id}`, { status: 'APPROVED' });
      message.success('Leave Approved');
      fetchRequests();
    } catch (error) {
      message.error('Action failed');
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedRequestId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    try {
      await api.post(`/leaves/action/${selectedRequestId}`, { 
        status: 'REJECTED', 
        comment: rejectReason 
      });
      message.warning('Leave Rejected');
      setIsRejectModalOpen(false);
      fetchRequests();
    } catch (error) {
      message.error('Action failed');
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.employee.firstName} {record.employee.lastName}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{record.employee.department?.name || 'No Dept'}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'blue';
        if (type === 'SICK') color = 'volcano';
        if (type === 'CASUAL') color = 'orange';
        if (type === 'EARNED') color = 'green';
        return <Tag color={color}>{type}</Tag>;
      }
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: any) => (
        <div>
          <div>{dayjs(record.startDate).format('MMM D')} - {dayjs(record.endDate).format('MMM D')}</div>
          <Tag style={{ marginTop: 4 }}>{record.daysCount} Days</Tag>
        </div>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="primary" 
            shape="circle" 
            icon={<CheckCircleOutlined />} 
            onClick={() => handleApprove(record.id)} 
            style={{ backgroundColor: '#52c41a' }}
          />
          <Button 
            type="primary" 
            danger 
            shape="circle" 
            icon={<CloseCircleOutlined />} 
            onClick={() => openRejectModal(record.id)} 
          />
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>LEAVE REQUESTS</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchRequests}>Refresh</Button>
      </div>

      <Card variant="borderless">
        <Table 
          dataSource={requests} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          locale={{ emptyText: 'No Pending Requests' }}
        />
      </Card>

      <Modal
        title="Reject Leave Request"
        open={isRejectModalOpen}
        onOk={handleReject}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <p>Please provide a reason for rejection (optional):</p>
        <TextArea 
          rows={4} 
          value={rejectReason} 
          onChange={(e) => setRejectReason(e.target.value)} 
        />
      </Modal>
    </MainLayout>
  );
};

export default AdminLeaves;