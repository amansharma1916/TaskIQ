import type { ManagerTaskRow } from "../../types/manager.types";

type ManagerMyAssignmentsPanelProps = {
  isActive: boolean;
  isLoading: boolean;
  error: string;
  assignedToMe: ManagerTaskRow[];
  teamBacklog: ManagerTaskRow[];
};

const TaskList = ({ title, tasks }: { title: string; tasks: ManagerTaskRow[] }) => {
  return (
    <article className="ceo-card">
      <div className="ceo-card-head">
        <h2>{title}</h2>
      </div>
      {tasks.length === 0 ? (
        <div className="manager-state">No tasks in this section.</div>
      ) : (
        <div className="ceo-task-list">
          {tasks.map((task) => (
            <article className="ceo-task-item ceo-task-item-extended" key={`${title}-${task.id}`}>
              <div>
                <h3>{task.title}</h3>
                <p>
                  {task.projectName} | {task.teamName}
                </p>
              </div>
              <div className="ceo-task-meta-row">
                <span>Status: {task.status}</span>
                <span>Priority: {task.priority}</span>
                <span>Assignee: {task.assigneeName || "Unassigned"}</span>
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
  assignedToMe,
  teamBacklog,
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
    <section className="ceo-panel active manager-assignments-grid">
      <TaskList title="Assigned To Me" tasks={assignedToMe} />
      <TaskList title="Team Backlog" tasks={teamBacklog} />
    </section>
  );
};

export default ManagerMyAssignmentsPanel;
