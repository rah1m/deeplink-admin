import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkApi, linkQueryKeys, type UpdateLinkInput } from '@entities/link'

export function useUpdateLink(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateLinkInput) => linkApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: linkQueryKeys.all() })
    },
  })
}

export function useDeleteLink(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => linkApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: linkQueryKeys.all() })
    },
  })
}
