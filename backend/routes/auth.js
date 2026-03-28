import express from 'express';
import { registerTeacher, loginTeacher, logoutTeacher, getTeacherProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.post('/logout', authMiddleware, logoutTeacher);
router.get('/profile', authMiddleware, getTeacherProfile);

export default router;
