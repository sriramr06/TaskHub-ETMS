import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import * as usersApi from '@/api/users';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserRole, UserStatus, enumLabel } from '@/lib/constants';
import { statusTone } from '@/lib/statusTone';

export const UsersListPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search, role, status }],
    queryFn: () =>
      usersApi.listUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Manage all user accounts in TaskHub.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or email"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="w-40"
        >
          <option value="">All roles</option>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {enumLabel(r)}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="w-40"
        >
          <option value="">All statuses</option>
          {Object.values(UserStatus).map((s) => (
            <option key={s} value={s}>
              {enumLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {isLoading && <PageSpinner />}
        {!isLoading && data?.users.length === 0 && (
          <EmptyState title="No users found" description="Try adjusting your filters." />
        )}
        {!isLoading && data && data.users.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/users/${u._id}`} className="flex items-center gap-3">
                        <Avatar name={`${u.firstName} ${u.lastName}`} src={u.avatar} />
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(u.role)}>{enumLabel(u.role)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(u.status)}>{enumLabel(u.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
};
