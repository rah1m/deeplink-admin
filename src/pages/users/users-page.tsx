import { useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  PageHeader,
  useToast,
  type Column,
} from "@shared/ui";
import { useUsers, type User } from "@entities/user";
import { useApps } from "@entities/app";
import { CreateUserForm, useCreateUser } from "@features/user-create";
import {
  UserPermissionsForm,
  useUpdateUserApps,
  useDeleteUser,
} from "@features/user-permissions";
import {
  ResetUserPasswordForm,
  useResetUserPassword,
} from "@features/user-password-reset";
import { useSession } from "@entities/session";
import { extractError } from "@shared/api";
import { formatDate } from "@shared/lib";

export function UsersPage() {
  const users = useUsers();
  const apps = useApps();
  const me = useSession((s) => s?.user);
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [permsOf, setPermsOf] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resettingPw, setResettingPw] = useState<User | null>(null);

  const create = useCreateUser();
  const setApps = useUpdateUserApps(permsOf?.id ?? 0);
  const remove = useDeleteUser();
  const resetPw = useResetUserPassword(resettingPw?.id ?? 0);

  const appNameOf = (id: number) =>
    apps?.data?.find((a) => a?.id === id)?.name ?? `#${id}`;

  const columns: Column<User>[] = [
    {
      key: "username",
      header: "Username",
      render: (u) => (
        <span>
          <strong>{u?.username}</strong>
          {u?.id === me?.id && (
            <span
              style={{
                marginLeft: 6,
                color: "var(--color-text-subtle)",
                fontSize: 11,
              }}
            >
              (you)
            </span>
          )}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: "140px",
      render: (u) => (
        <Badge tone={u?.role === "super_admin" ? "primary" : "neutral"}>
          {u?.role === "super_admin" ? "Super admin" : "User"}
        </Badge>
      ),
    },
    {
      key: "apps",
      header: "App access",
      render: (u) => {
        if (u?.role === "super_admin")
          return <Badge tone="info">All apps</Badge>;
        if (u?.app_ids?.length === 0)
          return <span style={{ color: "var(--color-text-subtle)" }}>—</span>;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {u?.app_ids?.map((id) => (
              <Badge key={id} tone="neutral">
                {appNameOf(id)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "created",
      header: "Created",
      width: "160px",
      render: (u) => (
        <span style={{ color: "var(--color-text-muted)" }}>
          {formatDate(u?.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "320px",
      render: (u) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {u?.role !== "super_admin" && (
            <Button size="sm" variant="ghost" onClick={() => setPermsOf(u)}>
              Permissions
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setResettingPw(u)}>
            Reset password
          </Button>
          {u?.id !== me?.id && (
            <Button size="sm" variant="ghost" onClick={() => setDeleting(u)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage admin and user accounts. Super admins have full access."
        actions={
          <Button onClick={() => setCreateOpen(true)}>+ New user</Button>
        }
      />

      <DataTable
        columns={columns}
        rows={users?.data}
        rowKey={(u) => u?.id}
        loading={users?.isLoading}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create user"
      >
        <CreateUserForm
          loading={create?.isPending}
          error={create?.isError ? extractError(create?.error) : undefined}
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) =>
            create?.mutate(input, {
              onSuccess: () => {
                toast?.success("User created");
                setCreateOpen(false);
              },
            })
          }
        />
      </Modal>

      <Modal
        open={!!permsOf}
        onClose={() => setPermsOf(null)}
        title={permsOf ? `Permissions — ${permsOf?.username}` : ""}
      >
        {permsOf && (
          <UserPermissionsForm
            user={permsOf}
            loading={setApps?.isPending}
            onCancel={() => setPermsOf(null)}
            onSave={(ids) =>
              setApps?.mutate(ids, {
                onSuccess: () => {
                  toast?.success("Permissions updated");
                  setPermsOf(null);
                },
                onError: (err) => toast?.error(extractError(err)),
              })
            }
          />
        )}
      </Modal>

      <Modal
        open={!!resettingPw}
        onClose={() => {
          setResettingPw(null);
          resetPw?.reset();
        }}
        title={resettingPw ? `Reset password — ${resettingPw?.username}` : ""}
      >
        {resettingPw && (
          <ResetUserPasswordForm
            username={resettingPw?.username}
            loading={resetPw?.isPending}
            error={resetPw?.isError ? extractError(resetPw?.error) : undefined}
            onCancel={() => {
              setResettingPw(null);
              resetPw?.reset();
            }}
            onSubmit={(newPassword) =>
              resetPw?.mutate(newPassword, {
                onSuccess: () => {
                  toast?.success("Password reset");
                  setResettingPw(null);
                  resetPw?.reset();
                },
              })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        description={
          deleting
            ? `User "${deleting?.username}" will lose access immediately. This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        destructive
        loading={remove?.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove?.mutate(deleting?.id, {
            onSuccess: () => {
              toast?.success("User deleted");
              setDeleting(null);
            },
            onError: (err) => toast?.error(extractError(err)),
          });
        }}
      />
    </>
  );
}
