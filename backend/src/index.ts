import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';


dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'kaushalyaa';

app.use(cors());
app.use(express.json());

// Enhanced Validation Schemas
const userSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  email: z.string().email("Invalid email address")
});

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  position: z.string().min(2, "Position must be at least 2 characters"),
  departmentId: z.number().min(1, "Department ID is required"),
  salary: z.number().min(0, "Salary cannot be negative"),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});
// Improved error handler middleware
const handleValidationError = (error: z.ZodError, res: express.Response) => {
  return res.status(400).json({
    error: 'Validation failed',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  });
};


const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};


app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware to authenticate JWT tokens
const authenticate = (req: any, res: any, next: any) => {

  // Skip authentication for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }



  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Middleware to authorize roles
const authorize = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};






// Add this after your existing imports
const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
});

// Get a single department by ID
app.get('/departments/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const department = await prisma.department.findUnique({
      where: { id: parseInt(id) },
    });
    if (department) {
      res.json(department);
    } else {
      res.status(404).json({ error: 'Department not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get all departments
app.get('/departments', authenticate, async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Add a new department (admin only)
app.post('/departments', authenticate, authorize(['admin']), async (req, res):Promise<any> => {
  try {
    const validatedData = departmentSchema.parse(req.body);
    const department = await prisma.department.create({
      data: validatedData,
    });
    res.json(department);
  } catch (error) {
    if (error instanceof z.ZodError) return handleValidationError(error, res);
    res.status(500).json({ error: 'Failed to create department', details: error });
  }
});

// Update a department (admin only)
app.put('/departments/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const validatedData = departmentSchema.parse(req.body);
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });
    res.json(department);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input or department not found' });
  }
});

// Delete a department (admin only)
// app.delete('/departments/:id', authenticate, authorize(['admin']), async (req, res) => {
//   const { id } = req.params;
//   try {
//     await prisma.department.delete({
//       where: { id: parseInt(id) },
//     });
//     res.json({ message: 'Department deleted successfully' });
//   } catch (error) {
//     res.status(404).json({ error: 'Department not found' });
//   }
// });





// Add this to index.ts
app.get('/current-user', authenticate, async (req: any, res):Promise<any> => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});









// Enhanced Registration Endpoint
app.post('/register', async (req, res): Promise<any> => {
  try {
    const validatedData = userSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Username already exists',
        details: [{ field: 'username', message: 'This username is already taken' }]
      });
    }

    // Find employee by email
    const employee = await prisma.employee.findUnique({
      where: { email: validatedData.email }
    });

    if (!employee) {
      return res.status(404).json({
        error: 'Email not found',
        details: [{ field: 'email', message: 'This email is not registered as an employee' }]
      });
    }

    // Check if employee already has a user account
    const existingEmployeeUser = await prisma.user.findFirst({
      where: { employeeId: employee.id }
    });

    if (existingEmployeeUser) {
      return res.status(409).json({
        error: 'Account exists',
        details: [{ field: 'email', message: 'An account already exists for this employee' }]
      });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
    
    // Create user with employee relation
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        role: 'employee',
        employeeId: employee.id // Link to employee record
      },
      include: {
        employee: true // Include employee details in response
      }
    });

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) return handleValidationError(error, res);
    res.status(500).json({ error: 'Registration failed', details: error });
  }
});

// Enhanced Login Endpoint
app.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;
    
    // First try to find user by username
    let user = await prisma.user.findUnique({ 
      where: { username },
      include: {
        employee: true
      }
    });

    // If no user found by username, try to find by employee email
    if (!user) {
      const employee = await prisma.employee.findUnique({
        where: { email: username },
        include: {
          user: {
            include: {
              employee: true
            }
          }
        }
      });

      if (employee?.user) {
        user = employee.user;
      }
    }

    if (!user) {
      return res.status(404).json({
        error: 'Authentication failed',
        details: [{ field: 'username', message: 'User not found' }]
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        details: [{ field: 'password', message: 'Invalid password' }]
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        employeeId: user.employeeId 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee // Include employee details in the response
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) return handleValidationError(error, res);
    res.status(500).json({ error: 'Login failed', details: error });
  }
});


// Get all employees (protected route)
app.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get a single employee by ID (protected route)
app.get('/employees/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Add a new employee (admin only)
app.post('/employees', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const validatedData = employeeSchema.parse(req.body);
    const employee = await prisma.employee.create({
      data: validatedData,
    });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error });
  }
});

app.put('/employees/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const validatedData = employeeSchema.parse(req.body);
    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: 'Invalid input or employee not found' });
  }
});

// Delete an employee (admin only)
app.delete('/employees/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.employee.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(404).json({ error: 'Employee not found' });
  }
});




// Add this after your existing imports
const attendanceSchema = z.object({
  employeeId: z.number().min(1, "Employee ID is required"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/, "Invalid date format"), // ISO 8601 format
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/).optional(), // Optional check-out
});

// Add a check-in record (admin only)
app.post('/attendance/check-in', authenticate, authorize(['admin']), async (req, res):Promise<any>=> {
  try {
    const validatedData = attendanceSchema.parse(req.body);
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: validatedData.employeeId,
        checkIn: new Date(validatedData.checkIn), // Convert string to Date
      },
    });
    res.json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) return handleValidationError(error, res);
    res.status(500).json({ error: 'Failed to add check-in record', details: error });
  }
});

// Add a check-out record (admin only)
app.post('/attendance/check-out', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { employeeId, checkOut } = req.body;
    const attendance = await prisma.attendance.updateMany({
      where: {
        employeeId,
        checkOut: null, // Only update records where check-out is not set
      },
      data: {
        checkOut: new Date(checkOut), // Convert string to Date
      },
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add check-out record', details: error });
  }
});

// Get attendance records for a specific employee (admin only)
app.get('/attendance/:employeeId', authenticate, authorize(['admin']), async (req, res) => {
  const { employeeId } = req.params;
  try {
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { date: 'desc' }, // Sort by date descending
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records', details: error });
  }
});

// Get all attendance records (admin only)
app.get('/attendance', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' }, // Sort by date descending
      take: 100, // Limit to recent records for better performance
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance records', details: error });
  }
});








// Add these endpoints to your index.ts file

// Leave request validation schema
const leaveSchema = z.object({
  employeeId: z.number().min(1, "Employee ID is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  type: z.enum(["sick", "vacation", "personal"], {
    errorMap: () => ({ message: "Invalid leave type" }),
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
});

// Get all leaves (admin sees all, employees see only their own)

// Get all leaves (admin sees all, employees see only their own)
app.get('/leaves', authenticate, async (req: any, res):Promise<any> => {
  try {
    const userId = req.user.userId;
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true // Include the employee relation
      }
    });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    let leaves;
    if (userRecord.role === 'admin') {
      leaves = await prisma.leave.findMany({
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // For employees, use the employeeId directly from the user record
      if (!userRecord.employeeId) {
        return res.status(404).json({ error: 'Employee record not found' });
      }

      leaves = await prisma.leave.findMany({
        where: {
          employeeId: userRecord.employeeId,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});


// Submit a leave request
app.post('/leaves', authenticate, async (req: any, res):Promise<any>  => {
  try {
    const validatedData = leaveSchema.parse(req.body);
    
    // Verify the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const leave = await prisma.leave.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
      },
    });

    res.status(201).json(leave);
  } catch (error) {
    if (error instanceof z.ZodError) return handleValidationError(error, res);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Update leave status (admin only)
app.put('/leaves/:id', authenticate, authorize(['admin']), async (req: any, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  try {
    const leave = await prisma.leave.update({
      where: { id: parseInt(id) },
      data: {
        status,
        adminNote,
      },
    });
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// Delete a leave request (admin only)
app.delete('/leaves/:id', authenticate, authorize(['admin']), async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.leave.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});



app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});