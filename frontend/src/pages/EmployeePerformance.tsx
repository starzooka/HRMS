import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Form, Tag, Alert, Rate, Steps, message, Spin } from 'antd';
import { RocketOutlined, CheckCircleOutlined, SyncOutlined, SmileOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const { TextArea } = Input;

const EmployeePerformance: React.FC = () => {
  const [appraisal, setAppraisal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMyReview();
  }, []);

  const fetchMyReview = async () => {
    try {
      const res = await api.get('/performance/my-review');
      setAppraisal(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.patch(`/performance/self-review/${appraisal.id}`, {
        review: values.selfReview
      });
      message.success('Self Review Submitted!');
      fetchMyReview(); // Refresh to update status
    } catch (error) {
      message.error('Submission Failed');
    }
  };

  if (loading) return <MainLayout><div style={{textAlign:'center', marginTop:50}}><Spin size="large"/></div></MainLayout>;

  if (!appraisal) return (
    <MainLayout>
      <div style={{ marginTop: 50, textAlign: 'center' }}>
        <SmileOutlined style={{ fontSize: 40, color: '#1890ff' }} />
        <h2>No Active Reviews</h2>
        <p>There are no performance appraisal cycles currently active for you.</p>
      </div>
    </MainLayout>
  );

  // Determine current step for UI
  let currentStep = 0;
  if (appraisal.status === 'PENDING_MANAGER') currentStep = 1;
  if (appraisal.status === 'COMPLETED') currentStep = 2;

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>MY PERFORMANCE REVIEW</h2>
        <Tag color="blue">{appraisal.cycle.title}</Tag>
      </div>

      <Card>
        <Steps 
          current={currentStep} 
          items={[
            { title: 'Self Review', icon: <RocketOutlined /> },
            { title: 'Manager Review', icon: <SyncOutlined spin={currentStep === 1} /> },
            { title: 'Completed', icon: <CheckCircleOutlined /> },
          ]} 
          style={{ marginBottom: 40 }}
        />

        {/* --- STAGE 1: WRITE SELF REVIEW --- */}
        {appraisal.status === 'PENDING_SELF' && (
          <div>
            <Alert 
              message="Action Required" 
              description="Please submit your self-review to proceed to the next stage." 
              type="info" 
              showIcon 
              style={{ marginBottom: 20 }}
            />
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item 
                name="selfReview" 
                label="Your Achievements & Feedback" 
                rules={[{ required: true, min: 10, message: 'Please write a detailed review' }]}
              >
                <TextArea rows={6} placeholder="Describe your achievements, challenges, and goals..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                Submit Self Review
              </Button>
            </Form>
          </div>
        )}

        {/* --- STAGE 2: WAITING FOR MANAGER --- */}
        {appraisal.status === 'PENDING_MANAGER' && (
          <div style={{ textAlign: 'center', padding: 40, background: '#f9f9f9' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <h3 style={{ marginTop: 20 }}>Self Review Submitted</h3>
            <p>Your review is now with your manager/HR for the final assessment.</p>
            <Card type="inner" title="Your Submission" style={{ marginTop: 20, textAlign: 'left' }}>
               <p>{appraisal.selfReview}</p>
            </Card>
          </div>
        )}

        {/* --- STAGE 3: COMPLETED --- */}
        {appraisal.status === 'COMPLETED' && (
          <div>
            <Alert 
              message="Appraisal Completed" 
              description="Your performance review has been finalized." 
              type="success" 
              showIcon 
              style={{ marginBottom: 20 }}
            />
            
            <Card type="inner" title="Manager Feedback">
               <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                 <span style={{ fontSize: 16, fontWeight: 'bold', marginRight: 15 }}>Final Rating:</span>
                 <Rate disabled value={appraisal.rating} />
               </div>
               <p><strong>Comments:</strong></p>
               <p style={{ background: '#f0f5ff', padding: 15, borderRadius: 5 }}>
                 {appraisal.managerReview}
               </p>
            </Card>

            <Card type="inner" title="Your Submission" style={{ marginTop: 20 }}>
               <p style={{ color: '#666' }}>{appraisal.selfReview}</p>
            </Card>
          </div>
        )}

      </Card>
    </MainLayout>
  );
};

export default EmployeePerformance;