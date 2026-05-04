export { AppForm } from './ui/app-form'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appApi, appQueryKeys, type CreateAppInput } from '@entities/app'

export function useCreateApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAppInput) => appApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: appQueryKeys.all() }),
  })
}
