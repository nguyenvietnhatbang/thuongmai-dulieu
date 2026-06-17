import { query, transaction } from '@/lib/db';
import { buildPagination, getSortSql, PaginatedResult, SortDirection } from '@/lib/list-query';

export interface ProjectTask {
  id: string;
  projectId: string;
  customerId: string;
  title: string;
  description: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  startDate: string | null;
  dueDate: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'waiting_feedback' | 'completed' | 'overdue' | 'cancelled';
}

export interface Schedule {
  id: string;
  projectId: string | null;
  customerId: string;
  scheduleType: 'meeting' | 'survey' | 'deployment' | 'acceptance' | 'customer_care' | 'other';
  title: string;
  startsAt: string;
  endsAt: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  status: 'planned' | 'done' | 'cancelled';
  notes: string | null;
}

export interface InternalNote {
  id: string;
  customerId: string | null;
  projectId: string | null;
  taskId: string | null;
  parentNoteId: string | null;
  senderUserId: string;
  senderName: string;
  recipientUserId: string;
  recipientName: string;
  content: string;
  status: 'unread' | 'read' | 'processed' | 'archived';
  createdAt: Date;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  contractId: string | null;
  contractNumber: string | null;
  customerId: string;
  customerName: string;
  projectManagerUserId: string | null;
  projectManagerName: string | null;
  startDate: string | null;
  plannedEndDate: string | null;
  status: 'new' | 'waiting_deployment' | 'in_progress' | 'paused' | 'waiting_acceptance' | 'accepted' | 'closed' | 'cancelled';
  progressPercent: number;
  notes: string | null;
  createdAt: Date;
}

/**
 * Fetch projects
 */
export async function getProjects(params: {
  search?: string;
  status?: string;
  scope?: 'own' | 'team' | 'all';
  currentUserId?: string;
  currentUserDeptId?: string | null;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: 'createdAt' | 'code' | 'name' | 'customerName' | 'progressPercent' | 'status';
  order?: SortDirection;
}): Promise<PaginatedResult<Project>> {
  try {
    const {
      search,
      status,
      scope = 'all',
      currentUserId,
      currentUserDeptId,
      limit = 20,
      offset = 0,
      page = Math.floor(offset / limit) + 1,
      sort = 'createdAt',
      order = 'desc',
    } = params;
    const whereClauses: string[] = ['p.deleted_at IS NULL'];
    const values: unknown[] = [];
    const sortColumns = {
      createdAt: 'p.created_at',
      code: 'p.code',
      name: 'p.name',
      customerName: 'c.name',
      progressPercent: 'p.progress_percent',
      status: 'p.status',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(p.name ILIKE $${values.length} OR p.code ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`p.status = $${values.length}`);
    }

    // RBAC Filter Scope
    if (scope === 'own' && currentUserId) {
      values.push(currentUserId);
      whereClauses.push(`p.project_manager_user_id = $${values.length}`);
    } else if (scope === 'team' && currentUserDeptId) {
      values.push(currentUserDeptId);
      whereClauses.push(`u.department_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countValues = [...values];
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.projects p
      INNER JOIN app.customers c ON p.customer_id = c.id
      LEFT JOIN app.contracts ctr ON p.contract_id = ctr.id
      LEFT JOIN app.users u ON p.project_manager_user_id = u.id
      ${whereSql}
    `, countValues);

    values.push(limit, offset);

    const res = await query(`
      SELECT 
        p.id, p.code, p.name, p.contract_id as "contractId", ctr.contract_number as "contractNumber",
        p.customer_id as "customerId", c.name as "customerName",
        p.project_manager_user_id as "projectManagerUserId", u.full_name as "projectManagerName",
        p.start_date::text as "startDate", p.planned_end_date::text as "plannedEndDate",
        p.status, p.progress_percent as "progressPercent", p.notes, p.created_at as "createdAt"
      FROM app.projects p
      INNER JOIN app.customers c ON p.customer_id = c.id
      LEFT JOIN app.contracts ctr ON p.contract_id = ctr.id
      LEFT JOIN app.users u ON p.project_manager_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `, values);

    return buildPagination(res.rows as Project[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Get project details
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const res = await query(`
    SELECT 
      p.id, p.code, p.name, p.contract_id as "contractId", ctr.contract_number as "contractNumber",
      p.customer_id as "customerId", c.name as "customerName",
      p.project_manager_user_id as "projectManagerUserId", u.full_name as "projectManagerName",
      p.start_date::text as "startDate", p.planned_end_date::text as "plannedEndDate",
      p.status, p.progress_percent as "progressPercent", p.notes, p.created_at as "createdAt"
    FROM app.projects p
    INNER JOIN app.customers c ON p.customer_id = c.id
    LEFT JOIN app.contracts ctr ON p.contract_id = ctr.id
    LEFT JOIN app.users u ON p.project_manager_user_id = u.id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  return res.rows[0] as Project;
}

/**
 * Fetch project tasks
 */
export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const res = await query(`
    SELECT 
      t.id, t.project_id as "projectId", t.customer_id as "customerId", t.title, t.description,
      t.assignee_user_id as "assigneeUserId", u.full_name as "assigneeName",
      t.start_date::text as "startDate", t.due_date::text as "dueDate", t.priority, t.status
    FROM app.project_tasks t
    LEFT JOIN app.users u ON t.assignee_user_id = u.id
    WHERE t.project_id = $1 AND t.deleted_at IS NULL
    ORDER BY t.due_date ASC, t.created_at ASC
  `, [projectId]);
  return res.rows as ProjectTask[];
}

/**
 * Create a project task
 */
export async function createProjectTask(
  data: Omit<ProjectTask, 'id' | 'assigneeName'> & { userId: string }
): Promise<ProjectTask> {
  return transaction(async (client) => {
    const res = await client.query(`
      INSERT INTO app.project_tasks (
        project_id, customer_id, title, description, assignee_user_id, start_date, due_date, priority, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'todo', $9)
      RETURNING id
    `, [
      data.projectId,
      data.customerId,
      data.title,
      data.description || null,
      data.assigneeUserId || null,
      data.startDate || null,
      data.dueDate || null,
      data.priority || 'normal',
      data.userId
    ]);

    const taskId = res.rows[0].id;

    // Send notification to assignee
    if (data.assigneeUserId) {
      await client.query(`
        INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
        VALUES ($1, $2, 'Cong viec moi duoc giao', $3, 'task', $4)
      `, [
        data.assigneeUserId,
        data.userId,
        `Ban duoc giao cong viec "${data.title}" trong du an.`,
        taskId
      ]);
    }

    const finalRes = await client.query(`
      SELECT 
        t.id, t.project_id as "projectId", t.customer_id as "customerId", t.title, t.description,
        t.assignee_user_id as "assigneeUserId", u.full_name as "assigneeName",
        t.start_date::text as "startDate", t.due_date::text as "dueDate", t.priority, t.status
      FROM app.project_tasks t
      LEFT JOIN app.users u ON t.assignee_user_id = u.id
      WHERE t.id = $1
    `, [taskId]);

    return finalRes.rows[0] as ProjectTask;
  });
}

/**
 * Update project task details (includes status completion)
 */
export async function updateProjectTask(
  taskId: string,
  data: Partial<Omit<ProjectTask, 'id' | 'projectId' | 'customerId' | 'assigneeName'>>,
  userId: string
): Promise<ProjectTask> {
  return transaction(async (client) => {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [taskId];

    const fieldsMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      assigneeUserId: 'assignee_user_id',
      startDate: 'start_date',
      dueDate: 'due_date',
      priority: 'priority',
      status: 'status'
    };

    Object.entries(data).forEach(([key, val]) => {
      const dbField = fieldsMapping[key];
      if (dbField) {
        values.push(val === undefined ? null : val);
        setClauses.push(`${dbField} = $${values.length}`);
      }
    });

    await client.query(`
      UPDATE app.project_tasks
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    await client.query(`
      INSERT INTO app.audit_logs(user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'update', 'project_task', $2, $3)
    `, [userId, taskId, JSON.stringify(data)]);

    // Calculate project progress percentage based on task completion
    const taskDetailsRes = await client.query('SELECT project_id FROM app.project_tasks WHERE id = $1', [taskId]);
    const projId = taskDetailsRes.rows[0].project_id;

    const statsRes = await client.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'completed')::int as completed
      FROM app.project_tasks
      WHERE project_id = $1 AND deleted_at IS NULL
    `, [projId]);

    const { total, completed } = statsRes.rows[0];
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await client.query('UPDATE app.projects SET progress_percent = $1 WHERE id = $2', [progress, projId]);

    const finalRes = await client.query(`
      SELECT 
        t.id, t.project_id as "projectId", t.customer_id as "customerId", t.title, t.description,
        t.assignee_user_id as "assigneeUserId", u.full_name as "assigneeName",
        t.start_date::text as "startDate", t.due_date::text as "dueDate", t.priority, t.status
      FROM app.project_tasks t
      LEFT JOIN app.users u ON t.assignee_user_id = u.id
      WHERE t.id = $1
    `, [taskId]);

    return finalRes.rows[0] as ProjectTask;
  });
}

/**
 * Fetch project schedules
 */
export async function getProjectSchedules(projectId: string): Promise<Schedule[]> {
  const res = await query(`
    SELECT 
      id, project_id as "projectId", customer_id as "customerId", schedule_type as "scheduleType",
      title, starts_at::text as "startsAt", ends_at::text as "endsAt",
      owner_user_id as "ownerUserId", (SELECT full_name FROM app.users WHERE id = owner_user_id) as "ownerName",
      status, notes
    FROM app.schedules
    WHERE project_id = $1 AND deleted_at IS NULL
    ORDER BY starts_at ASC
  `, [projectId]);
  return res.rows as Schedule[];
}

/**
 * Create a project schedule
 */
export async function createProjectSchedule(
  data: Omit<Schedule, 'id' | 'ownerName'> & { userId: string }
): Promise<Schedule> {
  const res = await query(`
    INSERT INTO app.schedules (
      project_id, customer_id, schedule_type, title, starts_at, ends_at, owner_user_id, status, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'planned', $8)
    RETURNING id, project_id as "projectId", customer_id as "customerId", schedule_type as "scheduleType",
              title, starts_at::text as "startsAt", ends_at::text as "endsAt", owner_user_id as "ownerUserId", status, notes
  `, [
    data.projectId,
    data.customerId,
    data.scheduleType,
    data.title,
    data.startsAt,
    data.endsAt || null,
    data.ownerUserId || data.userId,
    data.notes || null
  ]);

  return res.rows[0] as Schedule;
}

/**
 * Fetch internal chat notes for a project
 */
export async function getProjectNotes(projectId: string): Promise<InternalNote[]> {
  const res = await query(`
    SELECT 
      n.id, n.customer_id as "customerId", n.project_id as "projectId", n.task_id as "taskId",
      n.parent_note_id as "parentNoteId", n.sender_user_id as "senderUserId", u_send.full_name as "senderName",
      n.recipient_user_id as "recipientUserId", u_rec.full_name as "recipientName",
      n.content, n.status, n.created_at as "createdAt"
    FROM app.internal_notes n
    INNER JOIN app.users u_send ON n.sender_user_id = u_send.id
    INNER JOIN app.users u_rec ON n.recipient_user_id = u_rec.id
    WHERE n.project_id = $1 AND n.deleted_at IS NULL
    ORDER BY n.created_at ASC
  `, [projectId]);
  return res.rows as InternalNote[];
}

/**
 * Send an internal note and trigger notification to recipient
 */
export async function createProjectNote(
  data: {
    projectId: string;
    customerId: string;
    senderUserId: string;
    recipientUserId: string;
    content: string;
    parentNoteId?: string;
  }
): Promise<InternalNote> {
  return transaction(async (client) => {
    // 1. Insert note record
    const noteRes = await client.query(`
      INSERT INTO app.internal_notes (
        project_id, customer_id, sender_user_id, recipient_user_id, content, parent_note_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'unread')
      RETURNING id
    `, [
      data.projectId,
      data.customerId,
      data.senderUserId,
      data.recipientUserId,
      data.content,
      data.parentNoteId || null
    ]);

    const noteId = noteRes.rows[0].id;

    // 2. Fetch sender name
    const senderRes = await client.query('SELECT full_name FROM app.users WHERE id = $1', [data.senderUserId]);
    const senderName = senderRes.rows[0].full_name;

    // 3. Trigger notification to recipient
    await client.query(`
      INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
      VALUES ($1, $2, 'Ghi chu noi bo moi', $3, 'project', $4)
    `, [
      data.recipientUserId,
      data.senderUserId,
      `${senderName} gui ghi chu cho ban: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`,
      data.projectId
    ]);

    // 4. If this is a reply (parentNoteId specified), notify the parent sender too if different
    if (data.parentNoteId) {
      const parentRes = await client.query('SELECT sender_user_id FROM app.internal_notes WHERE id = $1', [data.parentNoteId]);
      if (parentRes.rows.length > 0) {
        const parentSender = parentRes.rows[0].sender_user_id;
        if (parentSender !== data.senderUserId && parentSender !== data.recipientUserId) {
          await client.query(`
            INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
            VALUES ($1, $2, 'Phan hoi ghi chu noi bo', $3, 'project', $4)
          `, [
            parentSender,
            data.senderUserId,
            `${senderName} da tra loi ghi chu cua ban.`,
            data.projectId
          ]);
        }
      }
    }

    const finalRes = await client.query(`
      SELECT 
        n.id, n.customer_id as "customerId", n.project_id as "projectId", n.task_id as "taskId",
        n.parent_note_id as "parentNoteId", n.sender_user_id as "senderUserId", u_send.full_name as "senderName",
        n.recipient_user_id as "recipientUserId", u_rec.full_name as "recipientName",
        n.content, n.status, n.created_at as "createdAt"
      FROM app.internal_notes n
      INNER JOIN app.users u_send ON n.sender_user_id = u_send.id
      INNER JOIN app.users u_rec ON n.recipient_user_id = u_rec.id
      WHERE n.id = $1
    `, [noteId]);

    return finalRes.rows[0] as InternalNote;
  });
}

/**
 * Execute project closure / acceptance
 */
export async function closeProject(
  data: {
    projectId: string;
    code: string;
    closedDate: string;
    acceptanceStatus: 'accepted' | 'rejected' | 'pending';
    archiveStatus: 'archived' | 'not_archived';
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    // 1. Write closure record
    const closureRes = await client.query(`
      INSERT INTO app.project_closures (
        code, project_id, closed_date, acceptance_status, archive_status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      data.code,
      data.projectId,
      data.closedDate,
      data.acceptanceStatus,
      data.archiveStatus,
      data.notes || null,
      data.userId
    ]);

    // 2. Transition project status
    let nextStatus: string = 'closed';
    if (data.acceptanceStatus === 'accepted') {
      nextStatus = 'accepted';
    } else if (data.acceptanceStatus === 'rejected') {
      nextStatus = 'in_progress'; // Send back to in_progress if rejected
    }

    await client.query('UPDATE app.projects SET status = $1, updated_at = NOW() WHERE id = $2', [nextStatus, data.projectId]);

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'close_project', 'project', $2, $3)
    `, [data.userId, data.projectId, JSON.stringify(data)]);

    return closureRes.rows[0];
  });
}
