import Dashboard_CEO from "../components/user/CEOs/Dashboard_CEO"
import Dashboard_Manager from "../components/user/Manager/Dashboard_Manager"
import Dashboard_Employee from "../components/user/Employee/Dashboard_Employee"
import { getAuthUser } from "../services/auth"

function RoleRender(){
    const role = getAuthUser()?.role

    switch (role) {
        case 'CEO':
            return <Dashboard_CEO />
        case 'Manager':
            return <Dashboard_Manager />
        case 'Employee':
            return <Dashboard_Employee />
        default:
            return <p>Unknown Role</p>
}
}

export default RoleRender