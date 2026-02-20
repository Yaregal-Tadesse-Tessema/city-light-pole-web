import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'ADMIN' | 'MAINTENANCE_ENGINEER' | 'SUPERVISOR_VIEWER';
};

function normalizeApiBase(raw: string): string {
  const base = raw.replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

const RAW_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3011';
const API_BASE_URL = normalizeApiBase(RAW_BASE_URL);

const usersToSeed: SeedUser[] = [
  {
    role: 'ADMIN',
    email: 'admin@city.gov',
    password: 'admin123',
    fullName: 'System Admin',
    phone: '0900000000',
  },
  {
    role: 'MAINTENANCE_ENGINEER',
    email: 'engineer@city.gov',
    password: 'engineer123',
    fullName: 'Maintenance Engineer',
    phone: '0911111111',
  },
  {
    role: 'SUPERVISOR_VIEWER',
    email: 'viewer@city.gov',
    password: 'viewer123',
    fullName: 'Supervisor Viewer',
    phone: '0922222222',
  },
];

async function signupIfMissing(u: SeedUser) {
  try {
    await axios.post(`${API_BASE_URL}/auth/signup`, {
      email: u.email,
      password: u.password,
      fullName: u.fullName,
      phone: u.phone,
    });
    console.log(`✅ Created user: ${u.email}`);
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Signup failed';
    const status = err?.response?.status;

    // Common cases: already exists / conflict / validation
    if (status === 409 || /exist/i.test(String(msg))) {
      console.log(`ℹ️  User already exists: ${u.email}`);
      return;
    }

    console.log(`❌ Failed to create ${u.email}: ${status || ''} ${msg}`);
  }
}

async function tryLogin(email: string, password: string): Promise<string | null> {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    return res.data?.access_token || null;
  } catch {
    return null;
  }
}

async function trySetSystemRoleByPatch(token: string, email: string, role: SeedUser['role']) {
  // This is best-effort: backend may or may not support changing system role via API.
  try {
    const usersRes = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items ?? [];
    const found = users.find((x: any) => x?.email?.toLowerCase?.() === email.toLowerCase());
    if (!found?.id) return;

    await axios.patch(
      `${API_BASE_URL}/users/${found.id}`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log(`✅ Set role for ${email} -> ${role}`);
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || 'Role update failed';
    console.log(`ℹ️  Could not set system role for ${email} (${status || ''}): ${msg}`);
  }
}

function roleMatchesSystemRole(roleObj: any, systemRole: SeedUser['role']): boolean {
  const candidates = [
    roleObj?.name,
    roleObj?.code,
    roleObj?.key,
    roleObj?.displayName,
    roleObj?.description,
  ]
    .filter(Boolean)
    .map((s: any) => String(s).toUpperCase());

  const target = systemRole.toUpperCase();
  return candidates.some((c: string) => c.includes(target));
}

async function tryAssignRoleViaRolesApi(token: string, email: string, systemRole: SeedUser['role']) {
  // Best-effort: if backend uses /roles/* as the primary role system, assign role IDs here.
  try {
    const [usersRes, rolesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/roles`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items ?? [];
    const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.items ?? [];

    const user = users.find((x: any) => x?.email?.toLowerCase?.() === email.toLowerCase());
    if (!user?.id) return;

    const role = roles.find((r: any) => roleMatchesSystemRole(r, systemRole));
    if (!role?.id) {
      console.log(`ℹ️  No matching role id found for ${systemRole}; skipping roles API assignment for ${email}`);
      return;
    }

    await axios.post(
      `${API_BASE_URL}/roles/assign-multiple`,
      { userId: user.id, roleIds: [role.id] },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    console.log(`✅ Assigned role via roles API for ${email} -> ${systemRole}`);
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || 'Role assignment failed';
    console.log(`ℹ️  Could not assign role via roles API for ${email} (${status || ''}): ${msg}`);
  }
}

async function main() {
  console.log(`Seeding users against API: ${API_BASE_URL}`);

  for (const u of usersToSeed) {
    await signupIfMissing(u);
  }

  // Best-effort role assignment (only works if backend supports PATCH /users/:id { role })
  const adminToken = await tryLogin('admin@city.gov', 'admin123');
  if (adminToken) {
    for (const u of usersToSeed) {
      await trySetSystemRoleByPatch(adminToken, u.email, u.role);
    }
    for (const u of usersToSeed) {
      await tryAssignRoleViaRolesApi(adminToken, u.email, u.role);
    }
  } else {
    console.log('ℹ️  Admin login failed; skipping system role patch step.');
  }

  // Write credentials to a local file (gitignored because of *.local)
  const outPath = path.join(process.cwd(), 'seeded-users.local.json');
  fs.writeFileSync(outPath, JSON.stringify({ apiBaseUrl: API_BASE_URL, users: usersToSeed }, null, 2), 'utf-8');

  console.log('\nSeeded users (dev/test only):');
  for (const u of usersToSeed) {
    console.log(`- ${u.role}: ${u.email} / ${u.password}`);
  }
  console.log(`\nSaved to: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

