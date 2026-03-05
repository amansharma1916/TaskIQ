import Dashboard_CEO from "../components/user/CEOs/Dashboard_CEO"
interface props {
    role: string
}

function RoleRender({ role }: props){
    switch (role) {
        case 'CEO':
            return <Dashboard_CEO />
        case 'Manager':
            return <p>Manager</p>
        case 'Employee':
            return <p>Employee</p>
        default:
            return <p>Unknown Role</p>
}
}

export default RoleRender