import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Select, Card, Tag, Button, Row, Col, message, Tabs, Modal, Tooltip, Badge } from 'antd';
import { ReloadOutlined, CalendarOutlined, TableOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Option } = Select;

const AdminAttendance: React.FC = () => {
  const [viewMode, setViewMode] = useState('monthly'); // 'daily' or 'monthly'
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  // Data States
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(dayjs()); // For Daily View
  const [selectedMonth, setSelectedMonth] = useState(dayjs()); // For Monthly View
  const [selectedDept, setSelectedDept] = useState<string | undefined>(undefined);

  // Drill Down Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') fetchDailyAttendance();
    else fetchMonthlyAttendance();
  }, [viewMode, selectedDate, selectedMonth, selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/department');
      setDepartments(res.data);
    } catch (e) { console.error(e); }
  };

  // --- API CALLS ---
  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/report', {
        params: { 
          date: selectedDate.format('YYYY-MM-DD'), 
          departmentId: selectedDept 
        }
      });
      setDailyData(res.data);
    } catch (error) { message.error('Failed to load daily report'); }
    finally { setLoading(false); }
  };

  const fetchMonthlyAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/monthly', {
        params: { 
          month: selectedMonth.month() + 1, // Dayjs is 0-indexed
          year: selectedMonth.year(),
          departmentId: selectedDept 
        }
      });
      setMonthlyData(res.data);
    } catch (error) { message.error('Failed to load monthly sheet'); }
    finally { setLoading(false); }
  };

  // --- HELPER: Duration ---
  const getDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    const s = dayjs(start);
    const e = dayjs(end);
    const diff = e.diff(s, 'minute');
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  // --- HELPER: Open Modal ---
  const openEmployeeDetails = (record: any) => {
    setSelectedEmployee(record);
    setIsModalOpen(true);
  };

  // --- TABLE COLUMNS ---

  // 1. Daily View Columns
  const dailyColumns = [
    { title: 'Employee', dataIndex: 'name', key: 'name', render: (t:any) => <strong>{t}</strong> },
    { title: 'Department', dataIndex: 'department', key: 'dept', render: (t:any) => <Tag color="blue">{t}</Tag> },
    { title: 'In', dataIndex: 'punchIn', render: (t:any) => t ? new Date(t).toLocaleTimeString() : '-' },
    { title: 'Out', dataIndex: 'punchOut', render: (t:any) => t ? new Date(t).toLocaleTimeString() : '-' },
    { title: 'Work', render: (_:any, r:any) => <span style={{fontWeight:'bold'}}>{getDuration(r.punchIn, r.punchOut)}</span> },
    { title: 'Status', dataIndex: 'status', render: (s:any) => <Tag color={s === 'ABSENT' ? 'red' : 'green'}>{s}</Tag> }
  ];

  // 2. Monthly Grid Columns (Dynamic)
  const generateMonthlyColumns = () => {
    const daysInMonth = selectedMonth.daysInMonth();
    
    // Fixed First Column
    const cols: any = [
      {
        title: 'Employee Name',
        dataIndex: 'firstName',
        key: 'name',
        fixed: 'left',
        width: 180,
        render: (_: any, record: any) => (
          <a onClick={() => openEmployeeDetails(record)} style={{ fontWeight: 'bold' }}>
            {record.firstName} {record.lastName}
          </a>
        )
      }
    ];

    // Dynamic Day Columns
    for (let i = 1; i <= daysInMonth; i++) {
      cols.push({
        title: `${i}`,
        key: i,
        width: 50,
        align: 'center',
        render: (_: any, record: any) => {
          // Find attendance for this specific day
          const targetDate = selectedMonth.date(i).format('YYYY-MM-DD');
          
          const att = record.attendanceRecords.find((r: any) => 
            dayjs(r.date).format('YYYY-MM-DD') === targetDate
          );
          
          if (!att) return <span style={{ color: '#f0f0f0' }}>•</span>; // Absent
          
          let color = '#52c41a'; // Green (Completed)
          if (!att.clockOut) color = '#1890ff'; // Blue (Working)

          return (
            <Tooltip title={`In: ${new Date(att.clockIn).toLocaleTimeString()}`}>
               <Badge color={color} />
            </Tooltip>
          );
        }
      });
    }
    return cols;
  };

  // 3. Modal Details Columns
  const detailColumns = [
    { title: 'Date', dataIndex: 'date', render: (d:any) => dayjs(d).format('MMM DD, YYYY') },
    { title: 'Clock In', dataIndex: 'clockIn', render: (t:any) => new Date(t).toLocaleTimeString() },
    { title: 'Clock Out', dataIndex: 'clockOut', render: (t:any) => t ? new Date(t).toLocaleTimeString() : <Tag color="blue">Working</Tag> },
    { title: 'Duration', render: (_:any, r:any) => getDuration(r.clockIn, r.clockOut) },
    { title: 'Status', dataIndex: 'status', render: (s:any) => <Tag>{s}</Tag> }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>ATTENDANCE MONITOR</h2>
        <Button icon={<ReloadOutlined />} onClick={viewMode === 'daily' ? fetchDailyAttendance : fetchMonthlyAttendance}>Refresh</Button>
      </div>

      <Card variant="borderless">
        <Tabs
          activeKey={viewMode}
          onChange={setViewMode}
          items={[
            {
              key: 'monthly',
              label: <span><TableOutlined /> Monthly Sheet</span>,
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                     <Col span={6}>
                       <label>Select Month:</label>
                       <DatePicker picker="month" value={selectedMonth} onChange={d => setSelectedMonth(d || dayjs())} style={{ width: '100%' }} allowClear={false} />
                     </Col>
                     <Col span={6}>
                       <label>Department:</label>
                       <Select placeholder="All" value={selectedDept} onChange={setSelectedDept} style={{ width: '100%' }} allowClear options={departments.map((d: any) => ({ label: d.name, value: d.id }))} />
                     </Col>
                  </Row>
                  
                  {/* Monthly Grid Table */}
                  <Table 
                    columns={generateMonthlyColumns()} 
                    dataSource={monthlyData} 
                    rowKey="id" 
                    scroll={{ x: 'max-content' }} 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                    size="small"
                  />
                  
                  <div style={{ marginTop: 15, fontSize: '12px', color: '#666' }}>
                    <strong>Legend:</strong> &nbsp;
                    <Badge color="#52c41a" text="Present (Completed)" /> &nbsp;&nbsp;
                    <Badge color="#1890ff" text="Currently Working" /> &nbsp;&nbsp;
                    <span style={{ color: '#ccc' }}>• Absent / No Record</span>
                    <div style={{ marginTop: 5 }}>* Click on an employee name to view detailed logs.</div>
                  </div>
                </>
              )
            },
            {
              key: 'daily',
              label: <span><CalendarOutlined /> Daily Report</span>,
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                     <Col span={6}>
                       <label>Select Date:</label>
                       <DatePicker value={selectedDate} onChange={d => setSelectedDate(d || dayjs())} style={{ width: '100%' }} allowClear={false} />
                     </Col>
                     <Col span={6}>
                        <label>Department:</label>
                        <Select placeholder="All" value={selectedDept} onChange={setSelectedDept} style={{ width: '100%' }} allowClear options={departments.map((d: any) => ({ label: d.name, value: d.id }))} />
                     </Col>
                  </Row>
                  
                  {/* Daily Table */}
                  <Table columns={dailyColumns} dataSource={dailyData} rowKey="id" loading={loading} />
                </>
              )
            },
          ]}
        />
      </Card>

      {/* --- DRILL DOWN MODAL --- */}
      <Modal 
        title={selectedEmployee ? `${selectedEmployee.firstName}'s Attendance - ${selectedMonth.format('MMMM YYYY')}` : 'Details'} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedEmployee && (
          <Table 
            dataSource={selectedEmployee.attendanceRecords} 
            columns={detailColumns} 
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        )}
      </Modal>

    </MainLayout>
  );
};

export default AdminAttendance;