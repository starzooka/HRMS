import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Statistic, Row, Col, Modal, Descriptions } from 'antd';
import { DollarCircleOutlined, PrinterOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const EmployeePayroll: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // --- PAYSLIP CALCULATION & VIEW ---
  const handleView = (record: any) => {
    // Reverse engineer the breakdown for display
    // Logic must match Backend Service
    const monthlyCTC = record.baseSalary / 12;
    const basic = Math.round(monthlyCTC * 0.50);
    const hra = Math.round(basic * 0.40);
    const medical = 1250;
    
    // Recalculate Special based on what was actually stored as Gross (allowances)
    // Gross = allowances
    const special = record.allowances - (basic + hra + medical);
    
    const pf = Math.round(basic * 0.12);
    const pt = 200;
    
    // Tax is the remainder of deductions
    const tax = record.deductions - (pf + pt);

    setSelectedSlip({ 
      ...record, 
      breakdown: { basic, hra, medical, special, pf, pt, tax } 
    });
    setIsModalOpen(true);
  };

  const columns = [
    { title: 'Month', key: 'month', render: (_:any, r:any) => <strong>{r.month} {r.year}</strong> },
    { title: 'Gross Earnings', dataIndex: 'allowances', render: (val: number) => formatCurrency(val) },
    { title: 'Deductions', dataIndex: 'deductions', render: (val: number) => <span style={{color:'red'}}>- {formatCurrency(val)}</span> },
    { title: 'Net Pay', dataIndex: 'netSalary', render: (val: number) => <span style={{color:'green', fontWeight:'bold'}}>{formatCurrency(val)}</span> },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (status: string) => status === 'PAID' ? <Tag color="green">PAID</Tag> : <Tag color="orange">PROCESSING</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View Payslip
        </Button>
      )
    }
  ];

  const lastSalary = data.length > 0 ? data[0] : null;

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>MY SALARY HISTORY</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Last Net Salary" 
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

      {/* --- PAYSLIP MODAL --- */}
      <Modal 
        title="Payslip Details" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        ]}
        width={700}
      >
        {selectedSlip && (
          <div id="payslip-content" style={{ padding: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 15 }}>
              <h2 style={{ margin: 0, color: '#1890ff' }}>STARZOOKA LTD.</h2>
              <p style={{ color: '#888', marginTop: 5 }}>Official Payslip for {selectedSlip.month} {selectedSlip.year}</p>
            </div>
            
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Employee ID" span={2}>
                {selectedSlip.employeeId.split('-')[0].toUpperCase()}
              </Descriptions.Item>

              {/* EARNINGS */}
              <Descriptions.Item label="Basic Salary">
                {formatCurrency(selectedSlip.breakdown.basic)}
              </Descriptions.Item>
              <Descriptions.Item label="Provident Fund (PF)">
                {formatCurrency(selectedSlip.breakdown.pf)}
              </Descriptions.Item>

              <Descriptions.Item label="HRA">
                {formatCurrency(selectedSlip.breakdown.hra)}
              </Descriptions.Item>
              <Descriptions.Item label="Professional Tax">
                {formatCurrency(selectedSlip.breakdown.pt)}
              </Descriptions.Item>

              <Descriptions.Item label="Medical Allowance">
                {formatCurrency(selectedSlip.breakdown.medical)}
              </Descriptions.Item>
              <Descriptions.Item label="Income Tax (TDS)">
                {formatCurrency(selectedSlip.breakdown.tax)}
              </Descriptions.Item>

              <Descriptions.Item label="Special Allowance">
                {formatCurrency(selectedSlip.breakdown.special)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Deductions" style={{ color: 'red' }}>
                {formatCurrency(selectedSlip.deductions)}
              </Descriptions.Item>

              {/* TOTALS */}
              <Descriptions.Item label="Gross Earnings" style={{ fontWeight: 'bold' }}>
                {formatCurrency(selectedSlip.allowances)}
              </Descriptions.Item>
              <Descriptions.Item label="NET PAYABLE" style={{ background:'#f6ffed' }}>
                <span style={{ fontSize: 18, color: 'green', fontWeight:'bold' }}>
                  {formatCurrency(selectedSlip.netSalary)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>
              <p>This is a computer-generated payslip and does not require a signature.</p>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default EmployeePayroll;