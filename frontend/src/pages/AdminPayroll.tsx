import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Card, Tag, message, Select, 
  Row, Col, Popconfirm, Statistic 
} from 'antd';
import { 
  DollarCircleOutlined, ReloadOutlined, 
  CheckCircleOutlined, BankOutlined 
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const { Option } = Select;

const AdminPayroll: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [generateLoading, setGenerateLoading] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/all');
      setData(res.data);
    } catch (error) {
      message.error('Failed to load payroll history');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerateLoading(true);
    try {
      const res = await api.post('/payroll/generate', {
        month: selectedMonth,
        year: selectedYear
      });
      message.success(res.data.message);
      fetchPayroll();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Generation failed');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.post(`/payroll/pay/${id}`);
      message.success('Payment Processed');
      fetchPayroll();
    } catch (error) {
      message.error('Action failed');
    }
  };

  // Helper for Indian Currency Format
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.employee.firstName} {record.employee.lastName}
        </span>
      )
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: any, record: any) => <Tag color="blue">{record.month} {record.year}</Tag>
    },
    {
      title: 'Base Salary',
      dataIndex: 'baseSalary',
      key: 'base',
      render: (val: number) => formatCurrency(val)
    },
    {
      title: 'Deductions (Tax)',
      dataIndex: 'deductions',
      key: 'deductions',
      render: (val: number) => <span style={{ color: 'red' }}>{formatCurrency(val)}</span> // Removed negative sign as formatCurrency might handle it, or just keep color red
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'net',
      render: (val: number) => <b style={{ color: 'green' }}>{formatCurrency(val)}</b>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        return status === 'PAID' 
          ? <Tag color="success" icon={<CheckCircleOutlined />}>PAID</Tag>
          : <Tag color="warning">GENERATED</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        record.status === 'GENERATED' && (
          <Popconfirm title="Confirm payment transfer?" onConfirm={() => handleMarkPaid(record.id)}>
            <Button type="primary" size="small" icon={<BankOutlined />}>
              Pay Now
            </Button>
          </Popconfirm>
        )
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>PAYROLL MANAGEMENT</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchPayroll}>Refresh</Button>
      </div>

      <Card title="Generate Monthly Payroll" style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: '100%' }}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <Option key={m} value={m}>{m}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
             <Select value={selectedYear} onChange={setSelectedYear} style={{ width: '100%' }}>
               <Option value={2025}>2025</Option>
               <Option value={2026}>2026</Option>
             </Select>
          </Col>
          <Col span={6}>
            <Button type="primary" icon={<DollarCircleOutlined />} onClick={handleGenerate} loading={generateLoading}>
              Generate Salaries
            </Button>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Statistic 
              title="Total Payroll Cost" 
              value={data.reduce((acc: number, curr: any) => acc + curr.netSalary, 0)} 
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ fontSize: 18, color: '#3f8600' }}
            />
          </Col>
        </Row>
      </Card>

      <Card variant="borderless">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>
    </MainLayout>
  );
};

export default AdminPayroll;