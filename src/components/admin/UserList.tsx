import { formatDate, type UserRow } from "@/lib/queries/users";

/** US-14 M1: the user list – cards on phones, a table from 768 px up. `meId` marks the logged-in admin. */
export function UserList({ users, meId }: { users: UserRow[]; meId?: string }) {
  if (users.length === 0) {
    return <p className="mt-6 rounded-lg border border-dashed border-line bg-surface p-5 text-sm text-muted">No accounts yet.</p>;
  }
  return (
    <>
      {/* Phone: one card per user, so nothing scrolls sideways at 375 px (US-21). */}
      <ul className="mt-6 flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <li key={user.id} className="rounded-lg border border-line bg-surface p-4">
            <p className="font-medium break-words">
              {user.full_name}
              {user.id === meId && <YouTag />}
            </p>
            <p className="text-sm break-all text-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              <span className="text-muted">Created {formatDate(user.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet and desktop: table. */}
      <div className="mt-6 hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-background text-xs tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserTableRow key={user.id} user={user} isMe={user.id === meId} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UserTableRow({ user, isMe }: { user: UserRow; isMe: boolean }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 font-medium">
        {user.full_name}
        {isMe && <YouTag />}
      </td>
      <td className="px-4 py-3 break-all text-muted">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(user.created_at)}</td>
    </tr>
  );
}

function YouTag() {
  return <span className="ml-2 text-xs font-normal text-muted">(you)</span>;
}

function RoleBadge({ role }: { role: UserRow["role"] }) {
  const style = role === "ADMIN" ? "border-brand text-brand" : "border-line text-muted";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>{role}</span>;
}

function StatusBadge({ status }: { status: UserRow["status"] }) {
  const style = status === "ACTIVE" ? "bg-success-surface text-success" : "bg-danger-surface text-danger";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{status}</span>;
}
