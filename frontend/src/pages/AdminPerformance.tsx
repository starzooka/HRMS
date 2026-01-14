import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Card, Tag, message, Select, 
  Row, Col, Modal, Form, Input, DatePicker, Rate, Space, InputNumber, Statistic 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, 
  EditOutlined, RiseOutlined 
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AdminPerformance: React.FC = () => {
  // Data States
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isHikeModalOpen, setIsHikeModalOpen] = useState(false);
  
  // Forms
  const [cycleForm] = Form.useForm();
  const [gradeForm] = Form.useForm();
  const [hikeForm] = Form.useForm();
  const [currentReview, setCurrentReview] = useState<any>(null);

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchReviews(selectedCycle);
    }
  }, [selectedCycle]);

  // --- API CALLS ---
  const fetchCycles = async () => {
    try {
      const res = await api.get('/performance/cycles');
      setCycles(res.data);
      if (res.data.length > 0 && !selectedCycle) {
        setSelectedCycle(res.data[0].id); // Auto-select latest
      }
    } catch (error) { message.error('Failed to load cycles'); }
  };

  const fetchReviews = async (cycleId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/performance/reviews/${cycleId}`);
      setReviews(res.data);
    } catch (error) { message.error('Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const handleCreateCycle = async () => {
    try {
      const values = await cycleForm.validateFields();
      await api.post('/performance/cycle', values);
      message.success('New Appraisal Cycle Created');
      setIsCycleModalOpen(false);
      cycleForm.resetFields();
      fetchCycles();
    } catch (error) { message.error('Failed to create cycle'); }
  };

  // --- GRADING ACTIONS ---
  const openGradeModal = (record: any) => {
    setCurrentReview(record);
    gradeForm.setFieldsValue({
      managerReview: record.managerReview,
      rating: record.rating || 3
    });
    setIsGradeModalOpen(true);
  };

  const handleSubmitGrade = async () => {
    try {
      const values = await gradeForm.validateFields();
      await api.patch(`/performance/manager-review/${currentReview.id}`, values);
      message.success('Review Finalized');
      setIsGradeModalOpen(false);
      fetchReviews(selectedCycle!);
    } catch (error) { message.error('Submission failed'); }
  };

  // --- HIKE ACTIONS ---
  const openHikeModal = (record: any) => {
    setCurrentReview(record);
    hikeForm.setFieldsValue({ percentage: record.hikePercentage || 10 });
    setIsHikeModalOpen(true);
  };

  const handleSubmitHike = async () => {
    try {
      const values = await hikeForm.validateFields();
      await api.patch(`/performance/propose-hike/${currentReview.id}`, {
        percentage: values.percentage
      });
      message.success('Salary Revision Proposed Successfully');
      setIsHikeModalOpen(false);
      fetchReviews(selectedCycle!); 
    } catch (error) { message.error('Proposal Failed'); }
  };

  // --- COLUMNS ---
  const columns = [
    {
      title: 'Employee',
      key: 'emp',
      render: (_: any, r: any) => (
        <div>
          <strong>{r.employee.firstName} {r.employee.lastName}</strong>
          <div style={{ fontSize: 12, color: '#888' }}>{r.employee.department?.name}</div>
        </div>
      )
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      width: 140,
      render: (rating: number) => rating ? <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} /> : <span style={{color:'#ccc'}}>-</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'PENDING_MANAGER') color = 'orange';
        if (status === 'COMPLETED') color = 'green';
        return <Tag color={color}>{status.replace('_', ' ')}</Tag>;
      }
    },
    {
      title: 'Hike Status',
      key: 'hikeStatus',
      render: (_: any, r: any) => {
          if (!r.proposedSalary) return <Tag>Not Initiated</Tag>;
          if (r.isAccepted) return <Tag color="green">ACCEPTED</Tag>;
          return <Tag color="orange">OFFER SENT</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => {
        if (record.status !== 'COMPLETED') {
            return (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<EditOutlined />} 
                  disabled={record.status === 'PENDING_SELF'} 
                  onClick={() => openGradeModal(record)}
                >
                  Grade
                </Button>
            );
        }
        return (
            <Button 
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white' }}
                size="small" icon={<RiseOutlined />} 
                onClick={() => openHikeModal(record)}
            >
                Promote / Hike
            </Button>
        );
      }
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>PERFORMANCE REVIEWS</h2>
        <Space>
           <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsCycleModalOpen(true)}>New Cycle</Button>
           <Button icon={<ReloadOutlined />} onClick={() => fetchCycles()}>Refresh</Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 10, fontWeight: 'bold' }}>Select Cycle:</span>
          <Select 
            style={{ width: 300 }} 
            value={selectedCycle} 
            onChange={setSelectedCycle}
            placeholder="Select a Review Cycle"
          >
            {cycles.map((c: any) => (
              <Option key={c.id} value={c.id}>{c.title} ({dayjs(c.startDate).format('MMM YYYY')})</Option>
            ))}
          </Select>
        </div>

        <Table 
          columns={columns} 
          dataSource={reviews} 
          rowKey="id" 
          loading={loading} 
          locale={{ emptyText: !selectedCycle ? 'Please create or select a cycle' : 'No reviews found' }}
        />
      </Card>

      {/* --- CREATE CYCLE MODAL --- */}
      <Modal 
        title="Launch New Appraisal Cycle" 
        open={isCycleModalOpen} 
        onOk={handleCreateCycle} 
        onCancel={() => setIsCycleModalOpen(false)}
        okText="Launch"
      >
        <Form form={cycleForm} layout="vertical">
          <Form.Item name="title" label="Cycle Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Annual Review 2026" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* --- GRADE MODAL --- */}
      <Modal 
        title={`Finalize Review for ${currentReview?.employee?.firstName}`} 
        open={isGradeModalOpen} 
        onOk={handleSubmitGrade} 
        onCancel={() => setIsGradeModalOpen(false)}
        okText="Submit Rating"
        width={600}
      >
        <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 5, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Employee Self-Review:</h4>
          <p style={{ fontStyle: 'italic' }}>"{currentReview?.selfReview}"</p>
        </div>

        <Form form={gradeForm} layout="vertical">
          <Form.Item name="managerReview" label="Manager Comments" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Feedback for the employee..." />
          </Form.Item>
          <Form.Item name="rating" label="Performance Rating" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- HIKE PROPOSAL MODAL --- */}
      <Modal
        title="Salary Revision Proposal"
        open={isHikeModalOpen}
        onOk={handleSubmitHike}
        onCancel={() => setIsHikeModalOpen(false)}
        okText="Send Proposal"
      >
         <Form form={hikeForm} layout="vertical">
            <div style={{ marginBottom: 20 }}>
                <p><strong>Current Annual CTC:</strong> ₹{currentReview?.employee?.baseSalary.toLocaleString()}</p>
                <p style={{fontSize: 12, color:'#666'}}>
                    Enter the hike percentage. The employee will see this offer on their dashboard 
                    and must accept it to finalize the revision.
                </p>
            </div>

            <Form.Item 
                name="percentage" 
                label="Hike Percentage (%)" 
                rules={[{ required: true, message: 'Please enter a percentage' }]}
            >
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item shouldUpdate>
                {() => {
                    const pct = hikeForm.getFieldValue('percentage') || 0;
                    const current = currentReview?.employee?.baseSalary || 0;
                    const hikeAmount = Math.round(current * (pct / 100));
                    const newTotal = current + hikeAmount;
                    
                    return (
                        <div style={{ background: '#f0f5ff', padding: 15, borderRadius: 5 }}>
                           <Statistic title="Proposed New Salary" value={newTotal} precision={0} prefix="₹" valueStyle={{ color: '#1890ff' }} />
                           <div style={{ marginTop: 5, color: '#1890ff' }}>
                              Increase: +₹{hikeAmount.toLocaleString()}
                           </div>
                        </div>
                    );
                }}
            </Form.Item>
         </Form>
      </Modal>

    </MainLayout>
  );
};

export default AdminPerformance;