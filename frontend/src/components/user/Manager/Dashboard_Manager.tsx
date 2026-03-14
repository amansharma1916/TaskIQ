import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import '../../../styles/user/CEOs/TaskPanel.css'
import '../../../styles/user/Manager/Manager_Dashboard.css'
import { getAuthUser, logoutSession } from '../../../services/auth'
import ManagerSidebar from './components/layout/ManagerSidebar'
import ManagerTopbar from './components/layout/ManagerTopbar'
import ManagerProjectsPanel from './components/panels/ManagerProjectsPanel'
import ManagerTasksPanel from './components/panels/ManagerTasksPanel'
import ManagerTeamsPanel from './components/panels/ManagerTeamsPanel'
import ManagerActivityPanel from './components/panels/ManagerActivityPanel'
import ManagerMyAssignmentsPanel from './components/panels/ManagerMyAssignmentsPanel'
import { useManagerDashboardData } from './hooks/useManagerDashboardData'
import {
  assignTask,
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from '../../../services/tasks'
import { assignTeams, createProject, revokeTeams, updateProject } from '../../../services/projects'
import { addTeamMember, removeTeamMember } from '../../../services/teams'
import type { ApiProjectStatus, ApiTaskStatus } from '../CEOs/types/api.types'
import type { ManagerPanelId, ManagerTaskQuery } from './types/manager.types'

const getInitials = (name?: string): string => {
  if (!name) {
    return 'MG'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MG'
}

const Dashboard_Manager = () => {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_BACKEND_URL ?? ''
  const [activePanel, setActivePanel] = useState<ManagerPanelId>('projects')
  const [isProjectMutating, setIsProjectMutating] = useState(false)
  const [projectActionError, setProjectActionError] = useState('')
  const [isTaskMutating, setIsTaskMutating] = useState(false)
  const [taskActionError, setTaskActionError] = useState('')
  const [isTeamMutating, setIsTeamMutating] = useState(false)
  const [teamActionError, setTeamActionError] = useState('')
  const {
    projects,
    tasks,
    teams,
    activity,
    members,
    myAssignedTasks,
    teamBacklogTasks,
    taskQuery,
    taskPageState,
    setTaskQuery,
    reloadTasks,
    state,
    reloadAll,
    isActivityLoadingMore,
    canLoadMoreActivity,
    loadMoreActivity,
  } = useManagerDashboardData()

  const user = getAuthUser()
  const displayCompanyName = user?.companyName?.trim() || 'TaskIQ'
  const displayUserName = user?.name?.trim() || 'Manager'
  const displayDesignation = user?.role?.trim() || 'Manager'
  const displayUserInitials = getInitials(displayUserName)

  const onSignOut = async () => {
    await logoutSession(apiBase)
    navigate('/login')
  }

  const handleCreateProject = async (payload: {
    projectName: string
    projectDescription?: string
    projectStatus: ApiProjectStatus
    dueDate?: string | null
  }) => {
    setProjectActionError('')
    setIsProjectMutating(true)

    try {
      await createProject(payload)
      await reloadAll()
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : 'Failed to create project')
    } finally {
      setIsProjectMutating(false)
    }
  }

  const handleUpdateProject = async (
    projectId: string,
    payload: {
      projectName: string
      projectDescription?: string
      projectStatus: ApiProjectStatus
      dueDate?: string | null
    }
  ) => {
    setProjectActionError('')
    setIsProjectMutating(true)

    try {
      await updateProject(projectId, payload)
      await reloadAll()
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : 'Failed to update project')
    } finally {
      setIsProjectMutating(false)
    }
  }

  const handleAssignTeams = async (projectId: string, teamIds: string[]) => {
    setProjectActionError('')
    setIsProjectMutating(true)

    try {
      await assignTeams(projectId, teamIds)
      await reloadAll()
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : 'Failed to assign teams')
    } finally {
      setIsProjectMutating(false)
    }
  }

  const handleRevokeTeams = async (projectId: string, teamIds: string[]) => {
    setProjectActionError('')
    setIsProjectMutating(true)

    try {
      await revokeTeams(projectId, teamIds)
      await reloadAll()
    } catch (error) {
      setProjectActionError(error instanceof Error ? error.message : 'Failed to revoke teams')
    } finally {
      setIsProjectMutating(false)
    }
  }

  const handleTaskStatusUpdate = async (taskId: string, status: ApiTaskStatus) => {
    setTaskActionError('')
    setIsTaskMutating(true)

    try {
      await updateTaskStatus(taskId, status)
      await Promise.all([reloadAll(), reloadTasks()])
    } catch (error) {
      setTaskActionError(error instanceof Error ? error.message : 'Failed to update task status')
    } finally {
      setIsTaskMutating(false)
    }
  }

  const handleTaskCreate = async (payload: {
    title: string
    description?: string
    status: ApiTaskStatus
    priority: 'low' | 'medium' | 'high'
    dueDate?: string | null
    projectId: string
    teamId?: string | null
    assigneeMemberId?: string | null
  }) => {
    setTaskActionError('')
    setIsTaskMutating(true)

    try {
      await createTask(payload)
      await Promise.all([reloadAll(), reloadTasks()])
    } catch (error) {
      setTaskActionError(error instanceof Error ? error.message : 'Failed to create task')
    } finally {
      setIsTaskMutating(false)
    }
  }

  const handleTaskEdit = async (
    taskId: string,
    payload: {
      title: string
      description?: string
      status: ApiTaskStatus
      priority: 'low' | 'medium' | 'high'
      dueDate?: string | null
      projectId: string
      teamId?: string | null
      assigneeMemberId?: string | null
    }
  ) => {
    setTaskActionError('')
    setIsTaskMutating(true)

    try {
      await updateTask(taskId, payload)
      await Promise.all([reloadAll(), reloadTasks()])
    } catch (error) {
      setTaskActionError(error instanceof Error ? error.message : 'Failed to update task')
    } finally {
      setIsTaskMutating(false)
    }
  }

  const handleTaskAssigneeUpdate = async (taskId: string, assigneeMemberId: string | null) => {
    setTaskActionError('')
    setIsTaskMutating(true)

    try {
      await assignTask(taskId, assigneeMemberId)
      await Promise.all([reloadAll(), reloadTasks()])
    } catch (error) {
      setTaskActionError(error instanceof Error ? error.message : 'Failed to update task assignee')
    } finally {
      setIsTaskMutating(false)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    setTaskActionError('')
    setIsTaskMutating(true)

    try {
      await deleteTask(taskId)
      await Promise.all([reloadAll(), reloadTasks()])
    } catch (error) {
      setTaskActionError(error instanceof Error ? error.message : 'Failed to delete task')
    } finally {
      setIsTaskMutating(false)
    }
  }

  const handleTaskQueryChange = (updater: (prev: ManagerTaskQuery) => ManagerTaskQuery) => {
    setTaskQuery(updater)
  }

  const handleAddTeamMember = async (teamId: string, memberId: string) => {
    setTeamActionError('')
    setIsTeamMutating(true)

    try {
      await addTeamMember(teamId, memberId)
      await reloadAll()
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : 'Failed to add member to team')
    } finally {
      setIsTeamMutating(false)
    }
  }

  const handleRemoveTeamMember = async (teamId: string, memberId: string) => {
    setTeamActionError('')
    setIsTeamMutating(true)

    try {
      await removeTeamMember(teamId, memberId)
      await reloadAll()
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : 'Failed to revoke member from team')
    } finally {
      setIsTeamMutating(false)
    }
  }

  return (
    <div className="ceo-dashboard-root">
      <ManagerSidebar
        activePanel={activePanel}
        displayCompanyName={displayCompanyName}
        displayDesignation={displayDesignation}
        displayUserName={displayUserName}
        displayUserInitials={displayUserInitials}
        onSwitchPanel={setActivePanel}
        onSignOut={() => void onSignOut()}
      />

      <main className="ceo-main">
        <ManagerTopbar
          activePanel={activePanel}
          onRefresh={() => void reloadAll()}
          onOpenActivity={() => setActivePanel('activity')}
        />

        <section className="ceo-content">
          <ManagerProjectsPanel
            isActive={activePanel === 'projects'}
            isLoading={state.isLoading}
            error={state.error}
            actionError={projectActionError}
            isMutating={isProjectMutating}
            projects={projects}
            teams={teams}
            onCreateProject={(payload) => void handleCreateProject(payload)}
            onUpdateProject={(projectId, payload) => void handleUpdateProject(projectId, payload)}
            onAssignTeams={(projectId, teamIds) => void handleAssignTeams(projectId, teamIds)}
            onRevokeTeams={(projectId, teamIds) => void handleRevokeTeams(projectId, teamIds)}
          />
          <ManagerTasksPanel
            isActive={activePanel === 'tasks'}
            isLoading={state.isLoading}
            error={state.error}
            actionError={taskActionError}
            isMutating={isTaskMutating}
            tasks={tasks}
            members={members}
            projects={projects}
            teams={teams}
            taskQuery={taskQuery}
            taskPageState={taskPageState}
            onTaskQueryChange={handleTaskQueryChange}
            onUpdateStatus={(taskId, status) => void handleTaskStatusUpdate(taskId, status)}
            onAssign={(taskId, assigneeMemberId) => void handleTaskAssigneeUpdate(taskId, assigneeMemberId)}
            onDelete={(taskId) => void handleTaskDelete(taskId)}
            onCreateTask={(payload) => void handleTaskCreate(payload)}
            onEditTask={(taskId, payload) => void handleTaskEdit(taskId, payload)}
          />
          <ManagerMyAssignmentsPanel
            isActive={activePanel === 'my-assignments'}
            isLoading={state.isLoading}
            error={state.error}
            actionError={taskActionError}
            isMutating={isTaskMutating}
            members={members}
            assignedToMe={myAssignedTasks}
            teamTasks={teamBacklogTasks}
            onUpdateStatus={(taskId, status) => void handleTaskStatusUpdate(taskId, status)}
            onAssign={(taskId, assigneeMemberId) => void handleTaskAssigneeUpdate(taskId, assigneeMemberId)}
          />
          <ManagerTeamsPanel
            isActive={activePanel === 'teams'}
            isLoading={state.isLoading}
            error={state.error}
            actionError={teamActionError}
            isMutating={isTeamMutating}
            teams={teams}
            projects={projects}
            tasks={tasks}
            members={members}
            onAddMember={(teamId, memberId) => void handleAddTeamMember(teamId, memberId)}
            onRevokeMember={(teamId, memberId) => void handleRemoveTeamMember(teamId, memberId)}
          />
          <ManagerActivityPanel
            isActive={activePanel === 'activity'}
            isLoading={state.isLoading}
            error={state.error}
            activity={activity}
            isLoadingMore={isActivityLoadingMore}
            canLoadMore={canLoadMoreActivity}
            onLoadMore={() => void loadMoreActivity()}
          />
        </section>
      </main>
    </div>
  )
}

export default Dashboard_Manager
