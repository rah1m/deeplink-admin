import { useQuery } from '@tanstack/react-query'
import { userApi, userQueryKeys } from './api'

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: userApi.list,
  })
}
