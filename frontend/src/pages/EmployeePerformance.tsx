import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Form, Tag, Alert, Rate, Steps, message, Spin, Popconfirm } from 'antd';
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

            {/* --- NEW: SALARY OFFER SECTION --- */}
            {appraisal.proposedSalary && (
                <Card style={{ marginTop: 20, borderColor: appraisal.isAccepted ? '#b7eb8f' : '#1890ff', borderWidth: 2 }}>
                    {appraisal.isAccepted ? (
                        <div style={{ textAlign: 'center', color: 'green' }}>
                            <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 10 }} />
                            <h2>Salary Revision Accepted!</h2>
                            <p>Your new annual base salary is <strong>₹{appraisal.proposedSalary.toLocaleString()}</strong>.</p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                            <h2>Congratulations!</h2>
                            <p>Based on your performance, management has proposed a salary revision.</p>
                            
                            <div style={{ fontSize: 24, margin: '20px 0', fontWeight: 'bold' }}>
                                <span style={{ color: '#1890ff' }}>{appraisal.hikePercentage}% Hike</span> <br/>
                                <span style={{ fontSize: 16, color: '#666', fontWeight: 'normal' }}>
                                    New CTC: ₹{appraisal.proposedSalary.toLocaleString()}
                                </span>
                            </div>

                            <Popconfirm 
                                title="Accept this offer?" 
                                description="This will update your current salary profile immediately."
                                onConfirm={async () => {
                                    try {
                                        await api.patch(`/performance/accept-hike/${appraisal.id}`);
                                        message.success('Offer Accepted!');
                                        fetchMyReview(); // Refresh UI
                                    } catch (e) {
                                        message.error('Failed to accept offer');
                                    }
                                }}
                            >
                                <Button type="primary" size="large">Accept Revised Salary</Button>
                            </Popconfirm>
                            <div style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
                                *To negotiate, please contact HR offline.
                            </div>
                        </div>
                    )}
                </Card>
            )}
          </div>
        )}

      </Card>
    </MainLayout>
  );
};

export default EmployeePerformance;