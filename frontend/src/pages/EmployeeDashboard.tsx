import React, { useEffect, useState } from 'react';
import { 
  Button, Card, Row, Col, Statistic, message, Alert, 
  Modal, Form, DatePicker, Select, Input, Table, Tag 
} from 'antd';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EmployeeDashboard: React.FC = () => {
  // Attendance State
  const [attendanceStatus, setAttendanceStatus] = useState('LOADING');
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);

  // Leave State
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm] = Form.useForm();

  useEffect(() => {
    fetchAttendanceStatus();
    fetchLeaveData();
  }, []);

  // --- ATTENDANCE LOGIC ---
  const fetchAttendanceStatus = async () => {
    try {
      const res = await api.get('/attendance/status');
      setAttendanceStatus(res.data.status);
      if (res.data.punchIn) setPunchInTime(res.data.punchIn);
      if (res.data.punchOut) setPunchOutTime(res.data.punchOut);
    } catch (error) { setAttendanceStatus('ERROR'); }
  };

  const handleClockIn = async () => {
    try {
      await api.post('/attendance/clock-in');
      message.success("CLOCKED IN!");
      fetchAttendanceStatus();
    } catch (error) { message.error("Failed to Clock In"); }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/attendance/clock-out');
      message.success("CLOCKED OUT!");
      fetchAttendanceStatus();
    } catch (error) { message.error("Failed to Clock Out"); }
  };

  // --- LEAVE LOGIC ---
  const fetchLeaveData = async () => {
    try {
      const balanceRes = await api.get('/leaves/balance');
      setLeaveBalance(balanceRes.data);

      const historyRes = await api.get('/leaves/my-history');
      setLeaveHistory(historyRes.data);
    } catch (error) { console.error("Failed to load leave data"); }
  };

  const handleApplyLeave = async () => {
    try {
      const values = await leaveForm.validateFields();
      await api.post('/leaves/apply', {
        startDate: values.dates[0].format('YYYY-MM-DD'),
        endDate: values.dates[1].format('YYYY-MM-DD'),
        type: values.type,
        reason: values.reason
      });
      message.success('Leave Request Submitted');
      setIsLeaveModalOpen(false);
      leaveForm.resetFields();
      fetchLeaveData(); // Refresh history
    } catch (error) { message.error('Failed to submit request'); }
  };

  // Helpers
  const getStatusDisplay = () => {
    switch (attendanceStatus) {
      case 'WORKING': return { text: 'CLOCKED IN', color: '#3f8600' };
      case 'COMPLETED': return { text: 'FINISHED FOR DAY', color: '#cf1322' };
      default: return { text: 'NOT STARTED', color: '#000' };
    }
  };

  const getDuration = () => {
    if (!punchInTime || !punchOutTime) return '';
    const start = dayjs(punchInTime);
    const end = dayjs(punchOutTime);
    const diff = end.diff(start, 'minute');
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours} hrs ${mins} mins`;
  };

  const status = getStatusDisplay();

  // History Columns
  const historyColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t:any) => <Tag color="blue">{t}</Tag> },
    { title: 'Days', dataIndex: 'daysCount', key: 'days' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s:any) => {
        let color = 'orange';
        if (s === 'APPROVED') color = 'green';
        if (s === 'REJECTED') color = 'red';
        return <Tag color={color}>{s}</Tag>;
    }},
    { title: 'Dates', render: (_:any, r:any) => `${dayjs(r.startDate).format('MMM D')} - ${dayjs(r.endDate).format('MMM D')}` }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>MY DASHBOARD</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* --- ATTENDANCE CARD --- */}
        <Col span={8}>
          <Card title="Attendance" variant="borderless" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ color: status.color, margin: 0 }}>{status.text}</h1>
              {punchInTime && <p>Started: {new Date(punchInTime).toLocaleTimeString()}</p>}
              {attendanceStatus === 'COMPLETED' && punchOutTime && (
                 <h3 style={{ marginTop: 10 }}>Total Work: {getDuration()}</h3>
              )}
            </div>
            
            {attendanceStatus === 'NOT_STARTED' && <Button type="primary" block size="large" onClick={handleClockIn}>CLOCK IN</Button>}
            {attendanceStatus === 'WORKING' && <Button danger block size="large" onClick={handleClockOut}>CLOCK OUT</Button>}
            {attendanceStatus === 'COMPLETED' && <Alert message="Shift Completed." type="success" showIcon />}
          </Card>
        </Col>

        {/* --- LEAVE PROFILE CARD --- */}
        <Col span={8}>
           <Card title="Leave Balance" variant="borderless" style={{ height: '100%' }}>
              <Row gutter={16} style={{ textAlign: 'center' }}>
                <Col span={8}>
                  <Statistic title="Sick" value={leaveBalance?.sick || 0} valueStyle={{ color: '#cf1322' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Casual" value={leaveBalance?.casual || 0} valueStyle={{ color: '#faad14' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Earned" value={leaveBalance?.earned || 0} valueStyle={{ color: '#3f8600' }} />
                </Col>
              </Row>
              
              <div style={{ marginTop: 25 }}>
                 <Button type="primary" ghost block onClick={() => setIsLeaveModalOpen(true)}>
                   Request Leave
                 </Button>
              </div>
           </Card>
        </Col>

        {/* --- QUICK INFO CARD --- */}
        <Col span={8}>
           <Card title="Recent Activity" variant="borderless" style={{ height: '100%' }}>
             <Table 
               dataSource={leaveHistory.slice(0, 3)} 
               columns={historyColumns} 
               rowKey="id" 
               size="small" 
               pagination={false} 
             />
           </Card>
        </Col>
      </Row>

      {/* --- LEAVE APPLICATION MODAL --- */}
      <Modal 
        title="Apply for Leave" 
        open={isLeaveModalOpen} 
        onOk={handleApplyLeave} 
        onCancel={() => setIsLeaveModalOpen(false)}
        okText="Submit Request"
      >
        <Form form={leaveForm} layout="vertical">
          <Form.Item name="type" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select Type">
              <Option value="SICK">Sick Leave</Option>
              <Option value="CASUAL">Casual Leave</Option>
              <Option value="EARNED">Earned Leave</Option>
            </Select>
          </Form.Item>

          <Form.Item name="dates" label="Duration" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Why do you need leave?" />
          </Form.Item>
        </Form>
      </Modal>

    </MainLayout>
  );
};

export default EmployeeDashboard;