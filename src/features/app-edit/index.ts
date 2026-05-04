import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appApi, appQueryKeys, type UpdateAppInput } from '@entities/app'

export function useUpdateApp(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateAppInput) => appApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: appQueryKeys.all() }),
  })
}
