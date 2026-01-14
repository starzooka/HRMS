import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Card, Row, Col, Statistic, Tag, message, Space, 
  Modal, Form, Input, DatePicker, Select, Tooltip 
} from 'antd';
import { 
  UserOutlined, DeleteOutlined, KeyOutlined, 
  PlusOutlined, EditOutlined, CheckCircleOutlined,
  SearchOutlined, FilterOutlined 
} from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const AdminDashboard: React.FC = () => {
  const [employees, setEmployees] = useState([]); // Raw Data
  const [filteredEmployees, setFilteredEmployees] = useState([]); // Display Data
  const [departments, setDepartments] = useState([]); 
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterDept, setFilterDept] = useState<number | null>(null);

  const navigate = useNavigate();

  // Modals
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [hireForm] = Form.useForm();
  const [loginForm] = Form.useForm();
  
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = employees;

    // 1. Filter by Department
    if (filterDept) {
      result = result.filter((emp: any) => emp.departmentId === filterDept);
    }

    // 2. Filter by Search Text (Name or Email)
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter((emp: any) => 
        emp.firstName.toLowerCase().includes(lowerSearch) ||
        emp.lastName.toLowerCase().includes(lowerSearch) ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(lowerSearch) ||
        emp.email.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredEmployees(result);
  }, [searchText, filterDept, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employee');
      setEmployees(response.data);
      setFilteredEmployees(response.data); // Init filtered list
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/department');
      setDepartments(response.data);
    } catch (error) { console.error("Failed to load departments"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/employee/${id}`);
      message.success('EMPLOYEE DELETED');
      fetchEmployees();
    } catch (error) { message.error('DELETE FAILED'); }
  };

  // --- HIRE / EDIT LOGIC ---
  const openHireModal = (record: any = null) => {
    if (record) {
      setEditingEmployee(record);
      hireForm.setFieldsValue({
        ...record,
        joiningDate: dayjs(record.joiningDate),
        departmentId: record.department?.id
      });
    } else {
      setEditingEmployee(null);
      hireForm.resetFields();
    }
    setIsHireModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    try {
      const values = await hireForm.validateFields();
      if (editingEmployee) {
        await api.patch(`/employee/${editingEmployee.id}`, values);
        message.success('EMPLOYEE UPDATED');
      } else {
        await api.post('/employee', values);
        message.success('NEW EMPLOYEE ADDED');
      }
      setIsHireModalOpen(false);
      setEditingEmployee(null);
      hireForm.resetFields();
      fetchEmployees();
    } catch (error) { message.error('OPERATION FAILED'); }
  };

  // --- LOGIN CREATION LOGIC ---
  const openLoginModal = (record: any) => {
    setSelectedEmployee(record);
    loginForm.setFieldsValue({ email: record.email, role: 'EMPLOYEE' });
    setIsLoginModalOpen(true);
  };

  const handleCreateLogin = async () => {
    try {
      const values = await loginForm.validateFields();
      await api.post('/auth/create-user', {
        employeeId: selectedEmployee.id,
        email: values.email,
        password: values.password,
        role: values.role
      });
      message.success('LOGIN CREATED');
      setIsLoginModalOpen(false);
      loginForm.resetFields();
      fetchEmployees();
    } catch (error: any) { message.error('FAILED TO CREATE LOGIN'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 80 },
    { 
      title: 'NAME', 
      key: 'name', 
      render: (_: any, record: any) => (
        // CLICKABLE NAME -> Navigate to Details
        <div 
          style={{ cursor: 'pointer', color: '#1890ff' }} 
          onClick={() => navigate(`/employee/${record.id}`)}
        >
           <Space direction="vertical" size={0}>
             <strong style={{ fontSize: '15px' }}>{record.firstName} {record.lastName}</strong>
             {record.userId && <Tag color="green" style={{fontSize: '10px'}}>HAS LOGIN</Tag>}
           </Space>
        </div>
      )
    },
    { title: 'EMAIL', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'DESIGNATION', dataIndex: 'designation', key: 'designation' },
    { 
      title: 'DEPARTMENT', 
      dataIndex: 'department', 
      key: 'department',
      render: (dept: any) => dept ? <Tag color="blue">{dept.name.toUpperCase()}</Tag> : <Tag color="red">UNASSIGNED</Tag>
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
           <Button icon={<EditOutlined />} onClick={() => openHireModal(record)} />
           {!record.userId ? (
             <Tooltip title="Create Login Access">
               <Button icon={<KeyOutlined />} onClick={() => openLoginModal(record)} />
             </Tooltip>
           ) : (
             <Button disabled icon={<CheckCircleOutlined />} />
           )}
           <Button icon={<DeleteOutlined />} danger size="small" onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>ADMIN DASHBOARD</h2>
        <span style={{ color: 'gray' }}>Overview & Management</span>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card variant="borderless">
            <Statistic title="TOTAL EMPLOYEES" value={employees.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
           <Card variant="borderless">
             <Statistic title="SYSTEM STATUS" value="ONLINE" valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
           </Card>
        </Col>
      </Row>

      <Card 
        title="EMPLOYEE DIRECTORY" 
        variant="borderless"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openHireModal(null)}>
            NEW HIRE
          </Button>
        }
      >
        {/* --- SEARCH & FILTER BAR --- */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
           <Col span={8}>
             <Input 
               placeholder="Search by Name or Email..." 
               prefix={<SearchOutlined />} 
               value={searchText}
               onChange={e => setSearchText(e.target.value)}
               allowClear
             />
           </Col>
           <Col span={6}>
             <Select 
               placeholder="Filter by Department"
               style={{ width: '100%' }}
               allowClear
               onChange={(val) => setFilterDept(val)}
               suffixIcon={<FilterOutlined />}
             >
                {departments.map((d: any) => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
             </Select>
           </Col>
        </Row>

        <Table 
          dataSource={filteredEmployees} 
          columns={columns} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 8 }} 
        />
      </Card>

      {/* --- HIRE / EDIT MODAL --- */}
      <Modal 
        title={editingEmployee ? "EDIT EMPLOYEE" : "ADD NEW EMPLOYEE"} 
        open={isHireModalOpen} 
        onOk={handleSaveEmployee} 
        onCancel={() => setIsHireModalOpen(false)}
        okText={editingEmployee ? "UPDATE" : "CREATE"}
      >
        <Form form={hireForm} layout="vertical">
             <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                    <Input placeholder="John"/>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                    <Input placeholder="Doe"/>
                  </Form.Item>
                </Col>
             </Row>
             
             <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
               <Input placeholder="john.doe@company.com"/>
             </Form.Item>

             <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                    <Select placeholder="Select Role">
                      <Option value="Software Engineer">Software Engineer</Option>
                      <Option value="Senior Engineer">Senior Engineer</Option>
                      <Option value="Product Manager">Product Manager</Option>
                      <Option value="HR Specialist">HR Specialist</Option>
                      <Option value="Sales Representative">Sales Representative</Option>
                      <Option value="Intern">Intern</Option>
                      <Option value="Accountant">Accountant</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
                    <Select placeholder="Select Dept">
                      {departments.map((d: any) => (
                        <Option key={d.id} value={d.id}>{d.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
             </Row>

             <Form.Item name="joiningDate" label="Joined Date" rules={[{ required: true }]}>
               <DatePicker style={{ width: '100%' }} />
             </Form.Item>
        </Form>
      </Modal>

      {/* --- CREATE LOGIN MODAL --- */}
      <Modal title="CREATE LOGIN" open={isLoginModalOpen} onOk={handleCreateLogin} onCancel={() => setIsLoginModalOpen(false)} okText="ACTIVATE">
        <Form form={loginForm} layout="vertical">
            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>
            <Form.Item name="password" label="Set Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="Min 6 characters"/>
            </Form.Item>
            <Form.Item name="role" label="Access Level" rules={[{ required: true }]}>
              <Select>
                <Option value="EMPLOYEE">Standard User</Option>
                <Option value="HR_ADMIN">HR Admin</Option>
                <Option value="SUPER_ADMIN">Super Admin</Option>
              </Select>
            </Form.Item>
        </Form>
      </Modal>

    </MainLayout>
  );
};

export default AdminDashboard;