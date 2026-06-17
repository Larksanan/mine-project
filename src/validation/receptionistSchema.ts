import * as z from 'zod';

export const receptionistSchema = z.object({
  employeeId: z
    .string()
    .nonempty('Employee ID is required')
    .regex(/^REC-\d{4}-\d{4}$/, 'Employee ID must be in REC-YYYY-XXXX format'),
  shift: z.enum(['MORNING', 'EVENING', 'NIGHT', 'FULL_DAY']),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  hireDate: z.string().nonempty('Hire date is required'),
  department: z.string().optional(),
  employmentStatus: z
    .enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'])
    .optional(),
  salary: z.number().min(0, 'Salary must be positive').optional(),
  notes: z.string().optional(),
});

export type ReceptionistFormData = z.infer<typeof receptionistSchema>;
