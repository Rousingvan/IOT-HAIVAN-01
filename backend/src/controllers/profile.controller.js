export const getProfile = async (req, res) => {
  return res.json({
    fullName: 'Lương Hải Vân',
    studentCode: 'B23DCAT332',
    className: 'D23CQAT02-B',
    subject: 'IoT và Ứng dụng',
    instructor: 'TS. Nguyễn Quốc Uy',
    academicYear: '2026-2027',
    links: {
      github: 'https://github.com/Rousingvan/IOT-HAIVAN-01',
      figma: 'https://www.figma.com/design/L0E1y6JcOK4M4DQPgc4jud/IoT-B23DCAT332?node-id=0-1&t=8RONHZNqQErP8w67-1',
      swagger: 'http://localhost:5000/api-docs',
      pdfReport: '/docs/Bao_cao_IOT_Luong_Hai_Van.pdf',
    },
  });
};
