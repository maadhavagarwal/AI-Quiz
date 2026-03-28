import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher.js';

export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, institution } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if teacher exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create teacher
    const teacher = new Teacher({
      name,
      email,
      passwordHash,
      institution,
    });

    await teacher.save();

    // Generate token
    const token = jwt.sign(
      { userId: teacher._id, email: teacher.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        institution: teacher.institution,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find teacher
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, teacher.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: teacher._id, email: teacher.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        institution: teacher.institution,
        totalQuizzes: teacher.totalQuizzes,
        totalStudents: teacher.totalStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logoutTeacher = (req, res) => {
  // JWT is stateless, so logout is handled on frontend by removing token
  res.json({ message: 'Logged out successfully' });
};

export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      institution: teacher.institution,
      bio: teacher.bio,
      profileImage: teacher.profileImage,
      totalQuizzes: teacher.totalQuizzes,
      totalStudents: teacher.totalStudents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
