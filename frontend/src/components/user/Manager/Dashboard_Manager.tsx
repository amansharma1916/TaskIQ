import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import '../../../styles/user/CEOs/TaskPanel.css'
import '../../../styles/user/Manager/Manager_Dashboard.css'
import { getAuthUser, logoutSession } from '../../../services/auth'
import ManagerSidebar from './components/layout/ManagerSidebar'
import ManagerTopbar from './components/layout/ManagerTopbar'
import ManagerProjectsPanel from './components/panels/ManagerProjectsPanel'
import ManagerTasksPanel from './components/panels/ManagerTasksPanel'
import ManagerMembersPanel from './components/panels/ManagerMembersPanel'
import ManagerTeamsPanel from './components/panels/ManagerTeamsPanel'
import ManagerActivityPanel from './components/panels/ManagerActivityPanel'
import ManagerUpdatesPanel from './components/panels/ManagerUpdatesPanel'
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
import { addTeamMember, createTeam, removeTeamMember, sendManagerInvite, setTeamLead } from '../../../services/teams'
import { createUpdate as createProjectUpdate, markUpdateRead } from '../../../services/updates'
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
  const [isUpdateMutating, setIsUpdateMutating] = useState(false)
  const [updateActionError, setUpdateActionError] = useState('')
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!actionAlert) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActionAlert(null)
    }, 2500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [actionAlert])
  const {
    projects,
    tasks,
    teams,
    activity,
    updates,
    updatesUnreadCount,
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
    isUpdatesLoadingMore,
    canLoadMoreUpdates,
    loadMoreUpdates,
    reloadUpdates,
  } = useManagerDashboardData()

  const user = getAuthUser()
  const displayCompanyName = user?.companyName?.trim() || 'TaskIQ'
  const displayUserName = user?.name?.trim() || 'Manager'
  const displayDesignation = user?.role === 'Manager' && user?.managerScope === 'team' ? 'Team Manager' : user?.role?.trim() || 'Manager'
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

  const handleCreateTeam = async (payload: {
    teamName: string
    teamDescription?: string
    teamTags?: string[]
  }) => {
    setTeamActionError('')
    setIsTeamMutating(true)

    try {
      await createTeam(payload)
      await reloadAll()
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setIsTeamMutating(false)
    }
  }

  const handleSetTeamLead = async (teamId: string, memberId: string) => {
    setTeamActionError('')
    setIsTeamMutating(true)

    try {
      await setTeamLead(teamId, memberId)
      await reloadAll()
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : 'Failed to set team lead')
    } finally {
      setIsTeamMutating(false)
    }
  }

  const handleSendInvite = async (payload: {
    name: string
    email: string
    role: 'Manager' | 'Employee'
    scopeTeamIds: string[]
  }) => {
    setTeamActionError('')
    setIsTeamMutating(true)

    try {
      await sendManagerInvite(payload)
      await reloadAll()
      setActionAlert({ type: 'success', message: 'Invite sent successfully.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invite'
      setTeamActionError(message)
      setActionAlert({ type: 'error', message })
      throw error
    } finally {
      setIsTeamMutating(false)
    }
  }

  const handleCreateUpdate = async (payload: {
    title: string
    body: string
    priority: 'low' | 'medium' | 'high'
    isPinned?: boolean
    projectId?: string | null
    audience: {
      mode: 'company' | 'teams' | 'projectTeams'
      teamIds?: string[]
      roles?: Array<'CEO' | 'Manager' | 'Employee'>
    }
  }) => {
    setUpdateActionError('')
    setIsUpdateMutating(true)

    try {
      await createProjectUpdate(payload)
      await reloadUpdates()
      setActionAlert({ type: 'success', message: 'Update posted successfully.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post update'
      setUpdateActionError(message)
      setActionAlert({ type: 'error', message })
    } finally {
      setIsUpdateMutating(false)
    }
  }

  const handleMarkUpdateRead = async (updateId: string) => {
    try {
      await markUpdateRead(updateId)
      await reloadUpdates()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark update as read'
      setUpdateActionError(message)
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
          onOpenUpdates={() => setActivePanel('updates')}
          unreadUpdatesCount={updatesUnreadCount}
        />

        {actionAlert ? (
          <div className={`ceo-action-alert ${actionAlert.type === 'success' ? 'success' : 'error'}`} role="status">
            <span>{actionAlert.message}</span>
            <button aria-label="Dismiss alert" onClick={() => setActionAlert(null)} type="button">
              X
            </button>
          </div>
        ) : null}

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
          <ManagerMembersPanel
            isActive={activePanel === 'members'}
            isLoading={state.isLoading}
            error={state.error}
            members={members}
            teams={teams}
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
            onCreateTeam={(payload) => void handleCreateTeam(payload)}
            onSetTeamLead={(teamId, memberId) => void handleSetTeamLead(teamId, memberId)}
            onSendInvite={(payload) => handleSendInvite(payload)}
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
          <ManagerUpdatesPanel
            isActive={activePanel === 'updates'}
            isLoading={state.isLoading}
            error={state.error}
            updates={updates}
            unreadCount={updatesUnreadCount}
            canPostUpdates={user?.role === 'Manager'}
            projects={projects}
            teams={teams}
            isPostingUpdate={isUpdateMutating}
            updateActionError={updateActionError}
            onCreateUpdate={(payload) => void handleCreateUpdate(payload)}
            onMarkUpdateRead={(updateId) => void handleMarkUpdateRead(updateId)}
            isLoadingMore={isUpdatesLoadingMore}
            canLoadMore={canLoadMoreUpdates}
            onLoadMore={() => void loadMoreUpdates()}
          />
        </section>
      </main>
    </div>
  )
}

export default Dashboard_Manager
