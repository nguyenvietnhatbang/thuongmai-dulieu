const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file from the workspace root
const envPath = path.join(__dirname, '../.env.local');
let databaseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      databaseUrl = line.split('DATABASE_URL=')[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runSeed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding departments...');
    const deptRes = await client.query(`
      INSERT INTO app.departments (code, name, status)
      VALUES
        ('IT', 'Ban Cong nghe Thong tin', 'active'),
        ('SALES', 'Phong Kinh doanh & CRM', 'active'),
        ('PMO', 'Ban Quan ly Du an', 'active'),
        ('FINANCE', 'Phong Tai chinh - Ke toan', 'active'),
        ('LOGISTICS', 'Phong Cung ung & Kho hang', 'active')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, code;
    `);

    // Map department code to UUID
    const deptMap = {};
    deptRes.rows.forEach(row => {
      deptMap[row.code] = row.id;
    });

    console.log('Seeding users...');
    const users = [
      { email: 'admin@crm.com', fullName: 'Tran Dai Hai (Admin System)', deptCode: 'IT', roleCode: 'system_management' },
      { email: 'manager@crm.com', fullName: 'Nguyen Van Tien (Business Manager)', deptCode: 'SALES', roleCode: 'business_management' },
      { email: 'sales@crm.com', fullName: 'Le Minh Tuan (Sales Representative)', deptCode: 'SALES', roleCode: 'sales_operation' },
      { email: 'project@crm.com', fullName: 'Pham Hong Minh (Project Manager)', deptCode: 'PMO', roleCode: 'project_operation' },
      { email: 'finance@crm.com', fullName: 'Hoang Lan Anh (Finance Accountant)', deptCode: 'FINANCE', roleCode: 'finance_operation' },
      { email: 'inventory@crm.com', fullName: 'Nguyen Bich Thuy (Inventory Officer)', deptCode: 'LOGISTICS', roleCode: 'inventory_commerce_operation' }
    ];

    for (const u of users) {
      const deptId = deptMap[u.deptCode];
      
      // Insert user
      const userRes = await client.query(`
        INSERT INTO app.users (email, full_name, department_id, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, department_id = EXCLUDED.department_id
        RETURNING id;
      `, [u.email, u.fullName, deptId]);

      const userId = userRes.rows[0].id;

      // Get role ID
      const roleRes = await client.query('SELECT id FROM app.roles WHERE code = $1', [u.roleCode]);
      if (roleRes.rows.length > 0) {
        const roleId = roleRes.rows[0].id;

        // Map user to role
        await client.query(`
          INSERT INTO app.user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        `, [userId, roleId]);
      } else {
        console.warn(`Warning: Role ${u.roleCode} not found in database.`);
      }
    }

    await client.query('COMMIT');
    console.log('Database seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
