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
  progressPercent: number;
  result: string | null;
  collaboratorUserIds?: string[];
  collaboratorNames?: string[];
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
  location: string | null;
  internalAttendeeIds: string[];
  status: 'planned' | 'confirmed' | 'done' | 'postponed' | 'cancelled';
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
  noteTitle: string | null;
  recipientUserIds: string[];
  recipientNames: string[];
  content: string;
  requiresResponse: boolean;
  responseDueDate: string | null;
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
  projectScope: string | null;
  folderUrl: string | null;
  memberUserIds?: string[];
  memberNames?: string[];
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
        p.project_scope as "projectScope", p.folder_url as "folderUrl",
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
      p.project_scope as "projectScope", p.folder_url as "folderUrl",
      p.status, p.progress_percent as "progressPercent", p.notes, p.created_at as "createdAt"
    FROM app.projects p
    INNER JOIN app.customers c ON p.customer_id = c.id
    LEFT JOIN app.contracts ctr ON p.contract_id = ctr.id
    LEFT JOIN app.users u ON p.project_manager_user_id = u.id
    WHERE p.id = $1 AND p.deleted_at IS NULL
  `, [id]);

  if (res.rows.length === 0) return null;
  const project = res.rows[0] as Project;
  const membersRes = await query(`
    SELECT ptm.user_id as "userId", u.full_name as "fullName"
    FROM app.project_team_members ptm
    INNER JOIN app.users u ON ptm.user_id = u.id
    WHERE ptm.project_id = $1
    ORDER BY u.full_name ASC
  `, [id]);
  project.memberUserIds = membersRes.rows.map(row => row.userId);
  project.memberNames = membersRes.rows.map(row => row.fullName);
  return project;
}

/**
 * Fetch project tasks
 */
export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const res = await query(`
    SELECT 
      t.id, t.project_id as "projectId", t.customer_id as "customerId", t.title, t.description,
      t.assignee_user_id as "assigneeUserId", u.full_name as "assigneeName",
      t.start_date::text as "startDate", t.due_date::text as "dueDate",
      t.priority, t.status, t.progress_percent as "progressPercent", t.result,
      COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ptc.user_id), NULL), '{}') as "collaboratorUserIds",
      COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT cu.full_name), NULL), '{}') as "collaboratorNames"
    FROM app.project_tasks t
    LEFT JOIN app.users u ON t.assignee_user_id = u.id
    LEFT JOIN app.project_task_collaborators ptc ON t.id = ptc.task_id
    LEFT JOIN app.users cu ON ptc.user_id = cu.id
    WHERE t.project_id = $1 AND t.deleted_at IS NULL
    GROUP BY t.id, u.full_name
    ORDER BY t.due_date ASC, t.created_at ASC
  `, [projectId]);
  return res.rows.map(row => ({ ...row, progressPercent: Number(row.progressPercent) })) as ProjectTask[];
}

/**
 * Create a project task
 */
export async function createProjectTask(
  data: {
    projectId: string;
    customerId: string;
    title: string;
    description?: string | null;
    assigneeUserId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    priority?: ProjectTask['priority'];
    progressPercent?: number;
    result?: string | null;
    collaboratorUserIds?: string[];
    userId: string;
  }
): Promise<ProjectTask> {
  return transaction(async (client) => {
    const res = await client.query(`
      INSERT INTO app.project_tasks (
        project_id, customer_id, title, description, assignee_user_id, start_date, due_date,
        priority, status, progress_percent, result, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'todo', $9, $10, $11)
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
      data.progressPercent || 0,
      data.result || null,
      data.userId
    ]);

    const taskId = res.rows[0].id;

    for (const collaboratorId of data.collaboratorUserIds || []) {
      if (collaboratorId && collaboratorId !== data.assigneeUserId) {
        await client.query(`
          INSERT INTO app.project_task_collaborators (task_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT (task_id, user_id) DO NOTHING
        `, [taskId, collaboratorId]);
      }
    }

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
        t.start_date::text as "startDate", t.due_date::text as "dueDate",
        t.priority, t.status, t.progress_percent as "progressPercent", t.result,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ptc.user_id), NULL), '{}') as "collaboratorUserIds",
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT cu.full_name), NULL), '{}') as "collaboratorNames"
      FROM app.project_tasks t
      LEFT JOIN app.users u ON t.assignee_user_id = u.id
      LEFT JOIN app.project_task_collaborators ptc ON t.id = ptc.task_id
      LEFT JOIN app.users cu ON ptc.user_id = cu.id
      WHERE t.id = $1
      GROUP BY t.id, u.full_name
    `, [taskId]);

    return { ...finalRes.rows[0], progressPercent: Number(finalRes.rows[0].progressPercent) } as ProjectTask;
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
      status: 'status',
      progressPercent: 'progress_percent',
      result: 'result'
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

    if (data.collaboratorUserIds !== undefined) {
      await client.query('DELETE FROM app.project_task_collaborators WHERE task_id = $1', [taskId]);
      for (const collaboratorId of data.collaboratorUserIds || []) {
        if (collaboratorId) {
          await client.query(`
            INSERT INTO app.project_task_collaborators (task_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (task_id, user_id) DO NOTHING
          `, [taskId, collaboratorId]);
        }
      }
    }

    await client.query(`
      INSERT INTO app.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
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
        t.start_date::text as "startDate", t.due_date::text as "dueDate",
        t.priority, t.status, t.progress_percent as "progressPercent", t.result,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ptc.user_id), NULL), '{}') as "collaboratorUserIds",
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT cu.full_name), NULL), '{}') as "collaboratorNames"
      FROM app.project_tasks t
      LEFT JOIN app.users u ON t.assignee_user_id = u.id
      LEFT JOIN app.project_task_collaborators ptc ON t.id = ptc.task_id
      LEFT JOIN app.users cu ON ptc.user_id = cu.id
      WHERE t.id = $1
      GROUP BY t.id, u.full_name
    `, [taskId]);

    return { ...finalRes.rows[0], progressPercent: Number(finalRes.rows[0].progressPercent) } as ProjectTask;
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
      location, internal_attendee_ids as "internalAttendeeIds", status, notes
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
  data: {
    projectId: string | null;
    customerId: string;
    scheduleType: Schedule['scheduleType'];
    title: string;
    startsAt: string;
    endsAt?: string | null;
    ownerUserId?: string | null;
    location?: string | null;
    internalAttendeeIds?: string[];
    status?: Schedule['status'];
    notes?: string | null;
    userId: string;
  }
): Promise<Schedule> {
  const res = await query(`
    INSERT INTO app.schedules (
      project_id, customer_id, schedule_type, title, starts_at, ends_at,
      owner_user_id, location, internal_attendee_ids, status, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'planned', $10)
    RETURNING id, project_id as "projectId", customer_id as "customerId", schedule_type as "scheduleType",
              title, starts_at::text as "startsAt", ends_at::text as "endsAt",
              owner_user_id as "ownerUserId", location, internal_attendee_ids as "internalAttendeeIds", status, notes
  `, [
    data.projectId,
    data.customerId,
    data.scheduleType,
    data.title,
    data.startsAt,
    data.endsAt || null,
    data.ownerUserId || data.userId,
    data.location || null,
    data.internalAttendeeIds || [],
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
      n.note_title as "noteTitle",
      COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]) as "recipientUserIds",
      (
        SELECT COALESCE(ARRAY_AGG(u_multi.full_name ORDER BY u_multi.full_name), '{}')
        FROM app.users u_multi
        WHERE u_multi.id = ANY(COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]))
      ) as "recipientNames",
      n.content, n.requires_response as "requiresResponse",
      n.response_due_date::text as "responseDueDate", n.status, n.created_at as "createdAt"
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
    recipientUserIds?: string[];
    noteTitle?: string | null;
    content: string;
    requiresResponse?: boolean;
    responseDueDate?: string | null;
    parentNoteId?: string;
  }
): Promise<InternalNote> {
  return transaction(async (client) => {
    const recipientUserIds = Array.from(new Set([
      data.recipientUserId,
      ...(data.recipientUserIds || []),
    ].filter(Boolean)));
    const primaryRecipientId = recipientUserIds[0];

    // 1. Insert note record
    const noteRes = await client.query(`
      INSERT INTO app.internal_notes (
        project_id, customer_id, sender_user_id, recipient_user_id, recipient_user_ids,
        note_title, content, requires_response, response_due_date, parent_note_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'unread')
      RETURNING id
    `, [
      data.projectId,
      data.customerId,
      data.senderUserId,
      primaryRecipientId,
      recipientUserIds,
      data.noteTitle || null,
      data.content,
      Boolean(data.requiresResponse),
      data.responseDueDate || null,
      data.parentNoteId || null
    ]);

    const noteId = noteRes.rows[0].id;

    // 2. Fetch sender name
    const senderRes = await client.query('SELECT full_name FROM app.users WHERE id = $1', [data.senderUserId]);
    const senderName = senderRes.rows[0].full_name;

    // 3. Trigger notification to every recipient
    for (const recipientId of recipientUserIds) {
      await client.query(`
        INSERT INTO app.notifications (recipient_user_id, actor_user_id, title, body, entity_type, entity_id)
        VALUES ($1, $2, 'Ghi chu noi bo moi', $3, 'project', $4)
      `, [
        recipientId,
        data.senderUserId,
        `${senderName} gui ghi chu cho ban: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`,
        data.projectId
      ]);
    }

    // 4. If this is a reply (parentNoteId specified), notify the parent sender too if different
    if (data.parentNoteId) {
      const parentRes = await client.query('SELECT sender_user_id FROM app.internal_notes WHERE id = $1', [data.parentNoteId]);
      if (parentRes.rows.length > 0) {
        const parentSender = parentRes.rows[0].sender_user_id;
        if (parentSender !== data.senderUserId && !recipientUserIds.includes(parentSender)) {
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
        n.note_title as "noteTitle",
        COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]) as "recipientUserIds",
        (
          SELECT COALESCE(ARRAY_AGG(u_multi.full_name ORDER BY u_multi.full_name), '{}')
          FROM app.users u_multi
          WHERE u_multi.id = ANY(COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]))
        ) as "recipientNames",
        n.content, n.requires_response as "requiresResponse",
        n.response_due_date::text as "responseDueDate", n.status, n.created_at as "createdAt"
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
    completionSummary?: string | null;
    acceptanceFileAssetId?: string | null;
    receivableCompleted?: boolean;
    notes?: string;
    userId: string;
  }
): Promise<any> {
  return transaction(async (client) => {
    // 1. Write closure record
    const closureRes = await client.query(`
      INSERT INTO app.project_closures (
        code, project_id, closed_date, acceptance_status, archive_status,
        completion_summary, acceptance_file_asset_id, receivable_completed,
        notes, closed_by, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
      RETURNING id
    `, [
      data.code,
      data.projectId,
      data.closedDate,
      data.acceptanceStatus,
      data.archiveStatus,
      data.completionSummary || null,
      data.acceptanceFileAssetId || null,
      Boolean(data.receivableCompleted),
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

/**
 * Update project details
 */
export async function updateProject(
  id: string,
  data: Partial<Omit<Project, 'id' | 'code' | 'contractId' | 'customerName'>>,
  userId: string
): Promise<Project> {
  return transaction(async (client) => {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [id];

    const fieldsMapping: Record<string, string> = {
      name: 'name',
      projectManagerUserId: 'project_manager_user_id',
      startDate: 'start_date',
      plannedEndDate: 'planned_end_date',
      projectScope: 'project_scope',
      folderUrl: 'folder_url',
      status: 'status',
      notes: 'notes'
    };

    Object.entries(data).forEach(([key, val]) => {
      const dbField = fieldsMapping[key];
      if (dbField) {
        values.push(val === undefined ? null : val);
        setClauses.push(`${dbField} = $${values.length}`);
      }
    });

    await client.query(`
      UPDATE app.projects
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    if (data.memberUserIds !== undefined) {
      await client.query('DELETE FROM app.project_team_members WHERE project_id = $1', [id]);
      for (const memberId of data.memberUserIds || []) {
        if (memberId) {
          await client.query(`
            INSERT INTO app.project_team_members (project_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (project_id, user_id) DO NOTHING
          `, [id, memberId]);
        }
      }
    }

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_project', 'project', $2, $3)
    `, [userId, id, JSON.stringify(data)]);

    const updated = await getProjectById(id);
    if (!updated) throw new Error('Project not found after update');
    return updated;
  });
}

/**
 * Delete (soft delete) project
 */
export async function deleteProject(id: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const res = await client.query(`
      UPDATE app.projects
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'delete_project', 'project', $2)
    `, [userId, id]);

    return (res.rowCount ?? 0) > 0;
  });
}

/**
 * Update project schedule lifecycle
 */
export async function updateProjectSchedule(
  scheduleId: string,
  data: Partial<Omit<Schedule, 'id' | 'projectId' | 'customerName' | 'ownerName'>>,
  userId: string
): Promise<Schedule> {
  return transaction(async (client) => {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [scheduleId];

    const fieldsMapping: Record<string, string> = {
      scheduleType: 'schedule_type',
      title: 'title',
      startsAt: 'starts_at',
      endsAt: 'ends_at',
      ownerUserId: 'owner_user_id',
      location: 'location',
      internalAttendeeIds: 'internal_attendee_ids',
      status: 'status',
      notes: 'notes'
    };

    Object.entries(data).forEach(([key, val]) => {
      const dbField = fieldsMapping[key];
      if (dbField) {
        values.push(val === undefined ? null : val);
        setClauses.push(`${dbField} = $${values.length}`);
      }
    });

    await client.query(`
      UPDATE app.schedules
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_schedule', 'schedule', $2, $3)
    `, [userId, scheduleId, JSON.stringify(data)]);

    const res = await client.query(`
      SELECT 
        s.id, s.project_id as "projectId", s.customer_id as "customerId",
        s.schedule_type as "scheduleType", s.title, s.starts_at as "startsAt",
        s.ends_at as "endsAt", s.owner_user_id as "ownerUserId",
        s.location, s.internal_attendee_ids as "internalAttendeeIds", s.status, s.notes,
        s.created_at as "createdAt", u.full_name as "ownerName"
      FROM app.schedules s
      LEFT JOIN app.users u ON s.owner_user_id = u.id
      WHERE s.id = $1
    `, [scheduleId]);

    return res.rows[0] as Schedule;
  });
}

/**
 * Delete schedule (soft delete)
 */
export async function deleteProjectSchedule(scheduleId: string, userId: string): Promise<boolean> {
  return transaction(async (client) => {
    const res = await client.query(`
      UPDATE app.schedules
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `, [scheduleId]);

    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id)
      VALUES ($1, 'delete_schedule', 'schedule', $2)
    `, [userId, scheduleId]);

    return (res.rowCount ?? 0) > 0;
  });
}

/**
 * Update internal note lifecycle (read, processed, archived)
 */
export async function updateProjectNote(
  noteId: string,
  status: 'unread' | 'read' | 'processed' | 'archived',
  userId: string
): Promise<InternalNote> {
  return transaction(async (client) => {
    const setClauses: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [noteId, status];

    if (status === 'read') {
      setClauses.push('read_at = NOW()');
    } else if (status === 'processed') {
      setClauses.push('processed_at = NOW()');
    }

    await client.query(`
      UPDATE app.internal_notes
      SET ${setClauses.join(', ')}
      WHERE id = $1
    `, values);

    // Audit Log
    await client.query(`
      INSERT INTO app.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, 'update_note_status', 'internal_note', $2, $3)
    `, [userId, noteId, JSON.stringify({ status })]);

    const res = await client.query(`
      SELECT 
        n.id, n.customer_id as "customerId", n.project_id as "projectId",
        n.task_id as "taskId", n.parent_note_id as "parentNoteId",
        n.sender_user_id as "senderUserId", n.recipient_user_id as "recipientUserId",
        n.note_title as "noteTitle",
        COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]) as "recipientUserIds",
        (
          SELECT COALESCE(ARRAY_AGG(u_multi.full_name ORDER BY u_multi.full_name), '{}')
          FROM app.users u_multi
          WHERE u_multi.id = ANY(COALESCE(n.recipient_user_ids, ARRAY[n.recipient_user_id]))
        ) as "recipientNames",
        n.content, n.requires_response as "requiresResponse",
        n.response_due_date::text as "responseDueDate",
        n.status, n.read_at as "readAt", n.processed_at as "processedAt",
        n.created_at as "createdAt",
        u1.full_name as "senderName", u2.full_name as "recipientName"
      FROM app.internal_notes n
      INNER JOIN app.users u1 ON n.sender_user_id = u1.id
      INNER JOIN app.users u2 ON n.recipient_user_id = u2.id
      WHERE n.id = $1
    `, [noteId]);

    return res.rows[0] as InternalNote;
  });
}

export interface ScheduleDetail extends Schedule {
  projectName: string | null;
  projectCode: string | null;
  customerName: string;
  customerCode: string;
}

/**
 * Fetch all schedules globally
 */
export async function getSchedules(params: {
  search?: string;
  scheduleType?: string;
  status?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string;
  order?: SortDirection;
}): Promise<PaginatedResult<ScheduleDetail>> {
  try {
    const {
      search,
      scheduleType,
      status,
      limit = 20,
      offset = 0,
      page = Math.floor(offset / limit) + 1,
      sort = 'startsAt',
      order = 'asc',
    } = params;

    const whereClauses: string[] = ['s.deleted_at IS NULL'];
    const values: unknown[] = [];

    const sortColumns = {
      startsAt: 's.starts_at',
      endsAt: 's.ends_at',
      title: 's.title',
      scheduleType: 's.schedule_type',
      status: 's.status',
      customerName: 'c.name',
      projectName: 'p.name',
      ownerName: 'u.full_name',
    };

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(s.title ILIKE $${values.length} OR c.name ILIKE $${values.length} OR p.name ILIKE $${values.length})`);
    }

    if (scheduleType) {
      values.push(scheduleType);
      whereClauses.push(`s.schedule_type = $${values.length}`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`s.status = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countRes = await query<{ count: number }>(`
      SELECT COUNT(*)::int as count
      FROM app.schedules s
      INNER JOIN app.customers c ON s.customer_id = c.id
      LEFT JOIN app.projects p ON s.project_id = p.id
      LEFT JOIN app.users u ON s.owner_user_id = u.id
      ${whereSql}
    `, values);

    const queryValues = [...values, limit, offset];
    const res = await query(`
      SELECT 
        s.id, s.project_id as "projectId", p.name as "projectName", p.code as "projectCode",
        s.customer_id as "customerId", c.name as "customerName", c.code as "customerCode",
        s.schedule_type as "scheduleType", s.title, s.starts_at::text as "startsAt", s.ends_at::text as "endsAt",
        s.owner_user_id as "ownerUserId", u.full_name as "ownerName",
        s.location, s.internal_attendee_ids as "internalAttendeeIds", s.status, s.notes
      FROM app.schedules s
      INNER JOIN app.customers c ON s.customer_id = c.id
      LEFT JOIN app.projects p ON s.project_id = p.id
      LEFT JOIN app.users u ON s.owner_user_id = u.id
      ${whereSql}
      ORDER BY ${getSortSql(sort, order, sortColumns)}
      LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}
    `, queryValues);

    return buildPagination(res.rows as ScheduleDetail[], countRes.rows[0].count, { page, limit, offset });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
}
