import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, message } from 'antd';
import dayjs from 'dayjs'; // You need this for Date conversion
import api from '../api/axios';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: any; // <--- NEW: Optional data for editing
}

const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  employeeToEdit 
}) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]); 
  const [form] = Form.useForm();
  
  const designation = Form.useWatch('designation', form);

  // 1. Fetch Departments
  useEffect(() => {
    if (isOpen) {
      api.get('/department')
        .then(res => setDepartments(res.data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  // 2. NEW: Handle Edit Mode (Pre-fill Form)
  useEffect(() => {
    if (isOpen && employeeToEdit) {
      // We are Editing! Fill the form.
      form.setFieldsValue({
        firstName: employeeToEdit.firstName,
        lastName: employeeToEdit.lastName,
        email: employeeToEdit.email, // Note: You might want to disable email editing if it's a login ID
        designation: employeeToEdit.designation,
        // Convert string date to DayJS object for DatePicker
        joiningDate: dayjs(employeeToEdit.joiningDate),
        // Extract ID from the department object
        departmentId: employeeToEdit.department?.id
      });
    } else {
      // We are Creating! Clear the form.
      form.resetFields();
    }
  }, [isOpen, employeeToEdit, form]);

  // 3. Smart Auto-Select (Only run if NOT editing to avoid overwriting user data)
  useEffect(() => {
    if (employeeToEdit) return; // Don't auto-change things during edit

    const smartMapping: Record<string, string> = {
      'Software Engineer': 'Engineering',
      'HR Manager': 'Human Resources',
      'Intern': 'Engineering',
      'Accountant': 'Finance',
    };

    if (designation && departments.length > 0) {
      const targetDeptName = smartMapping[designation];
      if (targetDeptName) {
        const targetDept = departments.find((d: any) => 
          d.name.toLowerCase() === targetDeptName.toLowerCase()
        );
        if (targetDept) {
          form.setFieldsValue({ departmentId: targetDept.id });
        }
      }
    }
  }, [designation, departments, form, employeeToEdit]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        joiningDate: values.joiningDate.format('YYYY-MM-DD'),
        departmentId: values.departmentId
      };

      if (employeeToEdit) {
        // --- EDIT MODE ---
        await api.patch(`/employee/${employeeToEdit.id}`, payload);
        message.success('RECORD UPDATED');
      } else {
        // --- CREATE MODE ---
        await api.post('/employee', payload);
        message.success('RECORD SAVED');
      }
      
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      message.error('OPERATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={employeeToEdit ? "EDIT EMPLOYEE PROFILE" : "NEW EMPLOYEE ENTRY"}
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={employeeToEdit ? "UPDATE RECORD" : "SAVE RECORD"}
      cancelText="ABORT"
      styles={{ mask: { backgroundColor: 'rgba(0,0,0,0.7)' }}}
      width={600}
      centered
    >
      <Form form={form} layout="vertical" initialValues={{ designation: 'Trainee' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="firstName" label="FIRST NAME" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="LAST NAME" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </div>

        {/* Disable Email editing if updating (optional security best practice) */}
        <Form.Item name="email" label="CORPORATE EMAIL" rules={[{ required: true, type: 'email' }]}>
          <Input disabled={!!employeeToEdit} /> 
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item name="designation" label="DESIGNATION" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Software Engineer">Software Engineer</Select.Option>
              <Select.Option value="HR Manager">HR Manager</Select.Option>
              <Select.Option value="Intern">Intern</Select.Option>
              <Select.Option value="Accountant">Accountant</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="joiningDate" label="DATE OF JOINING" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="departmentId" label="DEPARTMENT">
          <Select placeholder="SELECT DEPARTMENT">
            {departments.map((dept: any) => (
              <Select.Option key={dept.id} value={dept.id}>
                {dept.name.toUpperCase()}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default CreateEmployeeModal;