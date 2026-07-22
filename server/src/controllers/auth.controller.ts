import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserModel } from '../models/User.js';
import type { AuthPayload } from '../middleware/auth.middleware.js';
import { getRedirectPath } from '../utils/redirect.js';

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '7d';

// Cookie configuration
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Generate JWT token and set it as an HTTP-only cookie.
 */
function setTokenCookie(res: Response, payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
  res.cookie('token', token, cookieOptions);
  return token;
}

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
export async function register(req: Request, res: Response): Promise<void> {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }

  const { name, email, password } = req.body;

  try {
    const User = getUserModel();
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (force citizen role)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'citizen',
    });

    // Generate JWT and set cookie
    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = setTokenCookie(res, payload);

    const userJson = user.toJSON();
    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: userJson,
      redirectTo: getRedirectPath(userJson),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns JWT in cookie.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    const User = getUserModel();
    // Find user (explicitly select passwordHash since toJSON strips it)
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Generate JWT and set cookie
    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = setTokenCookie(res, payload);

    const userJson = user.toJSON();
    res.json({
      message: 'Login successful.',
      token,
      user: userJson,
      redirectTo: getRedirectPath(userJson),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

/**
 * POST /api/auth/create-city-authority
 * Allows state authority to create a city authority account.
 */
export async function createCityAuthority(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }

  const { name, email, city } = req.body;

  try {
    const User = getUserModel();
    if (!req.user || req.user.role !== 'state_authority') {
      res.status(403).json({ message: 'Forbidden. Only state authorities can create city authorities.' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Generate random 12-char password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    // Retrieve creator to inherit state scope
    const creator = await User.findById(req.user.userId);
    const state = creator ? creator.state : null;

    // Create the city authority
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'city_authority',
      city,
      state,
      isCredentialGenerated: true,
      tempPasswordChanged: false,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: 'City Authority created successfully.',
      tempPassword, // GitHub PAT style: return once in register response
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Create City Authority error:', error);
    res.status(500).json({ message: 'Server error during city authority creation.' });
  }
}

/**
 * POST /api/auth/change-password
 * Forces password update for temporary passwords.
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    return;
  }

  const { newPassword } = req.body;

  try {
    const User = getUserModel();
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        passwordHash,
        tempPasswordChanged: true,
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const userJson = user.toJSON();
    res.json({
      message: 'Password changed successfully.',
      user: userJson,
      redirectTo: getRedirectPath(userJson),
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password update.' });
  }
}

/**
 * GET /api/auth/city-authorities
 * Lists city authority accounts created by the logged-in state authority.
 */
export async function listCityAuthorities(req: Request, res: Response): Promise<void> {
  try {
    const User = getUserModel();
    if (!req.user || req.user.role !== 'state_authority') {
      res.status(403).json({ message: 'Forbidden. Only state authorities can list city authorities.' });
      return;
    }

    const authorities = await User.find({
      createdBy: req.user.userId,
      role: 'city_authority',
    }).sort({ createdAt: -1 });

    res.json({
      authorities: authorities.map((a: { toJSON: () => unknown }) => a.toJSON()),
    });
  } catch (error) {
    console.error('List city authorities error:', error);
    res.status(500).json({ message: 'Server error while fetching city authorities.' });
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const User = getUserModel();
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
}

/**
 * POST /api/auth/logout
 * Clears the authentication cookie.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.cookie('token', '', {
    ...cookieOptions,
    maxAge: 0,
  });
  res.json({ message: 'Logged out successfully.' });
}
