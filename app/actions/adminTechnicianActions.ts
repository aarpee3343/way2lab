'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// --- 1. GET TECHNICIANS LIST ---
export async function getTechnicians() {
  const technicians = await prisma.technician.findMany({
    include: {
      labs: {
        include: {
          lab: { select: { id: true, labName: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  return technicians.map(t => ({
    ...t,
    labNames: t.labs.map(l => l.lab.labName).join(', '),
    labCount: t.labs.length
  }));
}

// --- 2. GET STATS ---
export async function getTechnicianStats() {
  const [total, active, inactive, labsCount] = await Promise.all([
    prisma.technician.count(),
    prisma.technician.count({ where: { isActive: true } }),
    prisma.technician.count({ where: { isActive: false } }),
    prisma.lab.count()
  ]);
  return { total, active, inactive, labsCount };
}

// --- 3. GET FORM DATA (Labs List) ---
export async function getTechnicianFormData() {
  return await prisma.lab.findMany({
    where: { status: 'Active' },
    select: { id: true, labName: true, city: true },
    orderBy: { labName: 'asc' }
  });
}

// --- 4. CREATE TECHNICIAN ---
export async function createTechnicianAction(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const address = formData.get('address') as string;
    // Handle multiple checkboxes for lab_ids
    const labIds = formData.getAll('lab_ids').map(id => parseInt(id as string));

    // Validation
    if (!name || !phone || !username || !password || labIds.length === 0) {
      return { success: false, error: "Missing required fields" };
    }

    // Check Duplicate Username
    const existing = await prisma.technician.findUnique({ where: { username } });
    if (existing) return { success: false, error: "Username already exists" };

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.technician.create({
      data: {
        name,
        phone,
        email,
        username,
        password: hashedPassword,
        address,
        isActive: true,
        labs: {
          create: labIds.map(labId => ({ labId }))
        }
      }
    });

    revalidatePath('/admin/technicians');
    return { success: true };
  } catch (error: any) {
    console.error("Create Tech Error:", error);
    return { success: false, error: "Failed to create technician" };
  }
}

// --- 5. GET TECHNICIAN BY ID ---
export async function getTechnicianById(id: number) {
  const tech = await prisma.technician.findUnique({
    where: { id },
    include: {
      labs: { select: { labId: true } }
    }
  });

  if (!tech) return null;

  return {
    ...tech,
    assignedLabIds: tech.labs.map(l => l.labId)
  };
}

// --- 6. UPDATE TECHNICIAN ---
export async function updateTechnicianAction(id: number, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const address = formData.get('address') as string;
    const isActive = formData.get('is_active') === '1';
    const labIds = formData.getAll('lab_ids').map(id => parseInt(id as string));

    // Update Logic
    const updateData: any = {
      name, phone, email, username, address, isActive
    };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Transaction to update details AND reset lab assignments
    await prisma.$transaction(async (tx) => {
      await tx.technician.update({
        where: { id },
        data: updateData
      });

      // Reset Labs (Delete all existing links, then add selected ones)
      await tx.technicianLab.deleteMany({ where: { technicianId: id } });
      
      if (labIds.length > 0) {
        await tx.technicianLab.createMany({
          data: labIds.map(labId => ({ technicianId: id, labId }))
        });
      }
    });

    revalidatePath('/admin/technicians');
    return { success: true };
  } catch (error: any) {
    console.error("Update Tech Error:", error);
    return { success: false, error: "Failed to update technician" };
  }
}

// --- 7. DELETE TECHNICIAN ---
export async function deleteTechnicianAction(id: number) {
  try {
    // Remove relations first (TechnicianLab)
    await prisma.technicianLab.deleteMany({ where: { technicianId: id } }); 
    // Delete the technician
    await prisma.technician.delete({ where: { id } });
    
    revalidatePath('/admin/technicians');
    return { success: true };
  } catch (error) {
    console.error("Delete Tech Error:", error);
    return { success: false, error: "Failed to delete technician" };
  }
}