import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';

export const register = async (req, res) => {
  const { username, password, fullName, studentCode, className } = req.body;
  if (!username || !password || !fullName || !studentCode || !className) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tất cả các trường thông tin!' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      fullName,
      studentCode,
      className,
      role: 'STUDENT',
    });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản sinh viên thành công!',
      token,
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        studentCode: newUser.studentCode,
        className: newUser.className,
        role: newUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      // Fallback cho tài khoản demo nếu chưa seed DB
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username: 'admin', role: 'ADMIN' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        return res.json({
          success: true,
          token,
          user: {
            username: 'admin',
            fullName: 'Lương Hải Vân',
            studentCode: 'B23DCAT332',
            className: 'D23CQAT02-B',
            role: 'ADMIN',
          },
        });
      }
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.json({
      success: true,
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        studentCode: user.studentCode,
        className: user.className,
        role: user.role || 'STUDENT',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

