import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Typography, Alert } from 'antd';
import { PlusOutlined, BankOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import api from '../api/axios';

const { Text } = Typography;

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create/Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [form] = Form.useForm();

  // Delete Security Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/department');
      setDepartments(response.data);
    } catch (error) {
      console.error(error);
      message.error("COULD NOT LOAD DEPARTMENTS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // --- Handle Save (Create/Edit) ---
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingDept) {
        await api.patch(`/department/${editingDept.id}`, values);
        message.success('DEPARTMENT UPDATED');
      } else {
        await api.post('/department', values);
        message.success('DEPARTMENT CREATED');
      }
      setIsFormModalOpen(false);
      setEditingDept(null);
      form.resetFields();
      fetchDepartments();
    } catch (error) {
      message.error('OPERATION FAILED');
    }
  };

  // --- 1. Step 1: Trigger Delete (Open Warning) ---
  const promptDelete = (record: any) => {
    setDeptToDelete(record);
    setPassword('');
    setIsDeleteModalOpen(true);
  };

  // --- 2. Step 2: Confirm Delete with Password ---
  const handleSecureDelete = async () => {
    if (!password) {
      message.warning('PLEASE ENTER YOUR PASSWORD');
      return;
    }

    setDeleteLoading(true);
    try {
      // Send DELETE request with password in the body
      await api.delete(`/department/${deptToDelete.id}`, {
        data: { password: password } // Axios sends body this way for DELETE
      });
      
      message.success('DEPARTMENT DELETED');
      setIsDeleteModalOpen(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (error: any) {
      // Check if it was a password error (401)
      if (error.response && error.response.status === 401) {
        message.error('INCORRECT PASSWORD');
      } else {
        message.error('DELETE FAILED');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'NAME', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text.toUpperCase()}</strong> },
    { 
      title: 'HEADCOUNT', 
      dataIndex: '_count', 
      key: 'count',
      render: (count: any) => count?.employees || 0, 
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
            setEditingDept(record);
            form.setFieldsValue({ name: record.name });
            setIsFormModalOpen(true);
          }} />
          
          {/* Changed Popconfirm to standard onClick */}
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            size="small" 
            onClick={() => promptDelete(record)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>DEPARTMENT ADMINISTRATION</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => { setEditingDept(null); form.resetFields(); setIsFormModalOpen(true); }}
          style={{ background: '#000080', borderColor: '#000080' }}
        >
          ADD DEPARTMENT
        </Button>
      </div>

      <Table dataSource={departments} columns={columns} rowKey="id" loading={loading} bordered size="small" pagination={false} />

      {/* --- Create / Edit Modal --- */}
      <Modal
        title={editingDept ? "EDIT DEPARTMENT" : "NEW DEPARTMENT"}
        open={isFormModalOpen}
        onOk={handleSave}
        onCancel={() => setIsFormModalOpen(false)}
        okText="SAVE"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="DEPARTMENT NAME" rules={[{ required: true }]}>
            <Input prefix={<BankOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Security Delete Modal --- */}
      <Modal
        title={<Space><ExclamationCircleOutlined style={{ color: 'red' }} /> CONFIRM DELETION</Space>}
        open={isDeleteModalOpen}
        onOk={handleSecureDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="CONFIRM DELETE"
        okButtonProps={{ danger: true, loading: deleteLoading }}
      >
        {deptToDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* The Logic: Show warning if employees exist */}
            {deptToDelete._count?.employees > 0 ? (
              <Alert
                message="EMPLOYEES DETECTED"
                description={`There are ${deptToDelete._count.employees} employees currently assigned to ${deptToDelete.name}. Deleting this department will unassign them.`}
                type="warning"
                showIcon
              />
            ) : (
              <p>Are you sure you want to delete <strong>{deptToDelete.name}</strong>?</p>
            )}

            <div>
              <Text strong>Security Check:</Text>
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Enter your password to confirm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginTop: '5px' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default Departments;