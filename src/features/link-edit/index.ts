import { useMutation, useQueryClient } from '@tanstack/react-query'
import { linkApi, linkQueryKeys, type UpdateLinkInput } from '@entities/link'

export function useUpdateLink(shortCode: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateLinkInput) => linkApi.update(shortCode, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: linkQueryKeys.all() })
    },
  })
}
