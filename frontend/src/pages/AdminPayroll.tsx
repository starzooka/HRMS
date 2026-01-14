import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Card, Tag, message, Select, 
  Row, Col, Popconfirm, Statistic, Modal, Descriptions, Divider 
} from 'antd';
import { 
  DollarCircleOutlined, ReloadOutlined, 
  CheckCircleOutlined, BankOutlined, EyeOutlined 
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const { Option } = Select;

const AdminPayroll: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Generation State
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [generateLoading, setGenerateLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);

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
      message.success('Payment Processed Successfully');
      setIsModalOpen(false); // Close modal if open
      fetchPayroll();
    } catch (error) {
      message.error('Action failed');
    }
  };

  // --- LOGIC: REVERSE ENGINEER BREAKDOWN ---
  const calculateBreakdown = (record: any) => {
    const monthlyCTC = record.baseSalary / 12;
    
    // Earnings
    const basic = Math.round(monthlyCTC * 0.50);
    const hra = Math.round(basic * 0.40);
    const medical = 1250;
    // Gross = allowances. Special is the balancer.
    const special = record.allowances - (basic + hra + medical);
    
    // Deductions
    const pf = Math.round(basic * 0.12);
    const pt = 200;
    // Tax = Total Deductions - (PF + PT)
    const tax = record.deductions - (pf + pt);

    return { basic, hra, medical, special, pf, pt, tax };
  };

  const openVerifyModal = (record: any) => {
    const calculated = calculateBreakdown(record);
    setSelectedRecord(record);
    setBreakdown(calculated);
    setIsModalOpen(true);
  };

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
        <div>
           <span style={{ fontWeight: 'bold' }}>{record.employee.firstName} {record.employee.lastName}</span>
           <br/>
           <span style={{ fontSize: 12, color: '#888' }}>{record.employee.department?.name}</span>
        </div>
      )
    },
    {
      title: 'Period',
      render: (_: any, record: any) => <Tag color="blue">{record.month} {record.year}</Tag>
    },
    {
      title: 'Gross Pay',
      dataIndex: 'allowances',
      key: 'gross',
      render: (val: number) => formatCurrency(val)
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      render: (val: number) => <span style={{ color: 'red' }}>-{formatCurrency(val)}</span>
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
      render: (status: string) => (
        status === 'PAID' 
          ? <Tag color="success" icon={<CheckCircleOutlined />}>PAID</Tag>
          : <Tag color="warning">GENERATED</Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
            type="default" 
            size="small" 
            icon={record.status === 'GENERATED' ? <BankOutlined /> : <EyeOutlined />}
            onClick={() => openVerifyModal(record)}
        >
            {record.status === 'GENERATED' ? 'Verify & Pay' : 'View Details'}
        </Button>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>PAYROLL MANAGEMENT</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchPayroll}>Refresh</Button>
      </div>

      {/* GENERATION CARD */}
      <Card title="Run Payroll Batch" style={{ marginBottom: 20 }}>
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
              title="Total Payout (Pending + Paid)" 
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

      {/* --- VERIFICATION & PAYMENT MODAL --- */}
      <Modal
        title={selectedRecord ? `Payroll Verification: ${selectedRecord.employee.firstName} ${selectedRecord.employee.lastName}` : 'Details'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>,
          selectedRecord?.status === 'GENERATED' && (
            <Popconfirm 
                key="pay"
                title="Confirm fund transfer?" 
                description="This will mark the payroll as PAID."
                onConfirm={() => handleMarkPaid(selectedRecord.id)}
            >
                <Button type="primary" icon={<BankOutlined />}>Confirm Payment</Button>
            </Popconfirm>
          )
        ]}
      >
        {selectedRecord && breakdown && (
          <div>
            <div style={{ background: '#f5f5f5', padding: '10px 20px', borderRadius: 6, marginBottom: 20 }}>
                <Row>
                    <Col span={12}><strong>Month:</strong> {selectedRecord.month} {selectedRecord.year}</Col>
                    <Col span={12}><strong>Annual CTC:</strong> {formatCurrency(selectedRecord.baseSalary)}</Col>
                </Row>
            </div>

            <Descriptions title="Salary Structure Breakdown" bordered size="small" column={2}>
              {/* Earnings */}
              <Descriptions.Item label="Basic Salary">{formatCurrency(breakdown.basic)}</Descriptions.Item>
              <Descriptions.Item label="Provident Fund (12%)">{formatCurrency(breakdown.pf)}</Descriptions.Item>
              
              <Descriptions.Item label="HRA (40% of Basic)">{formatCurrency(breakdown.hra)}</Descriptions.Item>
              <Descriptions.Item label="Professional Tax">{formatCurrency(breakdown.pt)}</Descriptions.Item>

              <Descriptions.Item label="Medical Allowance">{formatCurrency(breakdown.medical)}</Descriptions.Item>
              <Descriptions.Item label="Income Tax (TDS)">{formatCurrency(breakdown.tax)}</Descriptions.Item>

              <Descriptions.Item label="Special Allowance">{formatCurrency(breakdown.special)}</Descriptions.Item>
              <Descriptions.Item label="Total Deductions" style={{ color: 'red' }}>
                -{formatCurrency(selectedRecord.deductions)}
              </Descriptions.Item>

              {/* Totals */}
              <Descriptions.Item label="Gross Earnings" span={2} style={{ fontWeight: 'bold' }}>
                {formatCurrency(selectedRecord.allowances)}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>Net Salary Payable:</span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: 'green' }}>
                    {formatCurrency(selectedRecord.netSalary)}
                </span>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default AdminPayroll;