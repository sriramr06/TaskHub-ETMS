import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { UsersListPage } from '@/pages/users/UsersListPage';
import { UserDetailPage } from '@/pages/users/UserDetailPage';
import { EmployeesListPage } from '@/pages/employees/EmployeesListPage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { TeamsListPage } from '@/pages/teams/TeamsListPage';
import { TeamDetailPage } from '@/pages/teams/TeamDetailPage';
import { ProjectsListPage } from '@/pages/projects/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { TasksListPage } from '@/pages/tasks/TasksListPage';
import { TaskDetailPage } from '@/pages/tasks/TaskDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/users" element={<UsersListPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />

          <Route path="/employees" element={<EmployeesListPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />

          <Route path="/teams" element={<TeamsListPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />

          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          <Route path="/tasks" element={<TasksListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
