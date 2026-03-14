import type { ApiTaskStatus } from '../../../CEOs/types/api.types';
import type { ManagerMemberOption, ManagerTaskRow } from '../../types/manager.types';
import { getAssignableMembersForTask } from '../../utils/taskAssignments';
import '../../../../../styles/user/Manager/panels/ManagerAssignmentsPanel.css';

type ManagerMyAssignmentsPanelProps = {
  isActive: boolean;
  isLoading: boolean;
  error: string;
  actionError: string;
  isMutating: boolean;
  members: ManagerMemberOption[];
  assignedToMe: ManagerTaskRow[];
  teamTasks: ManagerTaskRow[];
  onUpdateStatus: (taskId: string, status: ApiTaskStatus) => void;
  onAssign: (taskId: string, assigneeMemberId: string | null) => void;
};

const statusOptions: Array<{ label: string; value: ApiTaskStatus }> = [
  { label: 'To do', value: 'todo' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

const formatStatusLabel = (status: ApiTaskStatus): string => {
  switch (status) {
    case 'todo':
      return 'To do';
    case 'in-progress':
      return 'In progress';
    case 'done':
      return 'Done';
    default:
      return status;
  }
};

const formatPriorityLabel = (priority: ManagerTaskRow['priority']): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatDueDate = (dueDate: string | null): string => {
  if (!dueDate) {
    return 'No due date';
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'No due date';
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const TaskList = ({
  title,
  description,
  emptyMessage,
  tasks,
  members,
  isMutating,
  onUpdateStatus,
  onAssign,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  tasks: ManagerTaskRow[];
  members: ManagerMemberOption[];
  isMutating: boolean;
  onUpdateStatus: (taskId: string, status: ApiTaskStatus) => void;
  onAssign: (taskId: string, assigneeMemberId: string | null) => void;
}) => {
  return (
    <article className="manager-assignment-section">
      <div className="manager-assignment-section-head">
        <div>
          <p className="manager-assignment-eyebrow">Assignment lane</p>
          <h2>{title}</h2>
          <p className="manager-assignment-section-copy">{description}</p>
        </div>
        <span className="manager-assignment-count">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <div className="manager-assignment-empty">
          <h3>Nothing to action here</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="manager-assignment-list">
          {tasks.map((task) => (
            <article className="manager-assignment-item" key={task.id}>
              <div className="manager-assignment-item-topline">
                <div className="manager-assignment-chip-row">
                  <span className={`manager-assignment-chip manager-assignment-chip-status status-${task.status}`}>{formatStatusLabel(task.status)}</span>
                  <span className={`manager-assignment-chip manager-assignment-chip-priority priority-${task.priority}`}>{formatPriorityLabel(task.priority)}</span>
                </div>
                <span className="manager-assignment-due">{formatDueDate(task.dueDate)}</span>
              </div>
              <div className="manager-assignment-main">
                <div className="manager-assignment-copy">
                  <h3>{task.title}</h3>
                  <p>
                    {task.projectName} | {task.teamName}
                  </p>
                </div>
                {task.description ? <p className="manager-assignment-description">{task.description}</p> : null}
              </div>
              <div className="manager-assignment-meta-row">
                <span>Assignee: {task.assigneeName || 'Unassigned'}</span>
                <span>Team: {task.teamName}</span>
              </div>
              <div className="manager-assignment-controls">
                <label>
                  Status
                  <select
                    className="manager-assignment-select"
                    value={task.status}
                    onChange={(event) => onUpdateStatus(task.id, event.target.value as ApiTaskStatus)}
                    disabled={isMutating}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Assignee
                  <select
                    className="manager-assignment-select"
                    value={task.assigneeMemberId ?? ''}
                    onChange={(event) => onAssign(task.id, event.target.value || null)}
                    disabled={isMutating || !task.teamId}
                  >
                    <option value="">{task.teamId ? 'Unassigned' : 'Assign a team first'}</option>
                    {getAssignableMembersForTask(task, members).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  );
};

const ManagerMyAssignmentsPanel = ({
  isActive,
  isLoading,
  error,
  actionError,
  isMutating,
  members,
  assignedToMe,
  teamTasks,
  onUpdateStatus,
  onAssign,
}: ManagerMyAssignmentsPanelProps) => {
  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return <div className="manager-state">Loading assignments...</div>;
  }

  if (error) {
    return <div className="manager-state manager-state-error">{error}</div>;
  }

  return (
    <section className="ceo-panel active manager-assignments-panel">
      <header className="manager-assignments-hero">
        <div>
          <p className="manager-assignment-eyebrow">Manager workspace</p>
          <h1>My Assignments</h1>
          <p className="manager-assignments-hero-copy">
            Track work assigned to you and rebalance active team tasks without leaving this panel.
          </p>
        </div>
        <div className="manager-assignments-summary">
          <article className="manager-assignments-summary-card">
            <span className="manager-assignments-summary-label">Assigned to me</span>
            <strong>{assignedToMe.length}</strong>
          </article>
          <article className="manager-assignments-summary-card">
            <span className="manager-assignments-summary-label">Active team tasks</span>
            <strong>{teamTasks.length}</strong>
          </article>
        </div>
      </header>
      {actionError ? <div className="manager-state manager-state-error manager-assignment-error">{actionError}</div> : null}
      <div className="manager-assignments-grid">
      <TaskList
        title="Assigned To Me"
        description="Your direct workload. Update progress here as you move through delivery."
        emptyMessage="No tasks are currently assigned to you."
        tasks={assignedToMe}
        members={members}
        isMutating={isMutating}
        onUpdateStatus={onUpdateStatus}
        onAssign={onAssign}
      />
      <TaskList
        title="Team Tasks"
        description="Active work in your team scope. Reassign quickly when priorities or capacity change."
        emptyMessage="No active team tasks are waiting in your team view."
        tasks={teamTasks}
        members={members}
        isMutating={isMutating}
        onUpdateStatus={onUpdateStatus}
        onAssign={onAssign}
      />
      </div>
    </section>
  );
};

export default ManagerMyAssignmentsPanel;
