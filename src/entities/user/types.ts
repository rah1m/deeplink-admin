export type UserRole = 'super_admin' | 'user'

export interface User {
  id: number
  username: string
  role: UserRole
  app_ids: number[]
  created_at?: string
}

export interface CreateUserInput {
  username: string
  password: string
  role: UserRole
}

export interface UpdateUserAppsInput {
  app_ids: number[]
}
