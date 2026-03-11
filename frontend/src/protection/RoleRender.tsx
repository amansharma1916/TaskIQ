import Dashboard_CEO from "../components/user/CEOs/Dashboard_CEO"
import Dashboard_Manager from "../components/user/Manager/Dashboard_Manager"
import { getAuthUser } from "../services/auth"

function RoleRender(){
    const role = getAuthUser()?.role

    switch (role) {
        case 'CEO':
            return <Dashboard_CEO />
        case 'Manager':
            return <Dashboard_Manager />
        case 'Employee':
            return <p>Employee</p>
        default:
            return <p>Unknown Role</p>
}
}

export default RoleRender