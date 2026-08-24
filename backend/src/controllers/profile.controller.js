export const getProfile = async (req, res) => {
  return res.json({
    fullName: 'Lương Hải Vân',
    studentCode: 'B23DCAT332',
    className: 'D23CQAT02-B',
    subject: 'IoT và Ứng dụng',
    instructor: 'TS. Nguyễn Quốc Uy',
    academicYear: '2026-2027',
    links: {
      github: 'https://github.com/ptit-iot/smart-home-2026',
      figma: 'https://figma.com/@ptit_iot_design',
      swagger: 'http://localhost:5000/api-docs',
      pdfReport: '/docs/bao_cao_btl_iot.pdf',
    },
  });
};
