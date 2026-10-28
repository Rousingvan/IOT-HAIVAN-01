import React, { useState, useEffect } from 'react';
import { Card, Typography, InputNumber, Space, Button, Modal, Table, Tag, message } from 'antd';
import {
  CloudFilled,
  CloudOutlined,
  AlertFilled,
  HistoryOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const { Title, Text } = Typography;

/**
 * ==============================================================================
 * COMPONENT: DustAlertBox (ĐỀ SỐ 2: Cảnh Báo Độ Bụi >= 0.70 mg/m3)
 * ==============================================================================
 * 1. Khi bụi < 0.70 mg/m3: Trạng thái An toàn, LED tắt hoặc ở chế độ thủ công.
 * 2. Khi bụi >= 0.70 mg/m3: Cảnh báo nhấp nháy đỏ chu kỳ 2s liên tục.
 * 3. Hỗ trợ thay đổi ngưỡng Y ngay trên giao diện.
 * 4. Nút xem thống kê số lần cảnh báo theo Ngày / Tháng.
 * ==============================================================================
 */
export default function DustAlertBox({ currentDust = 0 }) {
  const navigate = useNavigate();

  // 1. Ngưỡng độ bụi Y (mặc định 0.70 mg/m3)
  const [threshold, setThreshold] = useState(() => {
    return Number(localStorage.getItem('iot_dust_threshold_y') || 0.70);
  });

  const [saving, setSaving] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsData, setStatsData] = useState({ daily: [], monthly: [], totalAlerts: 0 });

  // Tải cấu hình ngưỡng từ Backend khi mount
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const val = await apiService.getDustThreshold();
        if (typeof val === 'number') {
          setThreshold(val);
          localStorage.setItem('iot_dust_threshold_y', String(val));
        }
      } catch (e) {
        // Fallback giữ nguyên từ localStorage
      }
    };
    fetchThreshold();
  }, []);

  // Cập nhật ngưỡng bụi Y
  const handleSaveThreshold = async (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      message.error('Vui lòng nhập ngưỡng độ bụi hợp lệ (>= 0 mg/m³)!');
      return;
    }
    setSaving(true);
    try {
      await apiService.updateDustThreshold(num);
      setThreshold(num);
      message.success(`Đã cập nhật ngưỡng cảnh báo bụi Y = ${num} mg/m³`);
    } catch {
      setThreshold(num);
      message.success(`Đã lưu ngưỡng Y = ${num} mg/m³ vào LocalStorage!`);
    } finally {
      setSaving(false);
    }
  };

  // Mở modal thống kê
  const handleOpenStats = async () => {
    setStatsModalOpen(true);
    setLoadingStats(true);
    try {
      const res = await apiService.getDustAlertStats();
      setStatsData(res);
    } catch (err) {
      message.warning('Chưa thể tải dữ liệu thống kê cảnh báo từ máy chủ.');
    } finally {
      setLoadingStats(false);
    }
  };

  const isAlerting = Number(currentDust) >= Number(threshold);

  const dailyColumns = [
    {
      title: 'Ngày (DD/MM/YYYY)',
      dataIndex: 'date',
      key: 'date',
      render: (t) => <strong style={{ color: '#1F2937' }}>{t}</strong>,
    },
    {
      title: 'Số lần vượt ngưỡng',
      dataIndex: 'count',
      key: 'count',
      render: (c) => <Tag color="error">{c} lần</Tag>,
    },
    {
      title: 'Thời điểm gần nhất',
      dataIndex: 'latestTime',
      key: 'latestTime',
      render: (time) => (time ? new Date(time).toLocaleTimeString('vi-VN') : '--'),
    },
  ];

  const monthlyColumns = [
    {
      title: 'Tháng (MM/YYYY)',
      dataIndex: 'month',
      key: 'month',
      render: (t) => <strong style={{ color: '#6366F1' }}>{t}</strong>,
    },
    {
      title: 'Tổng số lần vượt ngưỡng',
      dataIndex: 'count',
      key: 'count',
      render: (c) => <Tag color="purple">{c} lần</Tag>,
    },
  ];

  return (
    <>
      <style>
        {`
          @keyframes dustBlinkCycle2s {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
              box-shadow: 0 0 16px 4px rgba(220, 38, 38, 0.8);
            }
            50% {
              opacity: 0.25;
              transform: scale(0.96);
              box-shadow: 0 0 2px 0 rgba(220, 38, 38, 0.1);
            }
          }
          .dust-alert-blinking-2s {
            animation: dustBlinkCycle2s 2s infinite ease-in-out;
          }
        `}
      </style>

      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: isAlerting ? '1.5px solid #F87171' : '1px solid #E5E7EB',
          boxShadow: isAlerting
            ? '0 4px 14px rgba(239, 68, 68, 0.2)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hàng Tiêu Đề + Cấu hình Ngưỡng Y */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isAlerting ? (
                <AlertFilled style={{ fontSize: 20, color: '#DC2626' }} />
              ) : (
                <CloudFilled style={{ fontSize: 20, color: '#8B5CF6' }} />
              )}
              <Title level={5} style={{ margin: 0, fontSize: 15, color: '#1F2937' }}>
                Cảnh Báo Độ Bụi (Dust Sensor)
              </Title>
              {isAlerting ? (
                <Tag color="error">VƯỢT NGƯỠNG (≥ {threshold})</Tag>
              ) : (
                <Tag color="success">AN TOÀN (&lt; {threshold})</Tag>
              )}
            </div>

            {/* Input Cấu hình ngưỡng Y */}
            <Space size="small">
              <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>
                Ngưỡng Y (mg/m³):
              </Text>
              <InputNumber
                size="small"
                min={0}
                max={1.0}
                step={0.05}
                value={threshold}
                onChange={(val) => val !== null && handleSaveThreshold(val)}
                disabled={saving}
                style={{ width: 80 }}
              />
            </Space>
          </div>

          {/* Hàng Trạng Thái Cảnh Báo Realtime */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: isAlerting ? '#FEF2F2' : '#F5F3FF',
              border: isAlerting ? '1px solid #FCA5A5' : '1px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className={isAlerting ? 'dust-alert-blinking-2s' : ''}
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: '50%',
                  background: isAlerting ? '#DC2626' : '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isAlerting
                    ? '0 0 16px rgba(220, 38, 38, 0.8)'
                    : '0 0 8px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.3s ease',
                }}
              >
                <CloudFilled style={{ fontSize: 24, color: '#FFFFFF' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: 13, color: isAlerting ? '#991B1B' : '#5B21B6', display: 'flex', gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>Trạng thái LED (D21):</span>
                  <strong style={{ fontWeight: 700 }}>
                    {isAlerting ? 'NHẤP NHÁY (Chu kỳ 2s)' : 'BÌNH THƯỜNG / TẮT'}
                  </strong>
                </div>
                <div style={{ fontSize: 12, color: isAlerting ? '#B91C1C' : '#4C1D95', display: 'flex', gap: 6 }}>
                  <span style={{ fontWeight: 500 }}>Độ bụi hiện tại:</span>
                  <strong style={{ fontSize: 13, color: isAlerting ? '#DC2626' : '#7C3AED' }}>
                    {currentDust} mg/m³
                  </strong>
                  <span style={{ fontSize: 11, color: isAlerting ? '#DC2626' : '#6B7280' }}>
                    {isAlerting ? `(≥ Ngưỡng ${threshold} mg/m³)` : `(< Ngưỡng ${threshold} mg/m³)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Các nút xem Lịch sử & Thống kê */}
            <Space size="small">
              <Button
                size="small"
                icon={<BarChartOutlined />}
                onClick={handleOpenStats}
                style={{ fontSize: 12 }}
              >
                Thống Kê
              </Button>
              <Button
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => navigate('/action-history?deviceCode=DUST_ALERT')}
                style={{ fontSize: 12 }}
              >
                Lịch Sử
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Modal Thống Kê Số Lần Cảnh Báo Gom Theo Ngày & Tháng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartOutlined style={{ color: '#8B5CF6', fontSize: 20 }} />
            <span>Thống Kê Cảnh Báo Độ Bụi (Theo Ngày & Tháng)</span>
          </div>
        }
        open={statsModalOpen}
        onCancel={() => setStatsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setStatsModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={700}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8 }}>
            <Text style={{ fontSize: 14 }}>
              Tổng số lần vượt ngưỡng (&gt;= {threshold} mg/m³):{' '}
              <strong style={{ color: '#DC2626', fontSize: 16 }}>{statsData.totalAlerts || 0}</strong> lần.
            </Text>
          </div>

          <div>
            <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14, color: '#374151' }}>
              1. Thống kê theo Ngày (15 ngày gần nhất)
            </Title>
            <Table
              dataSource={statsData.daily || []}
              columns={dailyColumns}
              rowKey="date"
              size="small"
              pagination={false}
              loading={loadingStats}
              locale={{ emptyText: 'Chưa có dữ liệu cảnh báo' }}
            />
          </div>

          <div>
            <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 14, color: '#374151' }}>
              2. Thống kê theo Tháng
            </Title>
            <Table
              dataSource={statsData.monthly || []}
              columns={monthlyColumns}
              rowKey="month"
              size="small"
              pagination={false}
              loading={loadingStats}
              locale={{ emptyText: 'Chưa có dữ liệu cảnh báo' }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
