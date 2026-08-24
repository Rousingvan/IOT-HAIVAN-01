import React, { useState } from 'react';
import { Card, Input, Button, Space, Typography, Tag, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function VariableTimeRangeFilter({ onFilter, onReset, loading = false, value = '' }) {
  const [searchString, setSearchString] = useState(value || '');

  const handleSearch = () => {
    if (!searchString || !searchString.trim()) {
      onReset && onReset();
      return;
    }
    onFilter && onFilter(searchString.trim());
  };

  const handleReset = () => {
    setSearchString('');
    onReset && onReset();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        marginBottom: 16,
      }}
      bodyStyle={{ padding: '14px 18px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <Space size="small">
          <ClockCircleOutlined style={{ color: '#E05318', fontSize: 16 }} />
          <Text strong style={{ color: '#1F2937', fontSize: 13 }}>
            Tìm kiếm theo mốc thời gian
          </Text>
        </Space>
        <Space size="small">
        </Space>
      </div>

      <Row gutter={[10, 10]} align="middle">
        <Col xs={24} sm={18} md={19} lg={20}>
          <Input
            placeholder="Nhập chuỗi thời gian (VD: 19/08/2026, 15:30, 19/08/2026 15:30:20...)"
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            onKeyDown={handleKeyDown}
            allowClear
            size="middle"
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            style={{ borderRadius: 8 }}
          />
        </Col>
        <Col xs={24} sm={6} md={5} lg={4} style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={handleSearch}
            style={{ background: '#E05318', borderColor: '#E05318', flex: 1, borderRadius: 8, fontWeight: 500 }}
          >
            Lọc
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            title="Đặt lại"
            style={{ borderRadius: 8 }}
          />
        </Col>
      </Row>
    </Card>
  );
}

