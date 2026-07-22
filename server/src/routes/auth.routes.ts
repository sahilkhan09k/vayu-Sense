import { Router } from 'express';
import { register, login, createCityAuthority, listCityAuthorities, changePassword, getMe, logout } from '../controllers/auth.controller.js';
import { registerRules, loginRules, createCityAuthorityRules, changePasswordRules } from '../validators/auth.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.get('/city-authorities', authMiddleware, listCityAuthorities);
router.post('/create-city-authority', authMiddleware, createCityAuthorityRules, createCityAuthority);
router.post('/change-password', authMiddleware, changePasswordRules, changePassword);

export default router;

