import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Statistic, Row, Col } from 'antd';
import { DownloadOutlined, DollarCircleOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const EmployeePayroll: React.FC = () => {
  // FIX: Added <any[]> to tell TypeScript this array will hold objects
  const [data, setData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/my-history');
      setData(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const columns = [
    { title: 'Month', key: 'month', render: (_:any, r:any) => <strong>{r.month} {r.year}</strong> },
    { title: 'Earnings', dataIndex: 'baseSalary', render: (val: number) => formatCurrency(val) },
    { title: 'Deductions', dataIndex: 'deductions', render: (val: number) => <span style={{color:'red'}}>- {formatCurrency(val)}</span> },
    { title: 'Net Pay', dataIndex: 'netSalary', render: (val: number) => <span style={{color:'green', fontWeight:'bold'}}>{formatCurrency(val)}</span> },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (status: string) => status === 'PAID' ? <Tag color="green">PAID</Tag> : <Tag color="orange">PROCESSING</Tag>
    },
    {
      title: 'Slip',
      key: 'slip',
      render: () => <Button size="small" icon={<DownloadOutlined />}>Download</Button>
    }
  ];

  // Calculate Last Salary for Header safely
  const lastSalary = data.length > 0 ? data[0] : null;

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>MY SALARY SLIPS</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Last Net Salary" 
              // FIX: Ensure safe access with optional chaining or default 0
              value={lastSalary ? lastSalary.netSalary : 0} 
              precision={0}
              formatter={(val) => formatCurrency(Number(val))}
              prefix={<DollarCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              {lastSalary ? `${lastSalary.month} ${lastSalary.year}` : 'No records yet'}
            </div>
          </Card>
        </Col>
      </Row>

      <Card variant="borderless">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>
    </MainLayout>
  );
};

export default EmployeePayroll;