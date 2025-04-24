import { FastifyInstance } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/authSchemas';
import { generateCode } from '../utils/generateCode';
import { sendPasswordResetCodeEmail } from '../services/emailService';
import { users } from '../database/mockUsers';
import { v4 as uuidv4 } from 'uuid';

export default async function authRoutes(fastify: FastifyInstance) {

  // Login route
  fastify.post('/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send(parsed.error);
    }

    const { email, password } = parsed.data;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).send({ 
        message: 'Invalid credentials',
        details: 'The email or password you entered is incorrect'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send({ 
        message: 'Invalid credentials',
        details: 'The email or password you entered is incorrect'
      });
    }

    // Optional: Generate a token here if using JWT

    return res.send({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  });


  // Step 1 - Request password reset code
  fastify.post('/auth/request-reset', async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send({ 
        message: 'Invalid request data',
        errors: parsed.error.errors 
      });
    }

    const { cnp, matriculationNumber } = parsed.data;
    const user = users.find(u => u.cnp === cnp && u.matriculationNumber === matriculationNumber);
    if (!user) {
      return res.code(404).send({ message: 'User not found' });
    }

    const code = generateCode();
    user.resetCode = code;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000; // valid for 10 minutes

    await sendPasswordResetCodeEmail(user.email, code);
    return res.send({ message: 'Verification code sent to your email' });
  });

  // Step 2 - Verify reset code
  fastify.post('/auth/verify-code', async (req, res) => {
    const { email, code } = req.body as { email: string; code: string };

    const user = users.find(u => u.email === email && u.resetCode === code);
    if (!user || !user.resetCodeExpiry || Date.now() > user.resetCodeExpiry) {
      return res.code(400).send({ 
        message: 'Invalid verification code',
        details: 'The code you entered is invalid or has expired. Please request a new code.'
      });
    }

    return res.send({ message: 'Verification code is valid' });
  });

  // Step 3 - Set new password
  fastify.post('/auth/reset-password', async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).send(parsed.error);
    }

    const { cnp, matriculationNumber, newPassword } = parsed.data;
    const user = users.find(u => u.cnp === cnp && u.matriculationNumber === matriculationNumber);

    if (!user || !user.resetCode || !user.resetCodeExpiry || Date.now() > user.resetCodeExpiry) {
      return res.code(400).send({ 
        message: 'Password reset failed',
        details: 'The password reset request is not authorized or the verification code has expired. Please start the process again.'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    return res.send({ message: 'Password updated successfully' });
  });


  /// Add student on portal app
  fastify.post('/auth/register', async (req, res) => {
    const body = req.body as any;

    const existingUser = users.find(u => u.email === body.email);
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = {
      id: uuidv4(),
      email: body.email,
      password: hashedPassword,
      cnp: body.cnp,
      matriculationNumber: body.matriculationNumber,
      name: body.name,
      role: 'Student' as const, // 🛠️ Fix is here
      phone: body.phone || '',
      address: body.address || '',
      academicInfo: {
        program: body.program || 'Computer Science',
        semester: body.semester || 8,
        groupName: body.groupName || '3141',
        subgroupIndex: body.subgroupIndex || 'a',
        studentId: body.matriculationNumber,
        advisor: body.advisor || 'Unknown',
        gpa: body.gpa || 0
      }
    };

    users.push(newUser);
    return res.send({ message: 'User registered successfully', userId: newUser.id });
  });

}